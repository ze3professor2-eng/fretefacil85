const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main(){
  const conn = process.env.DATABASE_URL;
  if(!conn){
    console.error('DATABASE_URL not set. Create a Neon DB and set DATABASE_URL environment variable before running this script.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  const sqlPath = path.join(__dirname, '..', 'db', 'init.sql');
  let sql = '';
  try{ sql = fs.readFileSync(sqlPath, 'utf8'); }catch(e){ console.error('Could not read db/init.sql', e); process.exit(1); }

  console.log('Connecting to database...');
  const client = await pool.connect();
  try{
    console.log('Running schema SQL from db/init.sql...');
    await client.query(sql);

    // Insert default settings into meta table if not present
    const defaultSettings = {
      subscriptionFee: 99.90,
      subscriptionType: 'one-time',
      contactEmail: 'contato@connectfrete.com',
      contactPhone: '(11) 99999-9999',
      backgroundImage: '',
      bankAccount: '',
      pixKey: '',
      pixDisplayName: 'Connect Frete',
      pixDisplayPhone: '(11) 99999-9999',
      adminCredentials: { username: 'admin', password: 'admin123' }
    };

    const r = await client.query("SELECT value FROM meta WHERE key='settings'");
    if(r.rowCount === 0){
      console.log('Inserting default settings into meta...');
      await client.query("INSERT INTO meta(key,value) VALUES('settings',$1)", [defaultSettings]);
    } else {
      console.log('Settings already present in meta, skipping seed.');
    }

    // Create a default admin account if no admins exist
    const adminsRes = await client.query('SELECT id, username FROM admins LIMIT 1');
    if(adminsRes.rowCount === 0){
      const adminUser = defaultSettings.adminCredentials.username || 'admin';
      const adminPass = defaultSettings.adminCredentials.password || 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      console.log(`Inserting default admin user '${adminUser}' (password is the seeded value)`);
      await client.query('INSERT INTO admins(username,password_hash) VALUES($1,$2)', [adminUser, hash]);
    } else {
      console.log('Admin account(s) already present, skipping admin seed.');
    }

    console.log('Migration completed successfully.');
  }catch(err){
    console.error('Migration failed:', err);
    process.exitCode = 2;
  }finally{
    client.release();
    await pool.end();
  }
}

if(require.main === module){
  main();
}
