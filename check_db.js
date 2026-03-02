import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;
const pool = new Pool({
    connectionString: 'postgresql://postgres:JBafIjWsuPVvxlLmkAsOdYUYdgyvjtvJ@gondola.proxy.rlwy.net:21885/railway',
    ssl: { rejectUnauthorized: false }
});

async function fullAudit() {
    const users = await pool.query(`SELECT * FROM users ORDER BY created_at`);
    let output = '';
    users.rows.forEach((u, i) => {
        output += `${i + 1}. display_name="${u.display_name}" | username="${u.username}" | id="${u.id}" | avatar="${u.avatar}" | created="${u.created_at}" | last_login="${u.last_login}"\n`;
    });
    fs.writeFileSync('full_audit.txt', output);
    console.log(output);
    await pool.end();
}
fullAudit();
