const { query } = require('./db');

module.exports = async function(req,res){
  const method = req.method;
  try{
    if(method === 'GET'){
      const date = req.query.date;
      if(date){
        const r = await query("SELECT * FROM payments WHERE date::text LIKE $1 ORDER BY date DESC", [date+'%']);
        res.status(200).json(r.rows); return;
      }
      const r = await query('SELECT * FROM payments ORDER BY date DESC');
      res.status(200).json(r.rows); return;
    }

    if(method === 'POST'){
      const p = req.body;
      const id = p.id || Date.now();
      await query('INSERT INTO payments(id,driverid,amount,method,status,date,raw) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET driverid=EXCLUDED.driverid, amount=EXCLUDED.amount, method=EXCLUDED.method, status=EXCLUDED.status, date=EXCLUDED.date, raw=EXCLUDED.raw', [id,p.driverId||p.driverid,p.amount,p.method||p.paymentMethod,p.status,p.date||new Date().toISOString(), JSON.stringify(p)]);
      res.status(200).json({ok:true,id}); return;
    }

    if(method === 'DELETE'){
      // support deleting by date param
      const date = req.query.date;
      if(date){
        const r = await query("DELETE FROM payments WHERE date::text LIKE $1 RETURNING id", [date+'%']);
        res.status(200).json({ok:true, removedCount: r.rowCount, removed: r.rows}); return;
      }
      const id = req.query.id;
      if(!id){ res.status(400).json({error:'missing id or date'}); return; }
      await query('DELETE FROM payments WHERE id = $1', [id]);
      res.status(200).json({ok:true}); return;
    }

    res.status(405).json({error:'method not allowed'});
  }catch(e){ console.error(e); res.status(500).json({error: String(e)}); }
};
