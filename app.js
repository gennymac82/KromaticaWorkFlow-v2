// === CONFIG ===
const BASE_GS_URL = "https://script.google.com/macros/s/AKfycbz7crNSGI-MPfw7IJ8XYN0sklAyA0q91k3RcBTZty73U6Sff2E8JQnWZepjlJfmCCol/exec";
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
      api_key: API_KEY,
      id: generateId(),
      date: dateEl.value,
      description: description.value,
      category: category.value,
      income: income.value,
      expense: expense.value
    };

    let r = await fetch(BASE_GS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let t = await r.text();
    let data;
    try { data = JSON.parse(t); } catch { data = { ok: false, error: t }; }

    if (data.ok) {
      status.textContent = "✅ Movimento salvato";
      document.getElementById("cashForm").reset();
      dateEl.valueAsDate = new Date();
    } else {
      status.textContent = "⚠️ Errore: " + (data.error || "dati non validi");
    }
  };

  // === RIEPILOGO ===
  repMonth.value = new Date().toISOString().slice(0, 7);

  btnLoadList.onclick = async () => {
    const m = repMonth.value;
    const c = repCategory.value;

    const url = `${BASE_GS_URL}?key=${API_KEY}&action=list&month=${m}${c ? `&category=${c}` : ""}`;

    let r = await fetch(url);
    let data = await r.json();

    if (!data.ok || !data.rows || !data.rows.length) {
      repContainer.innerHTML = "<div>Nessun movimento</div>";
      return;
    }

    let h =
      `<table class="table"><tr>
        <th>Data</th><th>Descrizione</th><th>Categoria</th><th>Entrata (€)</th><th>Uscita (€)</th>
      </tr>`;

    data.rows.forEach(x => {
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
    const url = `${BASE_GS_URL}?key=${API_KEY}&action=summary&month=${m}`;

    let r = await fetch(url);
    let data = await r.json();

    if (!data.ok) {
      sumContainer.textContent = "Nessun dato";
      return;
    }

    const e = data.totals.entrate || 0;
    const u = data.totals.uscite || 0;
    const saldo = e - u;

    sumContainer.innerHTML = `
      Entrate: <b>€${e}</b><br>
      Uscite: <b>€${u}</b><br><br>
      Saldo: <b>€${saldo}</b>
    `;
  };
});
