import pg from 'pg';
import Database from 'better-sqlite3';
import 'dotenv/config';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

async function superWipe() {
    console.log("🌊 STARTING RECONSTRUCTION: FULL DATA WIPE & SCHEMA RE-INIT...");

    // 1. Postgres Wipe
    if (connectionString) {
        try {
            console.log("Connecting to Postgres for wipe...");
            const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

            console.log("Dropping existing Postgres tables...");
            await pool.query('DROP TABLE IF EXISTS user_stats CASCADE');
            await pool.query('DROP TABLE IF EXISTS users CASCADE');

            console.log("Re-initializing Postgres schema...");
            await pool.query(`
                CREATE TABLE users (
                    id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255),
                    display_name VARCHAR(255),
                    avatar VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
            `);

            await pool.query(`
                CREATE TABLE user_stats (
                    user_id VARCHAR(255),
                    mode VARCHAR(50) DEFAULT 'casual',
                    games_played INTEGER DEFAULT 0,
                    wins INTEGER DEFAULT 0,
                    total_score INTEGER DEFAULT 0,
                    highest_round_score INTEGER DEFAULT 0,
                    farkles_count INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, mode),
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );
            `);
            console.log("✅ Postgres Fully Reconstructed.");
            await pool.end();
        } catch (e) {
            console.error("❌ Postgres Wipe Failed:", e.message);
        }
    }

    // 2. SQLite Wipe
    try {
        console.log("Connecting to SQLite for wipe...");
        const sqliteDb = new Database('farkle.db');

        console.log("Dropping existing SQLite tables...");
        sqliteDb.prepare('DROP TABLE IF EXISTS user_stats').run();
        sqliteDb.prepare('DROP TABLE IF EXISTS users').run();

        console.log("Re-initializing SQLite schema...");
        sqliteDb.prepare(`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT,
                display_name TEXT,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )
        `).run();

        sqliteDb.prepare(`
            CREATE TABLE user_stats (
                user_id TEXT,
                mode TEXT DEFAULT 'casual',
                games_played INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                total_score INTEGER DEFAULT 0,
                highest_round_score INTEGER DEFAULT 0,
                farkles_count INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, mode),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `).run();
        console.log("✅ SQLite Fully Reconstructed.");
    } catch (e) {
        console.error("❌ SQLite Wipe Failed:", e.message);
    }

    // 3. Clear Analytics cache if it exists
    try {
        const fs = await import('fs');
        if (fs.existsSync('analytics_data.json')) {
            fs.unlinkSync('analytics_data.json');
            console.log("🧹 Analytics Cache Wiped.");
        }
    } catch (e) { }

    console.log("------------------------------------------");
    console.log("✨ FRESH START COMPLETE.");
    console.log("The system is now a clean slate with optimized schemas.");
    console.log("------------------------------------------");
    process.exit(0);
}

superWipe().catch(err => {
    console.error("Fatal Reconstruction Error:", err);
    process.exit(1);
});
