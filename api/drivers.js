const { query } = require('./db');

module.exports = async function (req, res) {
  const method = req.method;
  try{
    if(method === 'GET'){
      const r = await query('SELECT * FROM drivers ORDER BY id DESC');
      res.status(200).json(r.rows);
      return;
    }

    if(method === 'POST'){
      const d = req.body;
      const id = d.id || Date.now();
      await query(`INSERT INTO drivers(id,name,cpf,email,phone,city,state,password,vehicletype,vehicleplate,photos,paymentstatus,paymentmethod,registrationdate,billingtype) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, cpf=EXCLUDED.cpf, email=EXCLUDED.email, phone=EXCLUDED.phone, city=EXCLUDED.city, state=EXCLUDED.state, password=EXCLUDED.password, vehicletype=EXCLUDED.vehicletype, vehicleplate=EXCLUDED.vehicleplate, photos=EXCLUDED.photos, paymentstatus=EXCLUDED.paymentstatus, paymentmethod=EXCLUDED.paymentmethod, registrationdate=EXCLUDED.registrationdate, billingtype=EXCLUDED.billingtype`, [id,d.name,d.cpf,d.email,d.phone,d.city,d.state,d.password,d.vehicleType||d.vehicletype,d.vehiclePlate||d.vehicleplate, JSON.stringify(d.photos||[]), d.paymentStatus||d.paymentstatus, d.paymentMethod||d.paymentmethod, d.registrationDate||d.registrationdate, d.billingType||d.billingtype]);
      res.status(200).json({ok:true,id});
      return;
    }

    if(method === 'PUT'){
      const id = req.query.id || (req.body && req.body.id);
      const updates = req.body || {};
      // Debug instrumentation: log incoming PUT and payload
      console.log('PUT /api/drivers received', { id, updates });

      // map common camelCase keys from client to DB column names
      const keyMap = {
        paymentStatus: 'paymentstatus',
        paymentMethod: 'paymentmethod',
        vehicleType: 'vehicletype',
        vehiclePlate: 'vehicleplate',
        registrationDate: 'registrationdate',
        billingType: 'billingtype',
        vehicleType: 'vehicletype'
      };

      const fields = [];
      const values = [];
      let idx = 1;
      for(const k of Object.keys(updates)){
        // translate key to DB column name if needed
        const col = keyMap[k] || k.toLowerCase();
        fields.push(`${col} = $${idx}`);
        let val = updates[k];
        // serialize photos array if present
        if(col === 'photos' && val && typeof val !== 'string'){
          try{ val = JSON.stringify(val); }catch(e){}
        }
        values.push(val);
        idx++;
      }
      if(fields.length===0){ res.status(400).json({error:'no updates'}); return; }
      values.push(id);
      const sql = `UPDATE drivers SET ${fields.join(',')} WHERE id = $${idx}`;
      await query(sql, values);
      // Echo back received data to help client-side debugging
      res.status(200).json({ok:true, received: { id, updates }});
      return;
    }

    if(method === 'DELETE'){
      const id = req.query.id;
      if(!id){ res.status(400).json({error:'missing id'}); return; }
      await query('DELETE FROM drivers WHERE id = $1', [id]);
      res.status(200).json({ok:true});
      return;
    }

    res.status(405).json({error:'method not allowed'});
  }catch(e){ console.error(e); res.status(500).json({error: String(e)}); }
};
