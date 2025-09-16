const { Pool } = require('pg');

async function main(){
  const conn = process.env.DATABASE_URL;
  if(!conn){
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try{
    console.log('Using connection:', conn.replace(/:[^:@]+@/, ':*****@'));
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;");
    console.log('\nPublic tables:');
    console.log(tables.rows.map(r=>r.tablename).join('\n'));

    const admins = await pool.query('SELECT id, username, created_at FROM admins ORDER BY id;');
    console.log('\nAdmins:');
    if(admins.rows.length===0){
      console.log('(no admins found)');
    } else {
      console.table(admins.rows);
    }

    const meta = await pool.query("SELECT key, value FROM meta ORDER BY key;");
    console.log('\nMeta:');
    console.log(meta.rows);
  }catch(err){
    console.error('Error querying DB:', err.message || err);
    process.exitCode = 1;
  }finally{
    await pool.end();
  }
}

main();
