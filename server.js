const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'data.json');

function readData(){
  try{ return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); }catch(e){
    return { settings: null, drivers: [], payments: [] };
  }
}

function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ensure default data
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

if(!fs.existsSync(DATA_FILE)){
  writeData({ settings: defaultSettings, drivers: [], payments: [] });
}

// Serve static files
app.use('/', express.static(path.join(__dirname)));

// Simple API shim for ServerDB used by client
app.get('/api/settings', (req, res) => {
  const data = readData();
  res.json(data.settings || defaultSettings);
});

app.post('/api/settings', (req, res) => {
  const data = readData();
  data.settings = { ...(data.settings || {}), ...(req.body || {}) };
  writeData(data);
  res.json({ ok: true, settings: data.settings });
});

app.get('/api/drivers', (req, res) => {
  const data = readData();
  res.json(data.drivers || []);
});

// Return a single driver by id
app.get('/api/drivers/:id', (req, res) => {
  const id = req.params.id;
  const data = readData();
  const drv = (data.drivers || []).find(d => String(d.id) === String(id));
  if(!drv) return res.status(404).json({ error: 'not found' });
  res.json(drv);
});

app.post('/api/drivers', (req, res) => {
  const data = readData();
  const driver = req.body;
  // if id present, update existing
  if(driver && driver.id){
    const idx = data.drivers.findIndex(d => String(d.id) === String(driver.id));
    if(idx !== -1){ data.drivers[idx] = { ...data.drivers[idx], ...driver }; }
    else { data.drivers.push(driver); }
  } else if(driver){
    driver.id = Date.now();
    data.drivers.push(driver);
  }
  // If driver was marked as paid, record as last approved driver
  try{
    const affected = driver && (driver.paymentStatus === 'paid');
    if(affected){
      data.lastApprovedDriver = { ...(driver), ts: Date.now() };
    }
  }catch(e){}
  writeData(data);
  res.json({ ok: true, driver });
});

app.put('/api/drivers/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const data = readData();
  const idx = data.drivers.findIndex(d => String(d.id) === String(id));
  if(idx === -1) return res.status(404).json({ error: 'not found' });
  data.drivers[idx] = { ...data.drivers[idx], ...updates };
  // If driver was approved (paymentStatus set to 'paid'), record it as lastApprovedDriver
  try{
    if(updates && updates.paymentStatus === 'paid'){
      data.lastApprovedDriver = { ...data.drivers[idx], ts: Date.now() };
    }
  }catch(e){}
  writeData(data);
  res.json({ ok: true, driver: data.drivers[idx] });
});

// Return the last approved driver (for cross-browser update polling)
app.get('/api/approved-driver', (req, res) => {
  const data = readData();
  res.json(data.lastApprovedDriver || null);
});

app.delete('/api/drivers/:id', (req, res) => {
  const id = req.params.id;
  const data = readData();
  data.drivers = data.drivers.filter(d => String(d.id) !== String(id));
  writeData(data);
  res.json({ ok: true });
});

app.get('/api/payments', (req, res) => {
  const data = readData();
  const payments = data.payments || [];
  // allow filtering by date (YYYY-MM-DD) via query param
  const date = req.query.date;
  if(date){
    const filtered = payments.filter(p => String(p.date || '').startsWith(String(date)));
    return res.json(filtered);
  }
  res.json(payments);
});

// Summary endpoint: total drivers, total revenue for a date, pending drivers count
app.get('/api/payments/summary', (req, res) => {
  const data = readData();
  const drivers = data.drivers || [];
  const payments = data.payments || [];
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const dailyPayments = payments.filter(p => String(p.date || '').startsWith(String(date)));
  const dailyTotal = dailyPayments.filter(p => p.status === 'completed').reduce((s,p) => s + (p.amount || 0), 0);
  const paidCount = dailyPayments.filter(p => p.status === 'completed').length;
  const pendingCount = (drivers.filter(d => d.paymentStatus === 'pending')).length;

  res.json({ date, totalDrivers: drivers.length, dailyTotal, paidCount, pendingCount });
});

// Delete payments for a given date (backup returned)
app.delete('/api/payments/daily', (req, res) => {
  const data = readData();
  const payments = data.payments || [];
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const toRemove = payments.filter(p => String(p.date || '').startsWith(String(date)));
  const remaining = payments.filter(p => !String(p.date || '').startsWith(String(date)));

  // persist remaining payments and return backup of removed payments
  data.payments = remaining;
  writeData(data);

  res.json({ ok: true, removedCount: toRemove.length, backup: toRemove });
});

app.post('/api/payments', (req, res) => {
  const data = readData();
  const payment = req.body;
  if(payment){ payment.id = payment.id || Date.now(); data.payments.push(payment); }
  writeData(data);
  res.json({ ok: true, payment });
});

app.put('/api/payments/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const data = readData();
  const idx = data.payments.findIndex(p => String(p.id) === String(id));
  if(idx === -1) return res.status(404).json({ error: 'not found' });
  data.payments[idx] = { ...data.payments[idx], ...updates };
  writeData(data);
  res.json({ ok: true, payment: data.payments[idx] });
});

// Minimal ServerDB shim endpoint used by client (browser) to detect server presence and call methods
app.get('/server-db-shim.js', (req, res) => {
  // Serve a tiny script that exposes window.ServerDB with methods calling our /api endpoints
  res.type('application/javascript');
  res.send(`(function(){
    const base = '';
    async function getJSON(url){ const r = await fetch(url); return r.json(); }
    window.ServerDB = {
      getSettings: ()=> getJSON('/api/settings'),
      updateSettings: (s)=> fetch('/api/settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(s)}).then(r=>r.json()),
      getDrivers: ()=> getJSON('/api/drivers'),
      addDriver: (d)=> fetch('/api/drivers',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)}).then(r=>r.json()),
      updateDriver: (id, updates)=> fetch('/api/drivers/'+id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(updates)}).then(r=>r.json()),
      deleteDriver: (id)=> fetch('/api/drivers/'+id,{method:'DELETE'}).then(r=>r.json()),
      getPayments: ()=> getJSON('/api/payments'),
      addPayment: (p)=> fetch('/api/payments',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(p)}).then(r=>r.json()),
      updatePayment: (id, updates)=> fetch('/api/payments/'+id,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(updates)}).then(r=>r.json())
    };
  })();`);
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Server running on http://localhost:'+port));
