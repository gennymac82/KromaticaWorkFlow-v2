// === CONFIG ===
const BASE_GS_URL = "https://script.google.com/macros/s/AKfycbwc898t5ajSwr-hD8Ze8d0NTt6Z4pamavCgq7KbMjZwhTsyNa2PfO2DGsINVZXHy9jd/exec";
const API_KEY = "5110";

// === ROTTE ===
const routes = ["home", "riepilogo", "saldo"];

function show(route) {
  routes.forEach(r =>
    document.getElementById("page-" + r).classList.toggle("hidden", r !== route)
  );
  location.hash = "#" + route;
}

window.addEventListener("hashchange", () => {
  const r = location.hash.replace("#", "") || "home";
  show(routes.includes(r) ? r : "home");
});

document.querySelectorAll("[data-route]").forEach(b =>
  b.addEventListener("click", () => show(b.dataset.route))
);

show(location.hash.replace("#", "") || "home");

// === GENERA ID ===
function generateId() {
  return "ID-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

// === HOME FORM ===
window.addEventListener("load", () => {
  const dateEl = document.getElementById("date");
  if (dateEl) dateEl.valueAsDate = new Date();

  document.getElementById("cashForm").onsubmit = async e => {
    e.preventDefault();

    const payload = {
      id: generateId(),
      date: dateEl.value,
      description: description.value,
      category: category.value,
      income: income.value,
      expense: expense.value
    };

    const realUrl = BASE_GS_URL + "?key=" + encodeURIComponent(API_KEY);
    const url = "https://corsproxy.io/?url=" + encodeURIComponent(realUrl);

    let r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY, ...payload })
    });

    let t = await r.text();
    try { t = JSON.parse(t); } catch {}

    status.textContent = t.ok ? "✅ Salvato" : "⚠️ Errore";

    if (t.ok) {
      document.getElementById("cashForm").reset();
      dateEl.valueAsDate = new Date();
    }
  };

  // === RIEPILOGO ===
  repMonth.value = new Date().toISOString().slice(0, 7);

  btnLoadList.onclick = async () => {
    const m = repMonth.value;
    const c = repCategory.value;

    const realUrl =
      BASE_GS_URL +
      "?key=" + API_KEY +
      "&action=list" +
      "&month=" + m +
      (c ? "&category=" + c : "");

    const url = "https://corsproxy.io/?url=" + encodeURIComponent(realUrl);

    const r = await fetch(url);
    const t = JSON.parse(await r.text());

    if (!t.ok || !t.rows || !t.rows.length) {
      repContainer.innerHTML = "<div>Nessun movimento</div>";
      return;
    }

    // ✅ VERSIONE SENZA ID
    let h =
      '<table class="table"><tr><th>Data</th><th>Descrizione</th><th>Categoria</th><th>Entrata</th><th>Uscita</th></tr>';

    t.rows.forEach(x => {
      h += `<tr>
              <td>${x.Data}</td>
              <td>${x.Descrizione}</td>
              <td>${x.Categoria}</td>
              <td>${x.Entrata || ""}</td>
              <td>${x.Uscita || ""}</td>
            </tr>`;
    });

    h += "</table>";
    repContainer.innerHTML = h;
  };

  // === SALDO ===
  sumMonth.value = new Date().toISOString().slice(0, 7);

  btnLoadSummary.onclick = async () => {
    const m = sumMonth.value;

    const realUrl =
      BASE_GS_URL +
      "?key=" + API_KEY +
      "&action=summary" +
      "&month=" + m;

    const url = "https://corsproxy.io/?url=" + encodeURIComponent(realUrl);

    const r = await fetch(url);
    const t = JSON.parse(await r.text());

    if (!t.ok) {
      sumContainer.textContent = "Nessun dato";
      return;
    }

    const e = t.totals.entrate || 0;
    const u = t.totals.uscite || 0;
    const saldo = e - u;

    sumContainer.innerHTML =
      `Entrate: <b>€${e}</b><br>Uscite: <b>€${u}</b><br><br>
       <b>Saldo: €${saldo}</b>`;
  };
});
