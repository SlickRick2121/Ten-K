import pg from 'pg';
import Database from 'better-sqlite3';
import 'dotenv/config';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

async function runCleanup() {
    console.log("🚀 Starting Data Optimization & Cleanup...");

    let pool = null;
    let sqliteDb = null;

    // Connect to PG if possible
    if (connectionString) {
        try {
            console.log("Attempting Postgres connection...");
            pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
            await pool.query('SELECT 1');
            console.log("✅ Connected to PostgreSQL.");
            await cleanupPostgres(pool);
        } catch (e) {
            console.error("❌ Postgres connection failed (Maybe running locally?):", e.message);
        }
    }

    // Connect to SQLite
    try {
        sqliteDb = new Database('farkle.db');
        console.log("✅ Connected to SQLite.");
        await cleanupSQLite(sqliteDb);
    } catch (e) {
        console.warn("⚠️ SQLite optimization skipped (not found or busy).");
    }

    console.log("------------------------------------------");
    console.log("✨ Optimization Complete!");
    console.log("Note: Future logins will now use corrected parsing logic.");
    console.log("------------------------------------------");
    process.exit(0);
}

async function cleanupPostgres(pool) {
    console.log("--- Optimizing Postgres Data ---");

    // 1. Identify numeric/empty names
    const numericUsers = await pool.query(`
        SELECT id, username, display_name 
        FROM users 
        WHERE display_name ~ '^[0-9]+$' 
           OR username ~ '^[0-9]+$'
           OR display_name IS NULL
           OR display_name = ''
    `);

    console.log(`Analyzing ${numericUsers.rows.length} potentially numeric profiles...`);

    for (const user of numericUsers.rows) {
        const stats = await pool.query('SELECT games_played FROM user_stats WHERE user_id = $1', [user.id]);
        const gamesPlayed = stats.rows[0]?.games_played || 0;

        if (gamesPlayed === 0) {
            console.log(`🗑️ Removing inactive numeric profile: ${user.id}`);
            await pool.query('DELETE FROM user_stats WHERE user_id = $1', [user.id]);
            await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
        } else {
            const newName = `Player ${user.id.substring(0, 4)}`;
            console.log(`🔧 Correcting active numeric name: ${user.id} -> ${newName}`);
            await pool.query('UPDATE users SET display_name = $1 WHERE id = $2', [newName, user.id]);
        }
    }

    const orphans = await pool.query(`DELETE FROM user_stats WHERE user_id NOT IN (SELECT id FROM users)`);
    if (orphans.rowCount > 0) console.log(`🧹 Cleared ${orphans.rowCount} orphaned stats.`);
}

async function cleanupSQLite(db) {
    console.log("--- Optimizing SQLite Data ---");

    const users = db.prepare('SELECT id, username, display_name FROM users').all();
    const targets = users.filter(u =>
        (u.display_name && /^\d+$/.test(u.display_name)) ||
        (u.username && /^\d+$/.test(u.username)) ||
        (!u.display_name)
    );

    console.log(`Analyzing ${targets.length} potentially numeric profiles...`);

    for (const user of targets) {
        const stats = db.prepare('SELECT games_played FROM user_stats WHERE user_id = ?').get(user.id);
        const gamesPlayed = stats ? stats.games_played : 0;

        if (gamesPlayed === 0) {
            console.log(`🗑️ Removing inactive numeric profile: ${user.id}`);
            db.prepare('DELETE FROM user_stats WHERE user_id = ?').run(user.id);
            db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
        } else {
            const newName = `Player ${user.id.substring(0, 4)}`;
            console.log(`🔧 Correcting active numeric name: ${user.id} -> ${newName}`);
            db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(newName, user.id);
        }
    }

    const orphans = db.prepare('DELETE FROM user_stats WHERE user_id NOT IN (SELECT id FROM users)').run();
    if (orphans.changes > 0) console.log(`🧹 Cleared ${orphans.changes} orphaned stats.`);
}

runCleanup().catch(err => {
    console.error("Fatal Optimization Error:", err);
    process.exit(1);
});
