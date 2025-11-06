const BASE_GS_URL="https://script.google.com/macros/s/AKfycbwzcBv7TCNV8GZQ9dNO0-F07togSqKIHVvaynE-1E6Jr8w4lFumEPACStIGs2TidRXo/exec";
const API_KEY="5110";
const routes=["home","riepilogo","saldo"];
function show(r){routes.forEach(x=>document.getElementById("page-"+x).classList.toggle("hidden",x!==r));location.hash="#"+r;}
window.addEventListener("hashchange",()=>{const r=(location.hash.replace("#","")||"home");show(routes.includes(r)?r:"home");});
document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>show(b.dataset.route));
show((location.hash.replace("#",""))||"home");
function generateId(){return "ID-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);}
window.addEventListener("load",()=>{
let d=document.getElementById("date"); if(d)d.valueAsDate=new Date();
document.getElementById("cashForm").onsubmit=async e=>{
e.preventDefault();
let payload={id:generateId(),date:date.value,description:description.value,category:category.value,income:income.value,expense:expense.value};
let real=BASE_GS_URL+"?key="+encodeURIComponent(API_KEY);
let url="https://corsproxy.io/?url="+encodeURIComponent(real);
let r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:API_KEY,...payload})});
let t=await r.text(); try{t=JSON.parse(t);}catch{}
status.textContent=t.ok?"✅ Salvato":"Errore";
};
// Riepilogo
repMonth.value=new Date().toISOString().slice(0,7);
btnLoadList.onclick=async()=>{
let m=repMonth.value,c=repCategory.value;
let real=BASE_GS_URL+"?key="+API_KEY+"&action=list&month="+m+(c?"&category="+c:"");
let url="https://corsproxy.io/?url="+encodeURIComponent(real);
let r=await fetch(url);let t=JSON.parse(await r.text());
if(!t.ok||!t.rows.length){repContainer.innerHTML="Nessun dato";return;}
let h='<table class="table"><tr><th>Data</th><th>Desc</th><th>Cat</th><th>Entrata</th><th>Uscita</th></tr>';
t.rows.forEach(x=>h+=`<tr><td>${x.Data}</td><td>${x.Descrizione}</td><td>${x.Categoria}</td><td>${x.Entrata}</td><td>${x.Uscita}</td></tr>`);
repContainer.innerHTML=h+"</table>";
};
// Saldo
sumMonth.value=new Date().toISOString().slice(0,7);
btnLoadSummary.onclick=async()=>{
let m=sumMonth.value;
let real=BASE_GS_URL+"?key="+API_KEY+"&action=summary&month="+m;
let url="https://corsproxy.io/?url="+encodeURIComponent(real);
let r=await fetch(url);let t=JSON.parse(await r.text());
if(!t.ok){sumContainer.textContent="Nessun dato";return;}
let e=t.totals.entrate||0,u=t.totals.uscite||0;
sumContainer.innerHTML=`Entrate: €${e}<br>Uscite: €${u}<br><b>Saldo: €${e-u}</b>`;
};
});
