const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main(){
  const conn = process.env.DATABASE_URL;
  if(!conn){
    console.error('Please set DATABASE_URL in the environment');
    process.exit(2);
  }

  const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  try{
    // generate a random strong password
    const newPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g,'A').slice(0,16);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // update admin password for username 'admin'
    const res = await pool.query("UPDATE admins SET password_hash=$1 WHERE username='admin' RETURNING id, username;", [hash]);
    if(res.rowCount===0){
      console.error('No admin user named "admin" found.');
      process.exitCode = 1;
    } else {
      console.log('Updated admin password for', res.rows[0].username);
      console.log('NEW_PASSWORD:' , newPassword);
      console.log('\nKeep this password safe; it will not be stored elsewhere.');
    }
  }catch(err){
    console.error('Error:', err.message||err);
    process.exitCode = 1;
  }finally{
    await pool.end();
  }
}

main();
