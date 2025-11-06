// === CONFIG ===
const ENDPOINT_URL = 'https://corsproxy.io/?https://script.google.com/macros/s/AKfycbwzcBv7TCNV8GZQ9dNO0-F07togSqKIHVvaynE-1E6Jr8w4lFumEPACStIGs2TidRXo/exec';
const API_KEY = 'gennaro-kromatica-2025-key';

// === VARIABILI ===
const QUEUE_KEY = 'kromatica_queue_v1';
let IS_SYNCING = false;

// === ROUTER SEMPLICE ===
const routes = ['home','riepilogo','saldo'];
function show(route){
  routes.forEach(r => {
    document.getElementById('page-'+r).classList.toggle('hidden', r!==route);
  });
  location.hash = '#'+route;
}
window.addEventListener('hashchange', ()=>{
  const r = (location.hash.replace('#','')||'home');
  show(routes.includes(r)?r:'home');
});
document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click',()=> show(b.dataset.route)));
show((location.hash.replace('#',''))||'home');

// === GENERA ID UNICO ===
function generateId() {
  return 'ID-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

// === CODA OFFLINE ===
function getQueue(){ try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
function setQueue(q){ localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
function clearQueue(){ localStorage.removeItem(QUEUE_KEY); }

// === INVIO ===
async function sendPayload(payload) {
  try {
    const res = await fetch(ENDPOINT_URL + '?key=' + encodeURIComponent(API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: API_KEY, ...payload })
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { ok: true }; }
  } catch (err) {
    return { ok: false };
  }
}

// === SYNC SOLO QUANDO TORNA ONLINE ===
async function syncQueue() {
  if (IS_SYNCING) return;
  IS_SYNCING = true;
  const queue = getQueue();
  if (!queue.length) { IS_SYNCING = false; return; }
  const remaining = [];
  for (const payload of queue) {
    const r = await sendPayload(payload);
    if (!r.ok) remaining.push(payload);
  }
  if (remaining.length) setQueue(remaining); else clearQueue();
  IS_SYNCING = false;
}
window.addEventListener('online', syncQueue);

// === FORM HOME ===
window.addEventListener('load', () => {
  // default route
  const form = document.getElementById('cashForm');
  const status = document.getElementById('status');
  const dateEl = document.getElementById('date');
  if (dateEl) dateEl.valueAsDate = new Date();

  if (form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Invio in corso…';
      const payload = {
        id: generateId(),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        income: document.getElementById('income').value,
        expense: document.getElementById('expense').value
      };
      const response = await sendPayload(payload);
      if (response && response.ok) {
        status.textContent = '✅ Salvato';
        form.reset();
        if (dateEl) dateEl.valueAsDate = new Date();
        clearQueue();
      } else {
        status.textContent = '⚠️ Offline: accodato';
        const q = getQueue(); q.push(payload); setQueue(q);
      }
    });
  }

  // Riepilogo movimenti
  const repMonth = document.getElementById('repMonth');
  if (repMonth) {
    const now = new Date();
    repMonth.value = now.toISOString().slice(0,7);
  }
  const repBtn = document.getElementById('btnLoadList');
  if (repBtn) repBtn.addEventListener('click', async () => {
    const month = document.getElementById('repMonth').value; // YYYY-MM
    const cat = document.getElementById('repCategory').value;
    const url = ENDPOINT_URL + '?key=' + encodeURIComponent(API_KEY) + '&action=list&month=' + encodeURIComponent(month) + (cat ? '&category=' + encodeURIComponent(cat) : '');
    try {
      const res = await fetch(url);
      const text = await res.text(); const data = JSON.parse(text);
      const box = document.getElementById('repContainer');
      if (!data.ok) { box.innerHTML = '<div class="muted">Nessun dato.</div>'; return; }
      const rows = data.rows || [];
      if (!rows.length) { box.innerHTML = '<div class="muted">Nessun movimento per il mese selezionato.</div>'; return; }
      const html = ['<table class="table"><thead><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th>Entrata</th><th>Uscita</th><th>ID</th></tr></thead><tbody>'];
      for (const r of rows){
        html.push(`<tr><td>${r.Data}</td><td>${r.Descrizione}</td><td>${r.Categoria}</td><td>${r.Entrata||''}</td><td>${r.Uscita||''}</td><td class="muted">${r.ID||''}</td></tr>`);
      }
      html.push('</tbody></table>');
      box.innerHTML = html.join('');
    } catch (e) {
      document.getElementById('repContainer').innerHTML = '<div class="muted">Errore nel caricamento.</div>';
    }
  });

  // Saldo mensile
  const sumMonth = document.getElementById('sumMonth');
  if (sumMonth) {
    const now = new Date();
    sumMonth.value = now.toISOString().slice(0,7);
  }
  const sumBtn = document.getElementById('btnLoadSummary');
  if (sumBtn) sumBtn.addEventListener('click', async () => {
    const month = document.getElementById('sumMonth').value; // YYYY-MM
    const url = ENDPOINT_URL + '?key=' + encodeURIComponent(API_KEY) + '&action=summary&month=' + encodeURIComponent(month);
    try {
      const res = await fetch(url);
      const text = await res.text(); const data = JSON.parse(text);
      if (!data.ok) { document.getElementById('sumContainer').innerText = 'Nessun dato.'; return; }
      const eTot = (data.totals && data.totals.entrate) || 0;
      const uTot = (data.totals && data.totals.uscite) || 0;
      const saldo = Number(eTot) - Number(uTot);
      document.getElementById('sumContainer').innerHTML =
        `<div>Entrate: <strong>€ ${eTot}</strong></div>
         <div>Uscite: <strong>€ ${uTot}</strong></div>
         <div>Saldo: <strong>€ ${saldo}</strong></div>`;
    } catch (e) {
      document.getElementById('sumContainer').innerText = 'Errore nel calcolo.';
    }
  });
});
