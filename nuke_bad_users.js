import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: 'postgresql://postgres:JBafIjWsuPVvxlLmkAsOdYUYdgyvjtvJ@gondola.proxy.rlwy.net:21885/railway',
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    // 1. Delete ALL rt_ prefixed entries (reconnect tokens should NEVER be in users table)
    const del1 = await pool.query(`DELETE FROM user_stats WHERE user_id LIKE 'rt_%'`);
    const del2 = await pool.query(`DELETE FROM users WHERE id LIKE 'rt_%'`);
    console.log(`Purged ${del2.rowCount} reconnect-token ghost entries.`);

    // 2. Delete the old "escobxrr" entry (ID 1256365134826311751) - it's a stale duplicate.
    //    The real account is Ξ (escrow.40, ID 1283635559411093546)
    await pool.query(`DELETE FROM user_stats WHERE user_id = '1256365134826311751'`);
    await pool.query(`DELETE FROM users WHERE id = '1256365134826311751'`);
    console.log(`Purged stale escobxrr duplicate.`);

    // 3. Verify
    const users = await pool.query(`SELECT id, username, display_name, avatar FROM users ORDER BY created_at`);
    console.log(`\n✅ Final Clean State: ${users.rows.length} users`);
    users.rows.forEach((u, i) => {
        console.log(`  ${i + 1}. ${u.display_name} (${u.username}) | avatar: ${u.avatar ? '✅' : '❌'}`);
    });

    await pool.end();
}
fix();
