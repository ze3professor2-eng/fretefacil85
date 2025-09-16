const { query } = require('./db');

module.exports = async function(req,res){
  try{
    if(req.method === 'GET'){
      const r = await query("SELECT value FROM meta WHERE key='settings'");
      if(r.rowCount) return res.status(200).json(r.rows[0].value);
      return res.status(200).json(null);
    }
    if(req.method === 'POST' || req.method === 'PUT'){
      const payload = req.body;
      await query("INSERT INTO meta(key,value) VALUES('settings',$1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [payload]);
      return res.status(200).json({ok:true});
    }
    res.status(405).json({error:'method not allowed'});
  }catch(e){ console.error(e); res.status(500).json({error: String(e)}); }
};
