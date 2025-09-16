window.ServerDB = {
  getDrivers: async function(){ const r = await fetch('/api/drivers'); if(!r.ok) throw new Error('failed'); return r.json(); },
  addDriver: async function(d){ const r = await fetch('/api/drivers', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(d)}); return r.json(); },
  updateDriver: async function(id, upd){
    // ensure the server receives the id (query) and the updates in the body
    const url = '/api/drivers?id='+encodeURIComponent(id);
    const payload = Object.assign({}, upd, { id });
    const r = await fetch(url, { method:'PUT', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)});
    return r.json();
  },
  deleteDriver: async function(id){ const r = await fetch('/api/drivers?id='+encodeURIComponent(id), { method:'DELETE'}); return r.json(); },
  getPayments: async function(date){ const q = date ? '?date='+encodeURIComponent(date) : ''; const r = await fetch('/api/payments'+q); if(!r.ok) throw new Error('failed'); return r.json(); },
  addPayment: async function(p){ const r = await fetch('/api/payments', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(p)}); return r.json(); },
  deletePaymentsByDate: async function(date){ const r = await fetch('/api/payments?date='+encodeURIComponent(date), { method:'DELETE'}); return r.json(); },
  getSettings: async function(){ const r = await fetch('/api/settings'); if(!r.ok) return null; return r.json(); },
  updateSettings: async function(s){ const r = await fetch('/api/settings', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(s)}); return r.json(); },
  getApprovedDriver: async function(){ const r = await fetch('/api/approved-driver'); if(!r.ok) return null; return r.json(); },
  setApprovedDriver: async function(d){ const r = await fetch('/api/approved-driver', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(d)}); return r.json(); }
};
