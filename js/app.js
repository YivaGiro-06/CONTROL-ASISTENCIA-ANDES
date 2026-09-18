/* app.js — Control de Asistencia · Regional Andes
 *
 * Dos partes:
 *   1. CARGADOR: arma el objeto DATA desde los JSON particionados de data/.
 *   2. TABLERO: el JS original, sin modificar. Espera DATA como variable global
 *      con la misma forma que tenía cuando el HTML era autocontenido.
 *
 * La partición es transparente para el tablero: el cargador concatena los arrays
 * diarios de cada mes respetando el índice de día global (di) del calendario.
 */
'use strict';

const CARGA = (() => {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:#f1f0ed;z-index:9999;font:14px "Segoe UI",system-ui,sans-serif;color:#6f6f6a';
  el.innerHTML = '<div style="text-align:center"><div style="width:34px;height:34px;margin:0 auto 14px;border:3px solid #e7e6e2;border-top-color:#F57C00;border-radius:50%;animation:g .8s linear infinite"></div><b id="cargaTxt">Cargando datos…</b><style>@keyframes g{to{transform:rotate(360deg)}}</style></div>';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
  return {
    txt(t) { const n = document.getElementById('cargaTxt'); if (n) n.textContent = t; },
    quitar() { el.remove(); },
    error(msg) {
      el.innerHTML = '<div style="max-width:520px;padding:24px;background:#fff;border:1px solid #e7e6e2;border-left:4px solid #D32F2F;border-radius:12px">'
        + '<b style="color:#D32F2F;font-size:15px">No se pudieron cargar los datos</b>'
        + '<p style="margin:8px 0 0;font-size:13px;line-height:1.6">' + msg + '</p>'
        + '<p style="margin:10px 0 0;font-size:12px;color:#9a9a94">Verifica que la carpeta <code>data/</code> esté publicada y que hayas corrido <code>npm run generar</code>.</p></div>';
    },
  };
})();

async function traerJSON(archivo) {
  const r = await fetch('data/' + archivo, { cache: 'no-cache' });
  if (!r.ok) throw new Error(archivo + ': HTTP ' + r.status);
  return r.json();
}

// Arrays diarios que viven particionados por mes. El resto va en agregados.json.
const ARRAYS_DIARIOS = ['htDays', 'jlDays', 'dayState', 'inasDays', 'permDays',
                        'inconDays', 'metodoDays', 'descDays'];

async function construirDATA() {
  CARGA.txt('Cargando índice…');
  const man = await traerJSON('manifiesto.json');

  CARGA.txt('Cargando agregados…');
  const agg = await traerJSON(man.datasets.agregados.archivo);

  const partes = man.datasets.diario.particiones;
  let listas = 0;
  const trozos = await Promise.all(partes.map(async (p) => {
    const d = await traerJSON(p.archivo);
    CARGA.txt(`Cargando meses… ${++listas}/${partes.length}`);
    return d;
  }));

  // Concatenar en el orden del calendario. El índice de día (di) ya es global,
  // así que no hay que reindexar nada.
  const DATA = Object.assign({}, agg);
  for (const nombre of ARRAYS_DIARIOS) DATA[nombre] = [];
  for (const t of trozos) {
    for (const nombre of ARRAYS_DIARIOS) {
      const arr = t[nombre];
      if (arr && arr.length) DATA[nombre].push(...arr);
    }
  }
  DATA.manifiesto = man;
  return DATA;
}

(async () => {
  let DATA;
  try {
    DATA = await construirDATA();
  } catch (e) {
    console.error(e);
    CARGA.error(e.message);
    return;
  }
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r));
  }
  CARGA.quitar();
  try {
    arrancarTablero(DATA);
  } catch (e) {
    console.error(e);
    CARGA.error('Error al construir el tablero: ' + e.message);
  }
})();

/* ==========================================================================
   TABLERO — código original, sin modificar.
   ========================================================================== */
function arrancarTablero(DATA) {
const PEOPLE=DATA.people;
const A_PARR=Object.values(PEOPLE);
let PARR=A_PARR, EV=DATA.inas_events, K=DATA.kpi, CS=DATA.cargo_stats;
const A_EV=DATA.inas_events, A_K=DATA.kpi, A_CS=DATA.cargo_stats;
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n||0).toLocaleString("es-CO");
const fmt1=n=>(n||0).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1});
const pct=(a,b)=>b?a/b*100:0;
const initials=n=>n.trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
const esc=s=>(s==null?"":String(s)).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fdate=f=>f.slice(8,10)+"/"+f.slice(5,7);
const DOWF={"Lun":"Lunes","Mar":"Martes","Mié":"Miércoles","Jue":"Jueves","Vie":"Viernes","Sáb":"Sábado","Dom":"Domingo"};
const MESK={"Enero":"01","Febrero":"02","Marzo":"03","Abril":"04","Mayo":"05","Junio":"06","Julio":"07","Agosto":"08","Septiembre":"09","Octubre":"10","Noviembre":"11","Diciembre":"12"};

const T={navy:"#14213D",navy2:"#1e2f52",gold:"#FCA311",gold2:"#facc15",amber:"#fbbf24",blue:"#1e40af",blue2:"#2563eb",blue3:"#3b82f6",red:"#dc2626",redDark:"#b91c1c",green:"#16a34a",bg:"#f8fafc",ink:"#0f172a",muted:"#64748b",muted2:"#94a3b8",teal:"#0891b2",purple:"#7c3aed",grid:"#e2e8f0",orange:"#FCA311"};
const CC=[T.gold,T.navy,T.blue,T.red,T.green,T.purple,T.teal,T.amber,T.blue2,T.navy2,T.gold2,T.muted];
if(typeof Chart!=="undefined"){Chart.defaults.font.family="Segoe UI,system-ui,sans-serif";Chart.defaults.font.size=12;Chart.defaults.color=T.muted;Chart.defaults.plugins.legend.labels.usePointStyle=true;Chart.defaults.plugins.legend.labels.boxWidth=10;Chart.defaults.plugins.tooltip.backgroundColor=T.navy;Chart.defaults.plugins.tooltip.borderColor=T.gold;Chart.defaults.plugins.tooltip.borderWidth=1;Chart.defaults.plugins.tooltip.titleColor="#ffffff";Chart.defaults.plugins.tooltip.bodyColor=T.gold2;Chart.defaults.plugins.tooltip.padding=10;Chart.defaults.plugins.tooltip.cornerRadius=6;Chart.defaults.maintainAspectRatio=false;}
const AG={grid:{color:T.grid,drawTicks:false},border:{display:false}};
const AN={grid:{display:false},border:{display:false}};
const charts={};
function mkc(id,cfg){if(charts[id])charts[id].destroy();const el=document.getElementById(id);if(el)charts[id]=new Chart(el,cfg);}

$("#hdPeople").textContent=A_K.personas+" colaboradores";$("#ftPeople").textContent=A_K.personas;
(function(){const f=DATA.days[DATA.days.length-1];const u=$("#hdUpd");if(u)u.textContent="actualizado "+f.slice(8,10)+"-"+["","ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][+f.slice(5,7)];})();

/* buscador de colaborador (cédula o nombre) */
(function(){const inp=$("#personSearch"),dd=$("#searchResults");if(!inp)return;
  const all=A_PARR.map(p=>({n:p.nombre,c:p.cargo,id:p.id||""}));
  function close(){dd.classList.remove("on");}
  inp.oninput=()=>{const q=inp.value.trim().toLowerCase();if(q.length<2){close();return;}
    const r=all.filter(p=>p.n.toLowerCase().includes(q)||(p.id&&p.id.includes(q))).slice(0,8);
    dd.innerHTML=r.length?r.map(p=>`<div class="sr" data-n="${esc(p.n)}"><div class="av">${initials(p.n)}</div><div><b>${esc(p.n)}</b><span>${esc(p.c)}${p.id?" · "+esc(p.id):""}</span></div></div>`).join(""):`<div class="sr-empty">Sin coincidencias</div>`;
    dd.classList.add("on");
    dd.querySelectorAll(".sr").forEach(el=>el.onclick=()=>{openDrill(fichaFrame(el.dataset.n));close();inp.value="";});};
  document.addEventListener("click",e=>{if(!inp.contains(e.target)&&!dd.contains(e.target))close();});
})();

/* indexes for inasistencia events */
let evByDate={},evByCargo={},evByDow={};
function buildEvIdx(){evByDate={};evByCargo={};evByDow={};EV.forEach(e=>{(evByDate[e.fecha]=evByDate[e.fecha]||[]).push(e);(evByCargo[e.cargo]=evByCargo[e.cargo]||[]).push(e);(evByDow[e.dow]=evByDow[e.dow]||[]).push(e);});}
buildEvIdx();

/* ---------- DRILL ENGINE ---------- */
const ov=$("#drillOv"),sheet=$("#drill");let stack=[];
function openDrill(f){stack=[f];render();ov.classList.add("on");sheet.classList.add("on");}
function pushDrill(f){stack.push(f);render();}
function back(i){stack=stack.slice(0,i+1);render();}
function closeDrill(){ov.classList.remove("on");sheet.classList.remove("on");}
ov.onclick=closeDrill;$("#drillX").onclick=closeDrill;document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrill();});
function render(){const f=stack[stack.length-1],c=$("#drillCrumb");
  c.innerHTML=stack.map((fr,i)=>i<stack.length-1?`<button data-i="${i}">${esc(fr.label)}</button><span>›</span>`:`<span style="color:#fff;font-weight:700">${esc(fr.label)}</span>`).join("");
  c.querySelectorAll("button").forEach(b=>b.onclick=()=>back(+b.dataset.i));
  $("#drillTitle").textContent=f.title;$("#drillSub").textContent=f.sub||"";
  const body=$("#drillBody");body.innerHTML="";f.render(body);body.scrollTop=0;}

/* generic people drill: groups people by cargo by a metric */
function peopleDrill(cfg){
  // cfg:{title,sub,label,people,metric,fmtv,unit,sortDesc=true,note,subLabel}
  const m=cfg.metric,fv=cfg.fmtv||fmt;
  return {title:cfg.title,sub:cfg.sub,label:cfg.label||cfg.title,render(root){
    const g={};cfg.people.forEach(p=>{const c=p.cargo||"—";(g[c]=g[c]||{cargo:c,people:[],sum:0});g[c].people.push(p);g[c].sum+=m(p);});
    const rows=Object.values(g).filter(r=>r.sum>0||cfg.keepZero).sort((a,b)=>b.sum-a.sum);
    const totP=cfg.people.filter(p=>m(p)>0).length;
    root.innerHTML=`<div class="dmeta">${fv(rows.reduce((a,r)=>a+r.sum,0))}${cfg.unit||""} · ${totP} personas · ${rows.length} cargos</div>`+
      `<div class="dsec">Por cargo · click para ver personas</div>`+
      `<div class="cargo-grid">`+rows.map(r=>`<div class="cargo-card" data-c="${esc(r.cargo)}"><span class="cc-a">›</span><div class="cc-n">${fv(r.sum)}${cfg.unit||""}</div><div class="cc-l">${esc(r.cargo)}</div><div class="cc-s">${r.people.length} ${r.people.length===1?"persona":"personas"}</div></div>`).join("")+`</div>`+
      (cfg.note?`<div class="drill-note">${cfg.note}</div>`:"");
    root.querySelectorAll(".cargo-card").forEach(el=>el.onclick=()=>pushDrill(cargoPeopleFrame(el.dataset.c,g[el.dataset.c].people,m,fv,cfg.unit,cfg.subLabel||cfg.title)));
  }};
}
function cargoPeopleFrame(cargo,people,m,fv,unit,parentLabel){
  return {title:cargo,sub:parentLabel,label:cargo,render(root){
    const arr=people.filter(p=>m(p)>0).sort((a,b)=>m(b)-m(a));
    root.innerHTML=`<div class="dmeta">${arr.length} personas · ${esc(cargo)}</div><div class="plist">`+
      arr.map(p=>`<div class="prow" data-n="${esc(p.nombre)}"><div class="av">${initials(p.nombre)}</div><div class="pn"><b>${esc(p.nombre)}</b><span>${esc(p.cargo)}</span></div><div class="pv">${fv(m(p))}${unit||""}<small>${esc(parentLabel)}</small></div></div>`).join("")+`</div>`;
    root.querySelectorAll(".prow").forEach(el=>el.onclick=()=>pushDrill(fichaFrame(el.dataset.n)));
  }};
}
/* inasistencia EVENT drill (by day/cargo/dow): cargo grid + people */
function eventDrill(title,sub,events,label){
  return {title,sub,label:label||title,render(root){
    const g={};events.forEach(e=>{(g[e.cargo]=g[e.cargo]||{cargo:e.cargo,ev:[],pp:{}});g[e.cargo].ev.push(e);g[e.cargo].pp[e.nombre]=(g[e.cargo].pp[e.nombre]||0)+1;});
    const rows=Object.values(g).map(r=>({cargo:r.cargo,n:r.ev.length,p:Object.keys(r.pp).length})).sort((a,b)=>b.n-a.n);
    const totP=new Set(events.map(e=>e.nombre)).size;
    root.innerHTML=`<div class="dmeta">${events.length} inasistencias · ${totP} personas · ${rows.length} cargos</div>`+
      `<div class="dsec">Por cargo · click para filtrar</div><div class="cargo-grid">`+
      rows.map(r=>`<div class="cargo-card" data-c="${esc(r.cargo)}"><span class="cc-a">›</span><div class="cc-n">${r.n}</div><div class="cc-l">${esc(r.cargo)}</div><div class="cc-s">${r.p} ${r.p===1?"persona":"personas"}</div></div>`).join("")+`</div>`+
      `<div class="dsec">Todas las personas</div>`+evPeopleList(events);
    root.querySelectorAll(".cargo-card").forEach(el=>el.onclick=()=>pushDrill(eventDrill(el.dataset.c,"Inasistencias · "+title,events.filter(e=>e.cargo===el.dataset.c),el.dataset.c)));
    wireRows(root);
  }};
}
function evPeopleList(events){const m={};events.forEach(e=>{const p=m[e.nombre]=m[e.nombre]||{nombre:e.nombre,cargo:e.cargo,n:0};p.n++;});
  return `<div class="plist">`+Object.values(m).sort((a,b)=>b.n-a.n).map(p=>`<div class="prow" data-n="${esc(p.nombre)}"><div class="av">${initials(p.nombre)}</div><div class="pn"><b>${esc(p.nombre)}</b><span>${esc(p.cargo)}</span></div><div class="pv">${p.n}<small>inasist.</small></div></div>`).join("")+`</div>`;}
function wireRows(root){root.querySelectorAll(".prow").forEach(el=>el.onclick=()=>pushDrill(fichaFrame(el.dataset.n)));}

/* ---------- FICHA (perfil unificado) ---------- */
// El subtitulo refleja el filtro global vigente, no un periodo fijo.
function rangoTxt(){
  if(!RG) return DATA.meta.periodo;
  const a=DAYS[RG.a],b=DAYS[RG.b];
  return a===b ? fdateLarga(a) : (fdate(a)+" → "+fdate(b));
}
const DOWL=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
const MESL=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function fdateLarga(f){const d=new Date(f+"T00:00:00");return DOWL[d.getDay()]+" "+d.getDate()+" de "+MESL[d.getMonth()];}
function hhmm(min){const h=Math.floor(min/60),m=min%60,ap=h<12?"am":"pm",h12=h%12===0?12:h%12;return h12+":"+String(m).padStart(2,"0")+" "+ap;}
function dur(h){const t=Math.round(h*60);return Math.floor(t/60)+" h "+String(t%60).padStart(2,"0")+" min";}
function fichaFrame(nombre){return {title:nombre,sub:"Ficha del colaborador · "+rangoTxt(),label:nombre,render:r=>renderFicha(r,nombre)};}
function renderFicha(root,nombre){
  // PARR trae los agregados ya filtrados por el rango y el cargo vigentes.
  // Si no hay filtro, PARR === Object.values(PEOPLE), asi que el resultado es el mismo.
  const p=PARR.find(x=>x.nombre===nombre)||PEOPLE[nombre];
  if(!p){root.innerHTML="<div class='fsec'><h4>Sin datos</h4><p class='muted'>Esta persona no tiene registros en el rango seleccionado.</p></div>";return;}
  const totLab=p.asist+p.inas+p.permisos;
  const idb=PEOPLE[nombre]||p;
  let h=`<div class="fichahero"><div class="av">${initials(nombre)}</div><div><h3>${esc(nombre)}</h3><div class="fc">${esc(p.cargo)} <span class="cd-badge">${esc(idb.cdId || '—')}</span></div></div></div>`;
  h+=`<div class="fstats">
    <div class="fstat"><b style="color:var(--red)">${p.inas}</b><span>Inasistencias</span></div>
    <div class="fstat"><b style="color:var(--gold)">${fmt1(p.jornada)}</b><span>Jornada h/día</span></div>
    <div class="fstat"><b style="color:var(--ink)">${fmt1(pct(p.incon,p.marcTot))}%</b><span>Marca incorrecta</span></div>
    <div class="fstat"><b style="color:var(--green)">${p.descansos}</b><span>Descansos</span></div></div>`;
  h+=`<div class="fsec"><h4>Asistencia</h4>
    <div class="kv"><span>Asistencias</span><b>${fmt(p.asist)}</b></div>
    <div class="kv"><span>Inasistencias</span><b>${p.inas}</b></div>
    <div class="kv"><span>Permisos justificados</span><b>${p.permisos}</b></div>
    <div class="kv"><span>Descansos</span><b>${p.descansos}</b></div>
    <div class="kv"><span>% asistencia</span><b>${fmt1(pct(p.asist,totLab))}%</b></div></div>`;
  h+=`<div class="fsec"><h4>Jornada laboral</h4>
    <div class="kv"><span>Horas trabajadas</span><b>${fmt(p.ht)} h</b></div>
    <div class="kv"><span>Días con jornada</span><b>${p.dias}</b></div>
    <div class="kv"><span>Jornada promedio</span><b>${fmt1(p.jornada)} h/día</b></div>
    <div class="kv"><span>Jornadas &gt; 14 h</span><b>${p.jornadas14}</b></div>
    <div class="kv"><span>Horas de atraso</span><b>${fmt1(p.atraso)} h</b></div>
    <div class="kv"><span>Recargo total</span><b>${fmt(p.recTotal)} h</b></div></div>`;
  h+=`<div class="fsec"><h4>Marcaciones</h4>
    <div class="kv"><span>Marcas registradas</span><b>${fmt(p.marcTot)}</b></div>
    <div class="kv"><span>Incorrectas (inconsist.)</span><b>${p.incon}</b></div>
    <div class="kv"><span>Reloj de control</span><b>${fmt(p.metodo["Reloj Control"])}</b></div>
    <div class="kv"><span>App móvil</span><b>${fmt(p.metodo["App"])}</b></div></div>`;
  h+=`<div class="fsec"><h4>Descanso y jornada</h4>
    <div class="kv"><span>Días de descanso</span><b>${p.descansos}</b></div>
    <div class="kv"><span>Jornada promedio</span><b>${fmt1(p.jornada)} h/día</b></div>
    <div class="kv"><span>Jornadas &gt; 14 h</span><b>${p.jornadas14}</b></div></div>`;
  h+=bloqueDia(nombre);
  const pt=Object.entries(p.permTipos||{});
  if(pt.length){h+=`<div class="fsec"><h4>Permisos por tipo</h4>`+pt.sort((a,b)=>b[1]-a[1]).map(([t,c])=>`<div class="kv"><span>${esc(t)}</span><b>${c}</b></div>`).join("")+`</div>`;}
  if(p.fechas_inas&&p.fechas_inas.length){
    const ev={};EV.filter(e=>e.nombre===nombre).forEach(e=>ev[e.fecha]=e.dow);
    h+=`<div class="fsec"><h4>Fechas de inasistencia (${p.fechas_inas.length})</h4><div class="date-grid">`+
      p.fechas_inas.map(f=>`<span class="date-chip">${fdate(f)}<small>${ev[f]||""}</small></span>`).join("")+`</div></div>`;
  }
  root.innerHTML=h;
}

/* ---------- bloque "jornada del dia" de la ficha ----------
   Solo aparece cuando el filtro global tiene UN dia seleccionado.
   Muestra la salida del turno anterior para explicar de donde sale el descanso:
   el descanso se le anota al dia de la ENTRADA, no al dia de la salida. */
function bloqueDia(nombre){
  if(!RG||RG.a!==RG.b) return "";
  const pi=PRS.findIndex(x=>x.n===nombre); if(pi<0) return "";
  const di=RG.a;
  // El reloj repite la misma marca hasta 3 veces; se descartan los duplicados del
  // mismo tipo dentro de 10 min. Solo aqui: el conteo global las conserva todas.
  const crudas=A_MET.filter(r=>r[0]===pi&&r[1]===di&&r.length>4).sort((a,b)=>a[3]-b[3]);
  const hoy=[];
  for(const r of crudas){const p2=hoy[hoy.length-1];if(p2&&p2[4]===r[4]&&r[3]-p2[3]<10)continue;hoy.push(r);}
  if(!hoy.length) return `<div class="fsec"><h4>Jornada del día</h4><div class="kv"><span>Marcaciones</span><b>sin registro</b></div></div>`;
  const ing=hoy.filter(r=>r[4]===0), sal=hoy.filter(r=>r[4]===1);
  if(!ing.length) return `<div class="fsec"><h4>Jornada del día</h4><div class="kv"><span>Entrada</span><b>sin registrar</b></div></div>`;
  const e=ing[0][3];
  // salida del turno: la ultima posterior a la entrada (evita tomar el cierre del turno anterior)
  const sHoy=sal.filter(r=>r[3]>e);
  const s=sHoy.length?sHoy[sHoy.length-1][3]:null;

  // ultima salida anterior: se busca hacia atras hasta 3 dias
  let prev=null,prevDi=null;
  for(let k=di-1;k>=Math.max(0,di-3)&&prev===null;k--){
    const ss=A_MET.filter(r=>r[0]===pi&&r[1]===k&&r.length>4&&r[4]===1).sort((a,b)=>a[3]-b[3]);
    // (una sola salida basta; los duplicados tienen la misma hora)
    if(ss.length){prev=ss[ss.length-1][3];prevDi=k;}
  }
  let out=`<div class="fsec"><h4>Jornada del día</h4>`;
  if(prev!==null){
    const desc=((di-prevDi)*1440+e-prev)/60;
    out+=`<div class="kv"><span>Salida ${DOWL[new Date(DAYS[prevDi]+"T00:00:00").getDay()]}</span><b>${hhmm(prev)}</b></div>`;
    out+=`<div class="kv"><span>Entrada ${DOWL[new Date(DAYS[di]+"T00:00:00").getDay()]}</span><b>${hhmm(e)}</b></div>`;
    if(s!==null) out+=`<div class="kv"><span>Salida ${DOWL[new Date(DAYS[di]+"T00:00:00").getDay()]}</span><b>${hhmm(s)}</b></div>`;
    else out+=`<div class="kv"><span>Salida</span><b style="color:var(--muted2)">turno sin cerrar</b></div>`;
    const col=desc<10?T.red:T.green, et=desc<10?"no efectivo":"efectivo";
    out+= desc>24
      ? `<div class="kv"><span>Descanso previo</span><b style="color:var(--green)">descansó el día anterior</b></div>`
      : `<div class="kv"><span>Descansó</span><b style="color:${col}">${dur(desc)} · ${et}</b></div>`;
  }else{
    out+=`<div class="kv"><span>Entrada</span><b>${hhmm(e)}</b></div>`;
    if(s!==null) out+=`<div class="kv"><span>Salida</span><b>${hhmm(s)}</b></div>`;
    out+=`<div class="kv"><span>Descanso previo</span><b style="color:var(--muted2)">sin turno anterior</b></div>`;
  }
  if(s!==null) out+=`<div class="kv"><span>Trabajó</span><b>${dur((s-e)/60)}</b></div>`;
  if(ing.length>1) out+=`<div class="kv"><span>Otras entradas</span><b>${ing.slice(1).map(r=>hhmm(r[3])).join(", ")}</b></div>`;
  if(sHoy.length>1) out+=`<div class="kv"><span>Otras salidas</span><b>${sHoy.slice(0,-1).map(r=>hhmm(r[3])).join(", ")}</b></div>`;
  return out+`</div>`;
}

/* ---------- per-day streams + rankings ---------- */
const PRS=DATA.persons, DAYS=DATA.days, DMETA=DATA.daymeta, ISOLBL=DATA.isolbl;
const A_HTD=DATA.htDays, A_INCD=DATA.inconDays, A_INAD=DATA.inasDays, A_DAY=DATA.dayState, A_MET=DATA.metodoDays;
const PERMD=DATA.permDays||[], PERMLAB=DATA.permTipoLabels||[];
let HTD=A_HTD, INCD=A_INCD, INAD=A_INAD, DAY=A_DAY, MET=A_MET;
const STATE_NAMES=DATA.stateLabels, METODO_NAMES=DATA.metodoLabels;
const MES_ORDER=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
// incon people-by-date (for daily chart drill)
let inconByDate={};
function buildInconByDate(){inconByDate={};INCD.forEach(([pi,di,c])=>{const f=DAYS[di];(inconByDate[f]=inconByDate[f]||[]).push({nombre:PRS[pi].n,cargo:PRS[pi].c,n:c});});}
buildInconByDate();

function rankStream(stream,getv,scope,key){
  // returns [{pi,val}] desc
  const agg={};
  for(const row of stream){const pi=row[0],di=row[1],m=DMETA[di];
    if(scope==="mes"&&m.mes!==key)continue;
    if(scope==="sem"&&String(m.iso)!==String(key))continue;
    if(scope==="dia"&&DAYS[di]!==key)continue;
    agg[pi]=(agg[pi]||0)+getv(row);}
  return Object.entries(agg).map(([pi,val])=>({pi:+pi,val})).filter(x=>x.val>0).sort((a,b)=>b.val-a.val);
}
function weekKeys(){return Object.keys(ISOLBL).sort((a,b)=>+a-+b);}
function dayKeysByMonth(){const g={};DAYS.forEach((f,i)=>{const m=DMETA[i].mes;(g[m]=g[m]||[]).push(f);});return g;}

function buildRanking(rootSel,stream,getv,opts){
  // opts:{unit,fmtv,vlabel,color}  — el periodo lo controla el filtro global
  const root=$(rootSel);const fv=opts.fmtv||fmt;
  const list=document.createElement("div");list.className="rklist";
  root.innerHTML="";root.appendChild(list);
  const agg={};stream.forEach(row=>{agg[row[0]]=(agg[row[0]]||0)+getv(row);});
  const r=Object.entries(agg).map(([pi,val])=>({pi:+pi,val})).filter(x=>x.val>0).sort((a,b)=>b.val-a.val).slice(0,10);
  if(!r.length){list.innerHTML=`<div class="rkempty">Sin registros en el periodo seleccionado.</div>`;return;}
  list.innerHTML=r.map((x,i)=>{const p=PRS[x.pi];return `<div class="rkrow" data-n="${esc(p.n)}"><div class="rk">${i+1}</div><div class="rn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span></div><div class="rv" style="color:${opts.color}">${fv(x.val)}${opts.unit||""}<small>${opts.vlabel}</small></div></div>`;}).join("");
  list.querySelectorAll(".rkrow").forEach(el=>el.onclick=()=>openDrill(fichaFrame(el.dataset.n)));
}

/* ---------- BANDAS: Clasificación JL + Descanso efectivo ---------- */
const A_JLD=DATA.jlDays, A_DESD=DATA.descDays, JLB=DATA.jlBands, DEB=DATA.descBands;
let JLD=A_JLD, DESD=A_DESD, PERMDS=PERMD;

/* ===================== FILTRO GLOBAL DE PERIODO ===================== */
const DIDX={}; DAYS.forEach((f,i)=>DIDX[f]=i);
let RG=null; // {a,b} índices de día inclusivos, o null=todo
let MONTH_FILTER=[]; // meses seleccionados ([] = todos)
let WEEK_FILTER=[]; // semanas seleccionadas ([] = todas)
let DAY_FILTER=[]; // días seleccionados ([] = todos)
function inRG(di){
  if(RG && (di < RG.a || di > RG.b)) return false;
  if(MONTH_FILTER.length && !MONTH_FILTER.includes(DMETA[di].mes)) return false;
  if(WEEK_FILTER.length && !WEEK_FILTER.includes(String(DMETA[di].iso))) return false;
  if(DAY_FILTER.length && !DAY_FILTER.includes(di) && !DAY_FILTER.includes(String(di))) return false;
  return true;
}
function rangeDayIdx(){const o=[];for(let i=0;i<DAYS.length;i++) if(inRG(i)) o.push(i); return o;}
let CG=[]; // cargos seleccionados ([] = todos)
function inCG(pi){return !CG||!CG.length||CG.includes(PRS[pi].c);}
let REG_FILTER=[]; // regiones seleccionadas ([] = todas)
let CD_FILTER=[]; // CDs seleccionados ([] = todos)
const REGIONAL_META={
  ANDES:{id:'ANDES',label:'Regional Andes',color:'#FCA311'},
  NORTE:{id:'NORTE',label:'Regional Norte',color:'#2563eb'},
  CENTRO:{id:'CENTRO',label:'Regional Centro',color:'#16a34a'},
  SUR:{id:'SUR',label:'Regional Sur',color:'#7c3aed'},
};
const CD_META={
  // ANDES
  ITAGUI:{label:'CD Itagüí',color:'#FCA311',region:'ANDES'},
  OL_ITAGUI:{label:'OL Itagüí',color:'#0891b2',region:'ANDES'},
  ARMENIA:{label:'CD Armenia',color:'#16a34a',region:'ANDES'},
  OL_ARMENIA:{label:'OL Armenia',color:'#0891b2',region:'ANDES'},
  FORJANDES:{label:'CD Forjandes',color:'#1e40af',region:'ANDES'},
  OL_FORJANDES:{label:'OL Forjandes',color:'#0891b2',region:'ANDES'},
  MANIZALES:{label:'CD Manizales',color:'#2563eb',region:'ANDES'},
  OL_MANIZALES:{label:'OL Manizales',color:'#0891b2',region:'ANDES'},
  UC_PEREIRA:{label:'UC Pereira',color:'#fbbf24',region:'ANDES'},
  OL_PEREIRA:{label:'OL Pereira',color:'#0891b2',region:'ANDES'},
  UC_GIRARDOTA:{label:'UC Girardota',color:'#7c3aed',region:'ANDES'},
  OL_GIRARDOTA:{label:'OL Girardota',color:'#0891b2',region:'ANDES'},
  MED_ARANJUEZ:{label:'CD Med Aranjuez',color:'#dc2626',region:'ANDES'},
  MED_ENVIGADO:{label:'CD Med Envigado',color:'#14213D',region:'ANDES'},

  // NORTE
  SANTA_MARTA:{label:'CD Santa Marta',color:'#2563eb',region:'NORTE'},
  OL_SANTA_MARTA:{label:'OL Santa Marta',color:'#0891b2',region:'NORTE'},
  ARENOSA:{label:'CD Arenosa',color:'#3b82f6',region:'NORTE'},
  OL_ARENOSA:{label:'OL Arenosa',color:'#0891b2',region:'NORTE'},
  CUCUTA:{label:'CD Cúcuta',color:'#1e40af',region:'NORTE'},
  OL_CUCUTA:{label:'OL Cúcuta',color:'#0891b2',region:'NORTE'},

  // CENTRO
  AUTOSUR:{label:'CD Autosur',color:'#16a34a',region:'CENTRO'},
  OL_AUTOSUR:{label:'OL Autosur',color:'#0891b2',region:'CENTRO'},
  SIBERIA:{label:'CD Siberia',color:'#15803d',region:'CENTRO'},
  OL_SIBERIA:{label:'OL Siberia',color:'#0891b2',region:'CENTRO'},
  SIBATE:{label:'CD Sibate',color:'#22c55e',region:'CENTRO'},
  OL_SIBATE:{label:'OL Sibaté',color:'#0891b2',region:'CENTRO'},

  // SUR
  UC_YUMBO:{label:'UC Yumbo',color:'#7c3aed',region:'SUR'},
  OL_YUMBO:{label:'OL Yumbo',color:'#0891b2',region:'SUR'},
  TULUA:{label:'CD Tuluá',color:'#9333ea',region:'SUR'},
  OL_TULUA:{label:'OL Tuluá',color:'#0891b2',region:'SUR'},
};
const CD_LIST=(()=>{
  const present=[...new Set(A_PARR.map(p=>p.cdId||p.cd).filter(Boolean))];
  const ordered=Object.keys(CD_META).filter(id=>present.includes(id));
  const extra=present.filter(id=>!CD_META[id]);
  return [...ordered,...extra].map(id=>({id,label:CD_META[id]?.label||id,color:CD_META[id]?.color||'#0288D1',region:CD_META[id]?.region||'ANDES'}));
})();
function getPersonRegion(p){
  if(!p) return null;
  if(p.region) return p.region;
  const cdId = p.cdId || p.cd;
  return CD_META[cdId]?.region || null;
}
function inREG(pi){
  if(!REG_FILTER||!REG_FILTER.length) return true;
  const p = PRS[pi] || A_PARR.find(x => x.pi === pi);
  return REG_FILTER.includes(getPersonRegion(p));
}
function inCD(pi){
  if(!CD_FILTER||!CD_FILTER.length) return true;
  return PRS[pi] && (CD_FILTER.includes(PRS[pi].cd) || CD_FILTER.includes(PRS[pi].cdId));
}
function applyRange(a,b){RG=(a==null)?null:{a:Math.min(a,b),b:Math.max(a,b)};applyScope();}
function applyCargo(c){CG=Array.isArray(c)?c:(c?[c]:[]);applyScope();}
function applyReg(reg){REG_FILTER=Array.isArray(reg)?reg:(reg?[reg]:[]);CD_FILTER=[];applyScope();}
function applyCd(cd){CD_FILTER=Array.isArray(cd)?cd:(cd?[cd]:[]);applyScope();}
function applyMonth(m){MONTH_FILTER=Array.isArray(m)?m:(m?[m]:[]);WEEK_FILTER=[];DAY_FILTER=[];applyScope();}
function applyWeek(w){WEEK_FILTER=Array.isArray(w)?w:(w?[w]:[]);DAY_FILTER=[];applyScope();}
function applyDay(d){DAY_FILTER=Array.isArray(d)?d.map(Number):(d?[+d]:[]);applyScope();}
function applyScope(){
  const hasRG = !!RG;
  const hasCG = Array.isArray(CG) && CG.length > 0;
  const hasREG = Array.isArray(REG_FILTER) && REG_FILTER.length > 0;
  const hasCD = Array.isArray(CD_FILTER) && CD_FILTER.length > 0;
  const hasM = Array.isArray(MONTH_FILTER) && MONTH_FILTER.length > 0;
  const hasW = Array.isArray(WEEK_FILTER) && WEEK_FILTER.length > 0;
  const hasD = Array.isArray(DAY_FILTER) && DAY_FILTER.length > 0;
  if(!hasRG && !hasCG && !hasREG && !hasCD && !hasM && !hasW && !hasD){PARR=A_PARR;EV=A_EV;K=A_K;CS=A_CS;HTD=A_HTD;INCD=A_INCD;INAD=A_INAD;DAY=A_DAY;MET=A_MET;JLD=A_JLD;DESD=A_DESD;PERMDS=PERMD;buildEvIdx();buildInconByDate();return;}
  const f=r=>inRG(r[1])&&inCG(r[0])&&inREG(r[0])&&inCD(r[0]);
  HTD=A_HTD.filter(f);INCD=A_INCD.filter(f);INAD=A_INAD.filter(f);DAY=A_DAY.filter(f);MET=A_MET.filter(f);JLD=A_JLD.filter(f);DESD=A_DESD.filter(f);PERMDS=PERMD.filter(f);
  const dA=RG?DAYS[RG.a]:null,dB=RG?DAYS[RG.b]:null;
  EV=A_EV.filter(e=>{
    const di=DIDX[e.fecha];
    return (di!=null?inRG(di):(!RG||(e.fecha>=dA&&e.fecha<=dB)))
      && (!hasCG||CG.includes(e.cargo))
      && (!hasREG||REG_FILTER.includes(getPersonRegion(A_PARR.find(p=>p.nombre===e.nombre))))
      && (!hasCD||CD_FILTER.includes(A_PARR.find(p=>p.nombre===e.nombre)?.cdId));
  });
  const pp={};
  const gp=pi=>pp[pi]||(pp[pi]={pi,nombre:PRS[pi].n,cargo:PRS[pi].c,asist:0,inas:0,permisos:0,descansos:0,retiroDias:0,ht:0,dias:0,jornadas14:0,atraso:0,incon:0,marcTot:0,metodo:{'Reloj Control':0,'Marca Manual':0,'App':0,'Otro':0},sinMarca:0,pausaSi:0,pausaNo:0,recTotal:0,rec:{RNO:0,RDD:0,RND:0,RDF:0,RNF:0},fechas_inas:[],meses:{},dows:{},permTipos:{}});
  DAY.forEach(([pi,di,st])=>{const o=gp(pi),s=STATE_NAMES[st];if(s==='asist')o.asist++;else if(s==='inas'){o.inas++;o.fechas_inas.push(DAYS[di]);}else if(s==='permiso')o.permisos++;else if(s==='descanso')o.descansos++;else if(s==='retiro')o.retiroDias++;});
  HTD.forEach(([pi,di,h,rec,atr])=>{const o=gp(pi);o.ht+=h/10;o.dias++;o.recTotal+=(rec||0)/10;o.atraso+=(atr||0)/60;});
  PERMDS.forEach(([pi,di,t])=>{const o=gp(pi),n=PERMLAB[t];if(n)o.permTipos[n]=(o.permTipos[n]||0)+1;});
  JLD.forEach(([pi,di,b])=>{if(b===5)gp(pi).jornadas14++;});
  INCD.forEach(([pi,di,c])=>{gp(pi).incon+=c;});
  MET.forEach(([pi,di,m])=>{const o=gp(pi);o.marcTot++;o.metodo[METODO_NAMES[m]]++;});
  Object.values(pp).forEach(o=>{o.ht=Math.round(o.ht*10)/10;o.recTotal=Math.round(o.recTotal*10)/10;o.atraso=Math.round(o.atraso*10)/10;o.jornada=o.dias?Math.round(o.ht/o.dias*100)/100:0;o.marcManualPct=o.marcTot?Math.round(o.metodo['Marca Manual']/o.marcTot*1000)/10:0;o.fechas_inas.sort();});
  PARR=Object.values(pp);
  const st6=new Array(6).fill(0);DAY.forEach(r=>st6[r[2]]++);
  const htSum=HTD.reduce((a,r)=>a+r[2]/10,0),incSum=INCD.reduce((a,r)=>a+r[2],0),marc=MET.length,mm=MET.filter(r=>r[2]===1).length,j14=JLD.filter(r=>r[2]===5).length;
  const asist=st6[0],inasRaw=st6[1],totLab=asist+inasRaw+st6[2];
  K={personas:PARR.length,asistencias:asist,inasistencias:EV.length,permisos:st6[2],descansos:st6[3],
     ht:Math.round(htSum),dias_trab:HTD.length,jornadas14:j14,incon:incSum,marcTot:marc,marcaManual:mm,
     jornada_prom:HTD.length?Math.round(htSum/HTD.length*100)/100:0,
     pct_asist:totLab?Math.round(asist/totLab*1000)/10:0,pct_inas:totLab?Math.round(inasRaw/totLab*1000)/10:0,
     marc_inc_pct:marc?Math.round(incSum/marc*1000)/10:0,marc_corr_pct:marc?Math.round((1-incSum/marc)*1000)/10:0,
     marca_manual_pct:marc?Math.round(mm/marc*1000)/10:0,sinMarca:0,retiroDias:st6[4],
     inas_excluidos:A_K.inas_excluidos,inas_excluidos_dias:A_K.inas_excluidos_dias};
  const cg={};
  const gc=c=>cg[c]||(cg[c]={cargo:c,personas:0,asist:0,inas:0,permisos:0,descansos:0,ht:0,dias:0,jornadas14:0,atraso:0,incon:0,marcTot:0,marcaManual:0,recargo:0,pausaSi:0,pausaNo:0});
  PARR.forEach(o=>{const g=gc(o.cargo);g.personas++;g.asist+=o.asist;g.inas+=o.inas;g.permisos+=o.permisos;g.descansos+=o.descansos;g.ht+=o.ht;g.dias+=o.dias;g.jornadas14+=o.jornadas14;g.incon+=o.incon;g.marcTot+=o.marcTot;g.marcaManual+=o.metodo['Marca Manual'];});
  CS=Object.values(cg).map(g=>({...g,ht:Math.round(g.ht),jornada:g.dias?Math.round(g.ht/g.dias*100)/100:0,marc_inc_pct:g.marcTot?Math.round(g.incon/g.marcTot*1000)/10:0})).sort((a,b)=>b.asist-a.asist);
  buildEvIdx();buildInconByDate();
}
const JLCOL=['#cbd5e1','#94a3b8',T.amber,T.gold,T.navy,T.red];
const DECOL=[T.red,T.navy,'#cbd5e1'];
function bandFilter(stream,scope,key){return stream.filter(([pi,di,b])=>{const m=DMETA[di];
  if(scope==="mes")return m.mes===key;if(scope==="sem")return String(m.iso)===String(key);
  if(scope==="dia")return DAYS[di]===key;return true;});}
function bandCounts(rows,nb){const c=new Array(nb).fill(0);rows.forEach(r=>c[r[2]]++);return c;}
function bandByPerson(rows,nb){const g={};rows.forEach(r=>{const a=g[r[0]]||(g[r[0]]=new Array(nb).fill(0));a[r[2]]++;});return g;}
function bandByMonth(stream,nb){const g={};MES_ORDER.forEach(m=>g[m]=new Array(nb).fill(0));stream.forEach(r=>{g[DMETA[r[1]].mes][r[2]]++;});return g;}
function bandFillPicker(pick,scope,onpick){pick.innerHTML="";
  if(scope==="mes"){const mr=document.createElement("div");mr.className="monthrow";
    MES_ORDER.forEach((m,i)=>{const b=document.createElement("button");b.className="mbtn"+(i===0?" active":"");b.textContent=m;b.onclick=()=>{mr.querySelectorAll(".mbtn").forEach(x=>x.classList.toggle("active",x===b));onpick(m);};mr.appendChild(b);});
    pick.appendChild(mr);return MES_ORDER[0];}
  if(scope==="sem"){const sel=document.createElement("select");sel.className="rksel";
    weekKeys().forEach(w=>{const o=document.createElement("option");o.value=w;o.textContent=ISOLBL[w];sel.appendChild(o);});
    sel.onchange=()=>onpick(sel.value);pick.appendChild(sel);return weekKeys()[0];}
  if(scope==="dia"){const sel=document.createElement("select");sel.className="rksel";const g=dayKeysByMonth();
    MES_ORDER.forEach(m=>{if(!g[m])return;const og=document.createElement("optgroup");og.label=m;
      g[m].forEach(f=>{const o=document.createElement("option");o.value=f;o.textContent=fdate(f)+" · "+(DMETA[DAYS.indexOf(f)].dow);og.appendChild(o);});sel.appendChild(og);});
    sel.onchange=()=>onpick(sel.value);pick.appendChild(sel);return g[MES_ORDER.find(m=>g[m])][0];}
  return null;}
function bandPeopleFrame(title,label,rows,focus,labels,colors){
  return {title,label,sub:"Click en una persona → ficha",render(root){
    const bp=bandByPerson(rows,labels.length);
    let arr=Object.entries(bp).map(([pi,c])=>({pi:+pi,c,f:focus.reduce((s,b)=>s+c[b],0)})).filter(x=>x.f>0).sort((a,b)=>b.f-a.f);
    root.innerHTML=`<div class="dmeta">${arr.length} personas</div><div class="plist">`+arr.map(x=>{const p=PRS[x.pi];
      const pills=focus.filter(b=>x.c[b]>0).map(b=>`<span class="pill" style="background:${colors[b]}1f;color:${colors[b]}">${labels[b]}h: ${x.c[b]}</span>`).join(" ");
      return `<div class="prow" data-n="${esc(p.n)}"><div class="av">${initials(p.n)}</div><div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span><div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">${pills}</div></div><div class="pv" style="color:#D32F2F">${x.f}</div></div>`;}).join("")+`</div>`;
    wireRows(root);}};
}
function buildBandWidget(o){ // {pfx,stream,labels,colors,focus} — periodo del filtro global
  let q="";
  $("#"+o.pfx+"-ctl").innerHTML="";
  $("#"+o.pfx+"-search").oninput=e=>{q=e.target.value.toLowerCase();draw();};
  function draw(){const bp=bandByPerson(o.stream,o.labels.length);
    let arr=Object.entries(bp).map(([pi,c])=>({pi:+pi,c,f:o.focus.reduce((s,b)=>s+c[b],0)})).filter(x=>x.f>0).sort((a,b)=>b.f-a.f);
    if(q)arr=arr.filter(x=>PRS[x.pi].n.toLowerCase().includes(q)||PRS[x.pi].c.toLowerCase().includes(q));
    $("#"+o.pfx+"-count").textContent=arr.length+" personas";
    const list=$("#"+o.pfx+"-list");
    list.innerHTML=arr.length?arr.map((x,i)=>{const p=PRS[x.pi];
      const pills=o.focus.filter(b=>x.c[b]>0).map(b=>`<span class="pill" style="background:${o.colors[b]}1f;color:${o.colors[b]}">${o.labels[b]}h: ${x.c[b]}</span>`).join(" ");
      return `<div class="prow" data-n="${esc(p.n)}"><div class="av" style="background:linear-gradient(140deg,#e53935,#b71c1c)">${i+1}</div><div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span><div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">${pills}</div></div><div class="pv" style="color:#D32F2F">${x.f}<small>total</small></div></div>`;}).join(""):`<div class="rkempty">Sin registros en el periodo seleccionado.</div>`;
    list.querySelectorAll(".prow").forEach(el=>el.onclick=()=>openDrill(fichaFrame(el.dataset.n)));}
  draw();
}

/* ---------- small builders ---------- */
function kpi(o){return `<div class="kpi kpi--${o.tone} ${o.click?"click":""}" ${o.id?`id="${o.id}"`:""}><div class="kpi__num">${o.n}${o.u?`<span class="kpi__u">${o.u}</span>`:""}</div><div class="kpi__lbl">${o.lbl}</div>${o.sub?`<div class="kpi__sub">${o.sub}</div>`:""}</div>`;}
function insi(o){return `<div class="insight insight--${o.tone}"><i>${o.ic}</i><div><b>${o.t}</b><span>${o.d}</span></div></div>`;}
function metricDrill(title,label,metric,unit,fmtv,note){return ()=>openDrill(peopleDrill({title,label,sub:DATA.meta.periodo,people:PARR,metric,unit,fmtv,note}));}

/* ===================== TAB: RESUMEN ===================== */
function resumen(){
  const hp=$("#heroPct");if(hp)hp.textContent=fmt1(K.pct_asist)+"%";
  const hs=$("#heroSub");if(hs)hs.textContent="Resumen consolidado de asistencia · "+(RG?fdate(DAYS[RG.a])+" → "+fdate(DAYS[RG.b]):"todo el periodo · "+DAYS.length+" días");
  $("#k-resumen").innerHTML=
    kpi({n:fmt(K.personas),lbl:"Colaboradores",sub:`${fmt(K.dias_trab)} días con jornada`,tone:"ink"})+
    kpi({n:fmt(K.asistencias),lbl:"Asistencias",sub:`${fmt1(K.pct_asist)}% del operativo`,tone:"green",click:1,id:"r-as"})+
    kpi({n:fmt(K.inasistencias),lbl:"Inasistencias",sub:"Click para ver personas",tone:"red",click:1,id:"r-in"})+
    kpi({n:fmt(K.permisos),lbl:"Permisos justificados",sub:`${DATA.permisos_breakdown.length} categorías`,tone:"blue",click:1,id:"r-pe"})+
    kpi({n:fmt(K.ht),u:"h",lbl:"Horas trabajadas",sub:`${fmt1(K.jornada_prom)} h/día promedio`,tone:"orange",click:1,id:"r-ht"})+
    kpi({n:fmt1(K.marc_inc_pct),u:"%",lbl:"Marca incorrecta",sub:`${fmt(K.incon)} inconsistencias`,tone:"amber",click:1,id:"r-mi"});
  $("#r-as").onclick=metricDrill("Asistencias","Asistencias",p=>p.asist);
  $("#r-in").onclick=()=>openDrill(eventDrill("Inasistencias",DATA.meta.periodo,EV,"Inasistencias"));
  $("#r-pe").onclick=metricDrill("Permisos justificados","Permisos",p=>p.permisos);
  $("#r-ht").onclick=metricDrill("Horas trabajadas","Horas",p=>p.ht," h");
  $("#r-mi").onclick=metricDrill("Marcaciones incorrectas","Incorrectas",p=>p.incon);

  // Tarjetas comparativas por CD
  (function renderCdCards(){
    const container = $("#cd-cards-container");
    if (!container) return;
    const cdTitleEl = $("#cd-grid-title");
    if (cdTitleEl) cdTitleEl.textContent = "🏭 Centros de Distribución · " + (REG_FILTER ? (REGIONAL_META[REG_FILTER]?.label || REG_FILTER) : "Cobertura Nacional");
    const allCds = DATA.cds || CD_LIST;
    const cdsList = allCds.filter(c => !REG_FILTER || c.region === REG_FILTER || CD_META[c.id]?.region === REG_FILTER);
    const cdMap = {};
    cdsList.forEach(c => cdMap[c.id] = { id: c.id, label: c.label, color: c.color, count: 0, asist: 0, inas: 0, perm: 0, ht: 0, dias: 0, incon: 0, marcTot: 0 });
    A_PARR.filter(p => !REG_FILTER || getPersonRegion(p) === REG_FILTER).forEach(p => {
      const cid = p.cdId || '—';
      if (!cdMap[cid] && (!REG_FILTER || getPersonRegion(p) === REG_FILTER)) cdMap[cid] = { id: cid, label: CD_META[cid]?.label||cid, color: CD_META[cid]?.color||'#0288D1', count: 0, asist: 0, inas: 0, perm: 0, ht: 0, dias: 0, incon: 0, marcTot: 0 };
      const m = cdMap[cid];
      if (m) {
        m.count++; m.asist += p.asist; m.inas += p.inas; m.perm += p.permisos;
        m.ht += p.ht; m.dias += p.dias; m.incon += p.incon; m.marcTot += p.marcTot;
      }
    });
    container.innerHTML = Object.values(cdMap).map(m => {
      const den = m.asist + m.inas + m.perm;
      const pctInas = den ? fmt1(m.inas / den * 100) : "0.0";
      const pctCorr = m.marcTot ? fmt1((m.marcTot - m.incon) / m.marcTot * 100) : "100.0";
      const jProm = m.dias ? fmt1(m.ht / m.dias) : "0.0";
      const isAct = CD_FILTER === m.id;
      return `<div class="cd-card${isAct ? ' active' : ''}" data-cd="${m.id}" style="border-left: 4px solid ${m.color}">
        <div class="cd-card__h">
          <span class="cd-card__title">🏭 ${esc(m.label)}</span>
          <span class="cd-card__count">${m.count} col.</span>
        </div>
        <div class="cd-card__metrics">
          <div><div class="cd-card__mval" style="color:var(--red)">${pctInas}%</div><div class="cd-card__mlbl">Ausentismo</div></div>
          <div><div class="cd-card__mval" style="color:var(--green)">${pctCorr}%</div><div class="cd-card__mlbl">Marc. correctas</div></div>
          <div><div class="cd-card__mval">${jProm} h</div><div class="cd-card__mlbl">Jornada prom.</div></div>
          <div><div class="cd-card__mval">${fmt(m.asist)}</div><div class="cd-card__mlbl">Asistencias</div></div>
        </div>
      </div>`;
    }).join("");
    container.querySelectorAll(".cd-card").forEach(card => {
      card.onclick = () => {
        const clickedId = card.dataset.cd;
        applyCd(CD_FILTER === clickedId ? "" : clickedId);
        refreshAll();
      };
    });
  })();

  buildTrendBoard("resumen","ausJI");

  // Dona "Distribución del periodo" eliminada del Resumen a pedido.

  const pm=DATA.por_mes;
  mkc("c_meses",{type:"bar",data:{labels:pm.map(m=>m.mes),datasets:[
    {label:"Asistencias",data:pm.map(m=>m.asist),backgroundColor:T.green,borderRadius:4},
    {label:"Inasistencias",data:pm.map(m=>m.inas),backgroundColor:T.red,borderRadius:4},
    {label:"Permisos",data:pm.map(m=>m.permisos),backgroundColor:T.blue,borderRadius:4},
    {label:"Descansos",data:pm.map(m=>m.descansos),backgroundColor:T.amber,borderRadius:4}]},
    options:{plugins:{legend:{position:"bottom"}},scales:{x:AN,y:{...AG,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const mes=pm[el[0].index].mes,di=el[0].datasetIndex;
        if(di===1){openDrill(eventDrill("Inasistencias · "+mes,mes,EV.filter(x=>x.mes===mes),mes));}
        else{const lbl=["Asistencias","Inasistencias","Permisos","Descansos"][di];const mk=MESK[mes];
          openDrill(peopleDrill({title:lbl+" · "+mes,label:mes,sub:"Personas con inasistencia en "+mes+" (otros meses: total periodo)",people:PARR,metric:di===0?p=>p.asist:di===2?p=>p.permisos:p=>p.descansos,note:"Asistencias/permisos/descansos se muestran por total del periodo por persona; el detalle por-mes-por-persona solo está disponible para inasistencias."}));}}}});

  $("#i-resumen").innerHTML=[
    insi({tone:"green",ic:"✓",t:`Asistencia del ${fmt1(K.pct_asist)}%`,d:`${fmt(K.asistencias)} asistencias efectivas sobre ${fmt(K.personas)} colaboradores`}),
    insi({tone:"red",ic:"!",t:`${fmt(K.inasistencias)} inasistencias`,d:`${fmt1(K.pct_inas)}% del total laboral · click en el KPI para ver quiénes`}),
    insi({tone:"amber",ic:"%",t:`${fmt1(K.marc_inc_pct)}% de marcaciones incorrectas`,d:`${fmt(K.incon)} inconsistencias sobre ${fmt(K.marcTot)} marcas`}),
    insi({tone:"orange",ic:"Ø",t:`Jornada promedio ${fmt1(K.jornada_prom)} h/día`,d:`${fmt(K.ht)} horas · ${fmt(K.jornadas14)} jornadas superaron 14 h`})
  ].join("");
}

/* ===================== TAB: ASISTENCIA ===================== */
function asistencia(){
  $("#k-asis").innerHTML=
    kpi({n:fmt(K.inasistencias),lbl:"Inasistencias",sub:"Personal activo · "+DATA.meta.periodo,tone:"red",click:1,id:"a-in"})+
    kpi({n:fmt(PARR.filter(p=>p.inas>0).length),lbl:"Personas que faltaron",sub:"Al menos 1 día",tone:"orange",click:1,id:"a-pp"})+
    kpi({n:fmt(K.asistencias),lbl:"Asistencias",sub:`${fmt1(K.pct_asist)}%`,tone:"green",click:1,id:"a-as"})+
    kpi({n:fmt(K.permisos),lbl:"Permisos",sub:`${DATA.permisos_breakdown.length} categorías`,tone:"blue",click:1,id:"a-pe"})+
    kpi({n:fmt(K.descansos),lbl:"Descansos",sub:"Día libre programado",tone:"amber",click:1,id:"a-de"});
  $("#a-in").onclick=()=>openDrill(eventDrill("Inasistencias",DATA.meta.periodo,EV,"Inasistencias"));
  $("#a-pp").onclick=()=>openDrill(eventDrill("Inasistencias",DATA.meta.periodo,EV,"Inasistencias"));
  $("#a-as").onclick=metricDrill("Asistencias","Asistencias",p=>p.asist);
  $("#a-pe").onclick=metricDrill("Permisos","Permisos",p=>p.permisos);
  $("#a-de").onclick=metricDrill("Descansos","Descansos",p=>p.descansos);
  buildTrendBoard("asis","ausJI");

  // ---- Ausentismo justificado vs injustificado (responde al filtro global) ----
  (function(){
    const inj=INAD.length; let jus=0,asi=0;
    for(const r of DAY){if(r[2]===2)jus++;else if(r[2]===0)asi++;}
    const prog=asi+inj+jus, pct=x=>prog?fmt1(x/prog*100)+"%":"—";
    const cntFrom=stream=>{const a={};for(const r of stream)a[r[0]]=(a[r[0]]||0)+1;return a;};
    const pplFrame=(title,counter,lbl)=>{const rows=Object.entries(counter).map(([pi,v])=>({pi:+pi,v})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
      return {title,label:"",sub:"Click en una persona → ficha",render(root){
        root.innerHTML=`<div class="dmeta">${rows.length} personas · ${fmt(rows.reduce((a,r)=>a+r.v,0))} ${lbl}</div>`+(rows.length?`<div class="plist">`+rows.map(x=>{const p=PRS[x.pi];return `<div class="prow" data-n="${esc(p.n)}"><div class="av">${initials(p.n)}</div><div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span></div><div class="pv">${fmt(x.v)}<small>${lbl}</small></div></div>`;}).join("")+`</div>`:`<div class="rkempty">Sin registros.</div>`);wireRows(root);}};};
    // motivos del justificado (desde permDays scoped)
    const byT={},pplT={};
    for(const r of PERMDS){const t=PERMLAB[r[2]];byT[t]=(byT[t]||0)+1;(pplT[t]=pplT[t]||{});pplT[t][r[0]]=(pplT[t][r[0]]||0)+1;}
    const tipos=Object.entries(byT).sort((a,b)=>b[1]-a[1]), totM=tipos.reduce((a,x)=>a+x[1],0);
    const sinDet=Math.max(0,jus-totM);
    const tiposFull=tipos.concat(sinDet>0?[["(sin detalle de motivo)",sinDet]]:[]);
    const motFrame=()=>({title:"Justificado por motivo",label:"",sub:"Click en un motivo → personas",render(root){
      if(!jus){root.innerHTML=`<div class="rkempty">Sin ausentismo justificado en el periodo.</div>`;return;}
      root.innerHTML=`<div class="dmeta">${fmt(jus)} días justificados · ${tipos.length} motivos con detalle</div><div class="plist">`+tiposFull.map(([t,n])=>{const cl=t[0]==="("?"":"click rowtipo";return `<div class="prow ${cl}" data-t="${esc(t)}"><div class="pn"><b>${esc(t)}</b><span>${fmt1(n/jus*100)}%</span></div><div class="pv">${fmt(n)}<small>días</small></div></div>`;}).join("")+`</div>`;
      root.querySelectorAll(".rowtipo").forEach(row=>row.onclick=()=>openDrill(pplFrame(row.dataset.t,pplT[row.dataset.t]||{},"días")));wireRows(root);}});
    $("#ausji-cards").innerHTML=
      kpi({n:fmt(inj),lbl:"Injustificado",sub:pct(inj)+" · sin motivo",tone:"red",click:1,id:"aji-inj"})+
      kpi({n:fmt(jus),lbl:"Justificado",sub:pct(jus)+" · con motivo",tone:"amber",click:1,id:"aji-jus"})+
      kpi({n:fmt(inj+jus),lbl:"Ausentismo total",sub:pct(inj+jus)+" de programados",tone:"orange",click:1,id:"aji-tot"});
    const sub=$("#ausji-sub");if(sub)sub.textContent="Números del periodo seleccionado (o todo). Base: "+fmt(prog)+" días programados = asistencias + inasistencias + permisos.";
    $("#aji-inj").onclick=()=>openDrill(pplFrame("Ausentismo injustificado",cntFrom(INAD),"días"));
    $("#aji-jus").onclick=()=>openDrill(motFrame());
    $("#aji-tot").onclick=()=>{const c=cntFrom(INAD);for(const r of DAY){if(r[2]===2)c[r[0]]=(c[r[0]]||0)+1;}openDrill(pplFrame("Ausentismo total (just + injust)",c,"días"));};
    const mdiv=$("#ausji-motivos");
    if(mdiv){
      if(!jus){mdiv.innerHTML=`<p class="panel__sub" style="margin:2px">Sin ausentismo justificado en el periodo seleccionado.</p>`;}
      else{const mx=Math.max(...tiposFull.map(t=>t[1]));
        mdiv.innerHTML=`<p class="trlab" style="margin:6px 2px 8px">Justificado por motivo · ${fmt(jus)} días · click → personas</p><div class="plist">`+
        tiposFull.map(([t,n])=>{const sd=t[0]==="(";return `<div class="prow ${sd?"":"click rowtipo"}" data-t="${esc(t)}"${sd?' style="opacity:.7"':''}><div class="pn" style="flex:1"><b>${esc(t)}</b><div style="height:6px;border-radius:4px;background:#eceae7;margin-top:5px;max-width:340px"><div style="height:6px;border-radius:4px;background:${sd?'#c9c6c1':'var(--amber)'};width:${Math.max(3,Math.round(n/mx*100))}%"></div></div></div><div class="pv">${fmt(n)}<small>${fmt1(n/jus*100)}%</small></div></div>`;}).join("")+`</div>`;
        mdiv.querySelectorAll(".rowtipo").forEach(row=>row.onclick=()=>openDrill(pplFrame(row.dataset.t,pplT[row.dataset.t]||{},"días")));}
    }
  })();

  $("#ex-asis").innerHTML=`✓ <b>Filtro aplicado:</b> se excluyen ${K.inas_excluidos} colaboradores con más de 20 inasistencias continuas (retiros o reingresos), equivalentes a ${fmt(K.inas_excluidos_dias)} días. El conteo de inasistencias refleja solo personal activo.`;
  buildRanking("#rk-inas",INAD,()=>1,{unit:"",vlabel:"inasist.",color:"#D32F2F"});

  // Inasistencias: adaptativo — por MES si el rango es amplio, por DÍA si se eligió un mes/rango chico
  $("#msel-asis").innerHTML="";
  (function(){
    const idx=rangeDayIdx();
    const porDia=idx.length<=45;
    const tit=$("#inasdia-title"),subt=$("#inasdia-sub");
    if(porDia){
      if(tit)tit.textContent="Inasistencias por día";
      if(subt)subt.textContent="Detalle diario del periodo · click en una barra → personas de ese día";
      const days=idx.map(di=>({f:DAYS[di],dow:DMETA[di].dow,n:(evByDate[DAYS[di]]||[]).length}));
      mkc("c_inasdia",{type:"bar",data:{labels:days.map(d=>fdate(d.f)),datasets:[{label:"Inasistencias",data:days.map(d=>d.n),backgroundColor:days.map(d=>d.n>=20?T.red:d.n>=10?T.orange:T.amber),borderRadius:3,maxBarThickness:26}]},
        options:{plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>{const d=days[i[0].dataIndex];return fdate(d.f)+" · "+(DOWF[d.dow]||d.dow);},label:c=>c.parsed.y+" inasistencias"}}},scales:{x:{...AN,ticks:{maxRotation:60,autoSkip:days.length>31,font:{size:9}}},y:{...AG,ticks:{callback:fmt}}},
          onClick:(e,el)=>{if(!el.length)return;const d=days[el[0].index];openDrill(eventDrill("Inasistencias · "+fdate(d.f),(DOWF[d.dow]||d.dow),evByDate[d.f]||[],fdate(d.f)));}}});
    }else{
      if(tit)tit.textContent="Inasistencias por mes";
      if(subt)subt.textContent="Vista mensual · elige un mes en el filtro de arriba para ver el detalle por día · click en una barra → personas del mes";
      const byM={};idx.forEach(di=>{const m=DMETA[di].mes;byM[m]=(byM[m]||0)+(evByDate[DAYS[di]]||[]).length;});
      const months=MES_ORDER.filter(m=>byM[m]!=null);const vals=months.map(m=>byM[m]);const mx=Math.max(1,...vals);
      mkc("c_inasdia",{type:"bar",data:{labels:months,datasets:[{label:"Inasistencias",data:vals,backgroundColor:vals.map(v=>v>=mx*0.66?T.red:v>=mx*0.33?T.orange:T.amber),borderRadius:6,maxBarThickness:64}]},
        options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)+" inasistencias en "+months[c.dataIndex]}}},scales:{x:AN,y:{...AG,ticks:{callback:fmt}}},
          onClick:(e,el)=>{if(!el.length)return;const m=months[el[0].index];openDrill(eventDrill("Inasistencias · "+m,"Mes",EV.filter(e2=>e2.mes===m),m));}}});
    }
  })();

  const cargos=Object.entries(evByCargo).map(([c,ev])=>({c,n:ev.length})).sort((a,b)=>b.n-a.n);
  mkc("c_inascargo",{type:"bar",data:{labels:cargos.map(x=>x.c),datasets:[{label:"Inasistencias",data:cargos.map(x=>x.n),backgroundColor:cargos.map((x,i)=>CC[i%CC.length]),borderRadius:4}]},
    options:{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{...AG,ticks:{callback:fmt}},y:{...AN,ticks:{font:{size:10}}}},
      onClick:(e,el)=>{if(!el.length)return;const c=cargos[el[0].index].c;openDrill(eventDrill(c,"Inasistencias",evByCargo[c],c));}}});

  const DOWO=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  mkc("c_inasdow",{type:"bar",data:{labels:DOWO.map(d=>DOWF[d]),datasets:[{label:"Inasistencias",data:DOWO.map(d=>(evByDow[d]||[]).length),backgroundColor:T.orange,borderRadius:5,maxBarThickness:46}]},
    options:{plugins:{legend:{display:false}},scales:{x:AN,y:{...AG,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const d=DOWO[el[0].index];openDrill(eventDrill("Inasistencias · "+DOWF[d],"",evByDow[d]||[],DOWF[d]));}}});

  const distc={};PARR.forEach(p=>{if(p.inas>0)distc[p.inas]=(distc[p.inas]||0)+1;});
  const dist=Object.entries(distc).map(([k,v])=>({dias:+k,personas:v})).sort((a,b)=>a.dias-b.dias);
  mkc("c_dist",{type:"bar",data:{labels:dist.map(d=>d.dias),datasets:[{label:"Personas",data:dist.map(d=>d.personas),backgroundColor:dist.map(d=>d.dias<=2?T.amber:d.dias<=5?T.orange:T.red),borderRadius:4,maxBarThickness:24}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>dist[i[0].dataIndex].dias+" días de inasistencia",label:c=>c.parsed.y+" personas"}}},scales:{x:{...AN,title:{display:true,text:"Días de inasistencia",color:T.muted}},y:{...AG,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const n=dist[el[0].index].dias;const names=new Set(PARR.filter(p=>p.inas===n).map(p=>p.nombre));openDrill(eventDrill(`Personas con ${n} inasistencias`,`${names.size} personas`,EV.filter(e=>names.has(e.nombre)),`${n} días`));}}});

  const cs=CS.slice().sort((a,b)=>b.asist-a.asist);
  mkc("c_apc",{type:"bar",data:{labels:cs.map(c=>c.cargo),datasets:[
    {label:"Asistencias",data:cs.map(c=>c.asist),backgroundColor:T.green,stack:"s"},
    {label:"Inasistencias",data:cs.map(c=>c.inas),backgroundColor:T.red,stack:"s"},
    {label:"Permisos",data:cs.map(c=>c.permisos),backgroundColor:T.blue,stack:"s"},
    {label:"Descansos",data:cs.map(c=>c.descansos),backgroundColor:T.amber,stack:"s"}]},
    options:{indexAxis:"y",plugins:{legend:{position:"bottom"}},scales:{x:{...AG,stacked:true,ticks:{callback:fmt}},y:{...AN,stacked:true,ticks:{font:{size:9}}}},
      onClick:(e,el)=>{if(!el.length)return;const c=cs[el[0].index].cargo,di=el[0].datasetIndex;
        if(di===1){openDrill(eventDrill(c+" · Inasistencias","",evByCargo[c]||[],c));}
        else{const mk=[p=>p.asist,,p=>p.permisos,p=>p.descansos][di];const lbl=["Asistencias","","Permisos","Descansos"][di];
          openDrill(cargoPeopleFrame(c,PARR.filter(p=>p.cargo===c),mk,fmt,"",lbl));}}}});

  // top table
  const top=PARR.filter(p=>p.inas>0).sort((a,b)=>b.inas-a.inas);
  function draw(q=""){q=q.toLowerCase();const rows=top.filter(p=>p.nombre.toLowerCase().includes(q)||p.cargo.toLowerCase().includes(q));
    $("#tb-inas").innerHTML=rows.map((p,i)=>`<tr class="click" data-n="${esc(p.nombre)}"><td class="num">${top.indexOf(p)+1}</td><td><b>${esc(p.nombre)}</b></td><td>${esc(p.cargo)}</td><td class="num"><span class="pill red">${p.inas}</span></td><td class="num">${fmt(p.asist)}</td><td class="num">${p.permisos}</td></tr>`).join("");
    $("#ct-inas").textContent=rows.length+" personas";
    $("#tb-inas").querySelectorAll("tr").forEach(tr=>tr.onclick=()=>openDrill(fichaFrame(tr.dataset.n)));}
  draw();$("#s-inas").oninput=e=>draw(e.target.value);
}

/* ===================== TAB: MARCACIONES ===================== */
function marcaciones(){
  $("#k-marc").innerHTML=
    kpi({n:fmt(K.marcTot),lbl:"Marcas registradas",sub:"Ingresos y salidas",tone:"ink"})+
    kpi({n:fmt1(K.marc_corr_pct),u:"%",lbl:"Marcaciones correctas",sub:"Sin inconsistencia",tone:"green"})+
    kpi({n:fmt(K.incon),lbl:"Marcaciones incorrectas",sub:`${fmt1(K.marc_inc_pct)}% · click → personas`,tone:"red",click:1,id:"m-in"})+
    kpi({n:fmt(K.sinMarca),lbl:"Personas sin marca",sub:"En algún periodo",tone:"orange",click:1,id:"m-sm"});
  $("#m-in").onclick=metricDrill("Marcaciones incorrectas","Incorrectas",p=>p.incon);
  $("#m-sm").onclick=()=>openDrill(peopleDrill({title:"Personas sin marca",label:"Sin marca",sub:"Periodos sin marcación",people:PARR.filter(p=>p.sinMarca>0),metric:p=>p.sinMarca}));
  buildTrendBoard("marc","correctas");

  // daily incon chart (sigue filtro global)
  $("#msel-marc").innerHTML="";
  (function(){const idx=rangeDayIdx();const inconDiaTot={};INCD.forEach(([pi,di,c])=>{inconDiaTot[DAYS[di]]=(inconDiaTot[DAYS[di]]||0)+c;});
    const days=idx.map(di=>({f:DAYS[di],dow:DMETA[di].dow,incon:inconDiaTot[DAYS[di]]||0}));
    mkc("c_incondia",{type:"bar",data:{labels:days.map(d=>fdate(d.f)),datasets:[{label:"Incorrectas",data:days.map(d=>d.incon),backgroundColor:days.map(d=>d.incon>=120?T.red:d.incon>=80?T.orange:T.amber),borderRadius:3,maxBarThickness:22}]},
      options:{plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>{const d=days[i[0].dataIndex];return fdate(d.f)+" · "+(DOWF[d.dow]||d.dow);},label:c=>c.parsed.y+" marcaciones incorrectas"}}},scales:{x:{...AN,ticks:{maxRotation:90,autoSkip:days.length>40,font:{size:8}}},y:{...AG,ticks:{callback:fmt}}},
        onClick:(e,el)=>{if(!el.length)return;const d=days[el[0].index];const ppl=(inconByDate[d.f]||[]).slice().sort((a,b)=>b.n-a.n);
          openDrill({title:"Marcaciones incorrectas · "+fdate(d.f),sub:(DOWF[d.dow]||d.dow)+" · "+d.incon+" incorrectas",label:fdate(d.f),render(root){
            root.innerHTML=`<div class="dmeta">${ppl.length} personas · ${d.incon} marcaciones incorrectas</div><div class="plist">`+
              ppl.map(x=>`<div class="prow" data-n="${esc(x.nombre)}"><div class="av">${initials(x.nombre)}</div><div class="pn"><b>${esc(x.nombre)}</b><span>${esc(x.cargo)}</span></div><div class="pv">${x.n}<small>incorr.</small></div></div>`).join("")+`</div>`;
            wireRows(root);}});}}});})();
  buildRanking("#rk-marc",INCD,r=>r[2],{unit:"",vlabel:"incorr.",color:"#D32F2F"});

  const cs=CS.filter(c=>c.incon>0).sort((a,b)=>b.incon-a.incon);
  mkc("c_inconcargo",{type:"bar",data:{labels:cs.map(c=>c.cargo),datasets:[{label:"Incorrectas",data:cs.map(c=>c.incon),backgroundColor:cs.map((c,i)=>CC[i%CC.length]),borderRadius:5,maxBarThickness:60}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)+" marcaciones incorrectas"}}},scales:{x:{...AN,ticks:{maxRotation:90,minRotation:45,autoSkip:false,font:{size:9}}},y:{...AG,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const c=cs[el[0].index].cargo;openDrill(cargoPeopleFrame(c,PARR.filter(p=>p.cargo===c),p=>p.incon,fmt,"","Incorrectas"));}}});

  const mcnt=[0,0,0,0];MET.forEach(r=>mcnt[r[2]]++);const mlab=METODO_NAMES;
  const metCol={"Reloj Control":T.ink,"App":T.amber,"Otro":"#9a9a94"};
  const metb=mlab.map((m,i)=>({metodo:m,count:mcnt[i]})).filter(x=>x.count>0&&x.metodo!=="Marca Manual");
  mkc("c_metodo",{type:"doughnut",data:{labels:metb.map(m=>m.metodo),datasets:[{data:metb.map(m=>m.count),backgroundColor:metb.map(m=>metCol[m.metodo]||"#9a9a94"),borderColor:"#fff",borderWidth:3}]},
    options:{cutout:"56%",plugins:{legend:{position:"right"},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.parsed)}`}}},
      onClick:(e,el)=>{if(!el.length)return;const met=metb[el[0].index].metodo;openDrill(peopleDrill({title:"Método: "+met,label:met,sub:"Marcas por persona",people:PARR,metric:p=>p.metodo[met]||0}));}}});

  const top=PARR.filter(p=>p.incon>0).sort((a,b)=>b.incon-a.incon);
  function draw(q=""){q=q.toLowerCase();const rows=top.filter(p=>p.nombre.toLowerCase().includes(q)||p.cargo.toLowerCase().includes(q));
    $("#tb-marc").innerHTML=rows.map(p=>`<tr class="click" data-n="${esc(p.nombre)}"><td class="num">${top.indexOf(p)+1}</td><td><b>${esc(p.nombre)}</b></td><td>${esc(p.cargo)}</td><td class="num"><span class="pill red">${p.incon}</span></td><td class="num">${fmt(p.marcTot)}</td></tr>`).join("");
    $("#ct-marc").textContent=rows.length+" personas";
    $("#tb-marc").querySelectorAll("tr").forEach(tr=>tr.onclick=()=>openDrill(fichaFrame(tr.dataset.n)));}
  draw();$("#s-marc").oninput=e=>draw(e.target.value);
}

/* ===================== TAB: JORNADA ===================== */
function jornada(){
  const jc=bandCounts(JLD,6);
  const exc=jc[3]+jc[4]+jc[5];
  $("#k-jornada").innerHTML=
    kpi({n:fmt(K.dias_trab),lbl:"Días trabajados",sub:"Registros con jornada",tone:"ink"})+
    kpi({n:fmt(exc),lbl:"Excesos de JL",sub:"Jornadas > 12 h · click → personas",tone:"orange",click:1,id:"j-ex"})+
    kpi({n:fmt(jc[5]),lbl:"Jornadas > 14 h",sub:"Exceso crítico · click → personas",tone:"red",click:1,id:"j-14"})+
    kpi({n:fmt(jc[4]),lbl:"Jornadas 13–14 h",tone:"ink",click:1,id:"j-34"})+
    kpi({n:fmt(jc[3]),lbl:"Jornadas 12–13 h",tone:"amber",click:1,id:"j-23"});
  $("#j-ex").onclick=()=>openDrill(bandPeopleFrame("Excesos de JL (>12 h)","Excesos",JLD,[5,4,3],JLB,JLCOL));
  $("#j-14").onclick=()=>openDrill(bandPeopleFrame("Jornadas > 14 h",">14h",JLD,[5],JLB,JLCOL));
  $("#j-34").onclick=()=>openDrill(bandPeopleFrame("Jornadas 13–14 h","13–14h",JLD,[4],JLB,JLCOL));
  $("#j-23").onclick=()=>openDrill(bandPeopleFrame("Jornadas 12–13 h","12–13h",JLD,[3],JLB,JLCOL));
  buildTrendBoard("jl","jornada");

  // Clasificación JL acumulado (6 bandas)
  mkc("c_jlband",{type:"bar",data:{labels:JLB.map(b=>b+" h"),datasets:[{label:"Días",data:jc,backgroundColor:JLCOL,borderRadius:4}]},
    options:{indexAxis:"y",plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.x)+" días trabajados"}}},scales:{x:{...AG,ticks:{callback:fmt}},y:AN},
      onClick:(e,el)=>{if(!el.length)return;const b=el[0].index;openDrill(bandPeopleFrame("Clasificación JL · "+JLB[b]+" h",JLB[b]+"h",JLD,[b],JLB,JLCOL));}}});

  // Excesos por mes (stacked 12-13,13-14,>14)
  const bm=bandByMonth(JLD,6);
  mkc("c_jlmes",{type:"bar",data:{labels:MES_ORDER,datasets:[
    {label:">14 h",data:MES_ORDER.map(m=>bm[m][5]),backgroundColor:JLCOL[5],stack:"s"},
    {label:"13–14 h",data:MES_ORDER.map(m=>bm[m][4]),backgroundColor:JLCOL[4],stack:"s"},
    {label:"12–13 h",data:MES_ORDER.map(m=>bm[m][3]),backgroundColor:JLCOL[3],stack:"s"}]},
    options:{plugins:{legend:{position:"bottom"}},scales:{x:{...AN,stacked:true},y:{...AG,stacked:true,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const m=MES_ORDER[el[0].index];const rows=bandFilter(JLD,"mes",m);openDrill(bandPeopleFrame("Excesos de JL · "+m,m,rows,[5,4,3],JLB,JLCOL));}}});

  // Excesos por día (sigue filtro global)
  $("#msel-jl").innerHTML="";
  (function(){const idx=rangeDayIdx();const byd={};JLD.forEach(([pi,di,b])=>{if(b>=3){(byd[di]=byd[di]||[0,0,0])[5-b]++;}});
    const days=idx.map(di=>({f:DAYS[di],di,c:byd[di]||[0,0,0]}));
    mkc("c_jldia",{type:"bar",data:{labels:days.map(d=>fdate(d.f)),datasets:[
      {label:">14 h",data:days.map(d=>d.c[0]),backgroundColor:JLCOL[5],stack:"s"},
      {label:"13–14 h",data:days.map(d=>d.c[1]),backgroundColor:JLCOL[4],stack:"s"},
      {label:"12–13 h",data:days.map(d=>d.c[2]),backgroundColor:JLCOL[3],stack:"s"}]},
      options:{plugins:{legend:{position:"bottom"},tooltip:{callbacks:{title:i=>{const d=days[i[0].dataIndex];return fdate(d.f)+" · "+(DOWF[DMETA[d.di].dow]||"");}}}},scales:{x:{...AN,stacked:true,ticks:{maxRotation:90,autoSkip:days.length>40,font:{size:8}}},y:{...AG,stacked:true,ticks:{callback:fmt}}},
        onClick:(e,el)=>{if(!el.length)return;const d=days[el[0].index];const rows=JLD.filter(r=>r[1]===d.di);openDrill(bandPeopleFrame("Excesos · "+fdate(d.f),fdate(d.f),rows,[5,4,3],JLB,JLCOL));}}});})();

  buildBandWidget({pfx:"jl",stream:JLD,labels:JLB,colors:JLCOL,focus:[5,4,3]});
  buildJornadaCorta();

  const RL={RNO:"Nocturno",RDD:"Dom. diurno",RND:"Dom. noct.",RDF:"Fest. diurno",RNF:"Fest. noct."};
  const rb=DATA.recargos_breakdown;
  mkc("c_rec",{type:"doughnut",data:{labels:rb.map(r=>r.label),datasets:[{data:rb.map(r=>r.horas),backgroundColor:[T.ink,T.orange,T.amber,T.red,"#9a9a94"],borderColor:"#fff",borderWidth:2}]},
    options:{cutout:"56%",plugins:{legend:{position:"right",labels:{font:{size:10}}},tooltip:{callbacks:{label:c=>`${c.label}: ${fmt(c.parsed)} h`}}},
      onClick:(e,el)=>{if(!el.length)return;const t=rb[el[0].index].tipo;openDrill(peopleDrill({title:"Recargo "+RL[t],label:RL[t],sub:"Horas por persona (periodo completo)",people:A_PARR,metric:p=>p.rec[t]||0,unit:" h",fmtv:fmt1}));}}});

  const pm=DATA.por_mes;
  mkc("c_htmes",{type:"bar",data:{labels:pm.map(m=>m.mes),datasets:[{label:"Horas",data:pm.map(m=>m.ht),backgroundColor:T.orange,borderRadius:6,maxBarThickness:48}]},options:{plugins:{legend:{display:false}},scales:{x:AN,y:{...AG,ticks:{callback:fmt}}}}});
}

/* ===================== TAB: DESCANSO EFECTIVO ===================== */
function descanso(){
  const dc=bandCounts(DESD,3);
  const noef=dc[0]+dc[1];
  const totRest=dc[0]+dc[1]+dc[2];
  $("#k-desc").innerHTML=
    kpi({n:fmt(noef),lbl:"Descansos no efectivos",sub:"Menos de 10 h · click → personas",tone:"red",click:1,id:"d-ne"})+
    kpi({n:fmt(dc[0]),lbl:"Descanso < 8 h",sub:"Crítico · click → personas",tone:"red",click:1,id:"d-8"})+
    kpi({n:fmt(dc[1]),lbl:"Descanso 8–10 h",sub:"click → personas",tone:"ink",click:1,id:"d-810"})+
    kpi({n:fmt1(pct(noef,totRest)),u:"%",lbl:"% no efectivo",sub:"Sobre descansos entre turnos",tone:"amber"})+
    kpi({n:fmt(K.descansos),lbl:"Días de descanso",sub:"Descanso semanal otorgado",tone:"orange",click:1,id:"d-de"});
  $("#d-ne").onclick=()=>openDrill(bandPeopleFrame("Descansos no efectivos (<10 h)","No efectivos",DESD,[0,1],DEB,DECOL));
  $("#d-8").onclick=()=>openDrill(bandPeopleFrame("Descanso < 8 h","<8h",DESD,[0],DEB,DECOL));
  $("#d-810").onclick=()=>openDrill(bandPeopleFrame("Descanso 8–10 h","8–10h",DESD,[1],DEB,DECOL));
  $("#d-de").onclick=metricDrill("Días de descanso","Descansos",p=>p.descansos);
  buildTrendBoard("desc","descef");

  // acumulado por banda (con etiquetas de valor para que todas las bandas se vean)
  const descTot=dc.reduce((a,b)=>a+b,0);
  mkc("c_descband",{type:"bar",data:{labels:["< 8 h","8–10 h","> 10 h (efectivo)"],datasets:[{label:"Descansos",data:dc,backgroundColor:DECOL,borderRadius:6,maxBarThickness:70}]},
    options:{indexAxis:"y",layout:{padding:{right:70}},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.x)+" descansos ("+fmt1(descTot?c.parsed.x/descTot*100:0)+"%)"}}},scales:{x:{...AG,ticks:{callback:fmt}},y:{...AN,ticks:{font:{size:13,weight:"700"}}}},
      onClick:(e,el)=>{if(!el.length)return;const b=el[0].index;openDrill(bandPeopleFrame("Descanso · "+DEB[b]+" h",DEB[b]+"h",DESD,[b],DEB,DECOL));}},
    plugins:[{afterDatasetsDraw(chart){const{ctx,chartArea}=chart;const meta=chart.getDatasetMeta(0);ctx.save();ctx.font="800 13px Segoe UI,system-ui,sans-serif";ctx.textBaseline="middle";meta.data.forEach((bar,i)=>{const v=dc[i];const txt=fmt(v)+"  ("+fmt1(descTot?v/descTot*100:0)+"%)";const inside=bar.x>chartArea.right-95;ctx.fillStyle=inside?"#fff":"#2a2a28";ctx.textAlign=inside?"right":"left";ctx.fillText(txt,inside?bar.x-10:bar.x+10,bar.y);});ctx.restore();}}]});

  // no efectivos por mes (todo <10h junto, sin separar bandas)
  const bm=bandByMonth(DESD,3);
  mkc("c_descmes",{type:"bar",data:{labels:MES_ORDER,datasets:[
    {label:"No efectivo (< 10 h)",data:MES_ORDER.map(m=>bm[m][0]+bm[m][1]),backgroundColor:DECOL[0],borderRadius:5,maxBarThickness:48}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>fmt(c.parsed.y)+" descansos < 10 h"}}},scales:{x:AN,y:{...AG,ticks:{callback:fmt}}},
      onClick:(e,el)=>{if(!el.length)return;const m=MES_ORDER[el[0].index];const rows=bandFilter(DESD,"mes",m);openDrill(bandPeopleFrame("No efectivos · "+m,m,rows,[0,1],DEB,DECOL));}}});

  buildBandWidget({pfx:"de",stream:DESD,labels:DEB,colors:DECOL,focus:[0,1]});

  const cd=CS.filter(c=>c.descansos>0).sort((a,b)=>b.descansos-a.descansos);
  mkc("c_desccargo",{type:"bar",data:{labels:cd.map(c=>c.cargo),datasets:[{label:"Descansos",data:cd.map(c=>c.descansos),backgroundColor:cd.map((c,i)=>CC[i%CC.length]),borderRadius:4}]},
    options:{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{...AG,ticks:{callback:fmt}},y:{...AN,ticks:{font:{size:9}}}},
      onClick:(e,el)=>{if(!el.length)return;const c=cd[el[0].index].cargo;openDrill(cargoPeopleFrame(c,PARR.filter(p=>p.cargo===c),p=>p.descansos,fmt,"","Descansos"));}}});
  buildCruceJL();
}

/* ----- Cruce: exceso de jornada (>12 h) + descanso no efectivo (<10 h) el MISMO día ----- */
function buildCruceJL(){
  const jl={};                              // pi|di -> banda JL, solo >12 h (bandas 3,4,5)
  for(const [pi,di,b] of JLD){ if(b>=3) jl[pi+"|"+di]=b; }
  const ht={};                              // pi|di -> horas trabajadas
  for(const r of HTD){ ht[r[0]+"|"+r[1]]=r[2]/10; }
  const rows=[];
  for(const [pi,di,b] of DESD){             // descanso no efectivo (<10 h = bandas 0 y 1)
    if(b>1) continue;
    const k=pi+"|"+di, jb=jl[k];
    if(jb===undefined) continue;            // ese día no trabajó >12 h -> no aplica
    rows.push({pi,di,jb,db:b,h:ht[k]??0,dow:DMETA[di].dow});
  }
  rows.sort((x,y)=>y.h-x.h);                 // jornada más larga primero
  let q="",dw="";
  const inp=$("#cr-search"); if(inp) inp.oninput=e=>{q=e.target.value.toLowerCase();draw();};
  const sd=$("#cr-dow");    if(sd)  sd.onchange=e=>{dw=e.target.value;draw();};
  function draw(){
    let rs=rows;
    if(dw) rs=rs.filter(r=>r.dow===dw);
    if(q)  rs=rs.filter(r=>PRS[r.pi].n.toLowerCase().includes(q)||PRS[r.pi].c.toLowerCase().includes(q));
    const nPer=new Set(rs.map(r=>r.pi)).size;
    const cnt=$("#cr-count"); if(cnt) cnt.textContent=fmt(rs.length)+" casos · "+fmt(nPer)+" personas";
    const body=$("#cr-body"); if(!body) return;
    if(!rs.length){ body.innerHTML=`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">Sin casos en el periodo/CD/día seleccionado.</td></tr>`; return; }
    body.innerHTML=rs.map(r=>{const p=PRS[r.pi],f=DAYS[r.di],cc=CD_META[p.cd]?.color||"#6f6f6a",cl=CD_META[p.cd]?.label||p.cd,g=p.g||"—";
      const cdPill=`<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:${cc}1f;color:${cc}">${esc(cl)}</span>`;
      const gPill=g==="—"?`<span style="color:var(--muted2)">—</span>`:`<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;background:#ece9e4;color:#57534d">${esc(g)}</span>`;
      const dcol=r.db===0?"#D32F2F":"#F57C00";
      const dPill=`<span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;background:${dcol}1f;color:${dcol}">${DEB[r.db]} h</span>`;
      return `<tr class="click" data-pi="${r.pi}" data-di="${r.di}">`+
        `<td style="font-weight:600;white-space:nowrap">${esc(fdate(f))}</td>`+
        `<td>${gPill}</td>`+
        `<td><b>${esc(p.n)}</b></td>`+
        `<td>${cdPill}</td>`+
        `<td class="num" style="color:#D32F2F;font-weight:800">${fmt1(r.h)} h</td>`+
        `<td>${dPill}</td></tr>`;
    }).join("");
    body.querySelectorAll("tr.click").forEach(tr=>tr.onclick=()=>openDrill(cruceDetalleFrame(+tr.dataset.pi,+tr.dataset.di)));
  }
  draw();
}

/* Horas de entrada/salida y descanso previo de un persona-día, desde las marcas (metodoDays). */
function crHoras(pi,di){
  const crudas=A_MET.filter(r=>r[0]===pi&&r[1]===di&&r.length>4).sort((a,b)=>a[3]-b[3]);
  const hoy=[]; for(const r of crudas){const q=hoy[hoy.length-1];if(q&&q[4]===r[4]&&r[3]-q[3]<10)continue;hoy.push(r);}
  const ing=hoy.filter(r=>r[4]===0), sal=hoy.filter(r=>r[4]===1);
  const e=ing.length?ing[0][3]:null;
  const sHoy=e!=null?sal.filter(r=>r[3]>e):[];
  const s=sHoy.length?sHoy[sHoy.length-1][3]:null;
  let prev=null,prevDi=null;
  for(let k=di-1;k>=Math.max(0,di-3)&&prev===null;k--){
    const ss=A_MET.filter(r=>r[0]===pi&&r[1]===k&&r.length>4&&r[4]===1).sort((a,b)=>a[3]-b[3]);
    if(ss.length){prev=ss[ss.length-1][3];prevDi=k;}
  }
  const desc=(prev!=null&&e!=null)?((di-prevDi)*1440+e-prev)/60:null;
  return {e,s,prev,prevDi,desc};
}

/* Cuadrito de detalle del cruce: por qué fue exceso de JL y por qué el descanso no fue efectivo. */
function cruceDetalleFrame(pi,di){
  const nombre=PRS[pi].n;
  return {title:nombre,sub:"Cruce jornada × descanso · "+fdateLarga(DAYS[di]),label:"Detalle del día",render:root=>{
    const p=PRS[pi],f=DAYS[di],cd=CD_META[p.cd]?.label||p.cd,g=p.g||"—";
    const hh=(()=>{const r=HTD.find(x=>x[0]===pi&&x[1]===di);return r?r[2]/10:null;})();
    const db=(()=>{const r=DESD.find(x=>x[0]===pi&&x[1]===di);return r?r[2]:null;})();
    const {e,s,prev,prevDi,desc}=crHoras(pi,di);
    let h=`<div class="fichahero"><div class="av">${initials(nombre)}</div><div><h3>${esc(nombre)}</h3><div class="fc">${esc(p.c)} · ${esc(g)} · ${esc(cd)}</div></div></div>`;
    h+=`<div class="fsec"><h4>${esc(fdateLarga(f))}</h4>`;
    h+=`<div class="kv"><span>Entrada</span><b>${e!=null?hhmm(e):"sin registrar"}</b></div>`;
    h+=`<div class="kv"><span>Salida</span><b>${s!=null?hhmm(s):"turno sin cerrar"}</b></div>`;
    h+=`<div class="kv"><span>Jornada trabajada</span><b style="color:#D32F2F">${hh!=null?dur(hh):"—"} · exceso (> 12 h)</b></div>`;
    if(prev!=null) h+=`<div class="kv"><span>Salida turno anterior (${esc(DOWL[new Date(DAYS[prevDi]+"T00:00:00").getDay()])})</span><b>${hhmm(prev)}</b></div>`;
    const descTxt=desc!=null?dur(desc):((db!=null?DEB[db]+" h":"—"));
    h+=`<div class="kv"><span>Descanso entre turnos</span><b style="color:#D32F2F">${descTxt} · no efectivo (&lt; 10 h)</b></div>`;
    h+=`</div>`;
    h+=`<div class="drill-note">Entró al cruce porque <b>ese día trabajó ${hh!=null?fmt1(hh):"—"} h</b> (más de 12 h) y <b>solo descansó ${desc!=null?fmt1(desc):(db!=null?DEB[db]:"")+" h"}</b> desde la salida del turno anterior (menos de 10 h entre turnos).</div>`;
    h+=`<div style="margin-top:12px"><button id="cr-ficha" style="background:#F57C00;color:#fff;border:none;border-radius:8px;padding:9px 15px;font-family:inherit;font-weight:700;font-size:12px;cursor:pointer">Ver ficha completa ›</button></div>`;
    root.innerHTML=h;
    const btn=root.querySelector("#cr-ficha"); if(btn) btn.onclick=()=>pushDrill(fichaFrame(nombre));
  }};
}

/* ----- Jornada corta / falta de descanso efectivo (lista completa, periodo global) ----- */
function buildJornadaCorta(){
  let thr=0,q="";
  $("#jc-ctl").innerHTML=`<div class="rkctl"><span style="font-size:12px;font-weight:700;color:var(--muted)">Umbral de jornada:</span>
    <select class="rksel" id="jc-thr">
      <option value="0">Todos (menor jornada primero)</option>
      <option value="10">Menos de 10 h</option><option value="9">Menos de 9 h</option>
      <option value="8">Menos de 8 h</option><option value="7">Menos de 7 h</option>
      <option value="6">Menos de 6 h</option><option value="5">Menos de 5 h</option>
    </select></div>`;
  $("#jc-thr").onchange=e=>{thr=+e.target.value;draw();};
  $("#jc-search").oninput=e=>{q=e.target.value.toLowerCase();draw();};
  function agg(){const a={};
    for(const [pi,di,htx] of HTD){const h=htx/10;const o=a[pi]||(a[pi]={h:0,dias:0,cortos:0});o.h+=h;o.dias++;if(thr&&h<thr)o.cortos++;}
    return a;}
  function draw(){const a=agg();let rows=Object.entries(a).map(([pi,o])=>({pi:+pi,...o}));
    if(thr){rows=rows.filter(r=>r.cortos>0);rows.sort((x,y)=>y.cortos-x.cortos||x.h-y.h);}
    else{rows.sort((x,y)=>x.h-y.h);}
    if(q)rows=rows.filter(r=>PRS[r.pi].n.toLowerCase().includes(q)||PRS[r.pi].c.toLowerCase().includes(q));
    $("#jc-count").textContent=rows.length+" personas"+(thr?` · con jornadas < ${thr} h`:"");
    const list=$("#jc-list");
    if(!rows.length){list.innerHTML=`<div class="rkempty">Sin registros en el periodo seleccionado.</div>`;return;}
    list.innerHTML=rows.map((r,i)=>{const p=PRS[r.pi];
      const main=thr?`${r.cortos}`:`${fmt1(r.h)}`;
      const unit=thr?"":" h";
      const sub=thr?`días < ${thr}h`:"h totales";
      const extra=thr?`${fmt1(r.h)} h · ${r.dias} días`:`${r.dias} días · ${fmt1(r.h/r.dias)} h/día`;
      const col=thr?"#D32F2F":(r.h/r.dias<8?"#D32F2F":r.h/r.dias<9?"#F57C00":"#2a2a28");
      return `<div class="prow" data-n="${esc(p.n)}"><div class="av" style="background:${thr?'linear-gradient(140deg,#e53935,#b71c1c)':'linear-gradient(140deg,#FFB300,#F57C00)'}">${i+1}</div>
        <div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}${extra?" · "+extra:""}</span></div>
        <div class="pv" style="color:${col}">${main}${unit}<small>${sub}</small></div></div>`;}).join("");
    list.querySelectorAll(".prow").forEach(el=>el.onclick=()=>openDrill(fichaFrame(el.dataset.n)));}
  draw();
}


/* ===================== TENDENCIA POR MES ===================== */
/* Siempre muestra el panorama mes a mes (no depende del filtro de periodo).
   Sí respeta el filtro global de cargo (CG). */
let PRESENT_MONTHS=[];(function(){const s=new Set();DMETA.forEach(m=>s.add(m.mes));PRESENT_MONTHS=MES_ORDER.filter(m=>s.has(m));})();
function zeroM(){const o={};PRESENT_MONTHS.forEach(m=>o[m]=0);return o;}
const JL_THR=[{k:"-2",sign:"-",h:2,lbl:"−2 h"},{k:"-4",sign:"-",h:4,lbl:"−4 h"},{k:"-6",sign:"-",h:6,lbl:"−6 h"},{k:"+10",sign:"+",h:10,lbl:"+10 h"},{k:"+12",sign:"+",h:12,lbl:"+12 h"},{k:"+14",sign:"+",h:14,lbl:"+14 h"}];
const TREND_METRICS={
  inas:{label:"Ausentismo total %",color:T.red,goodUp:false},
  correctas:{label:"Marcaciones correctas %",color:T.green,goodUp:true},
  jornada:{label:"Jornada laboral",color:T.orange,goodUp:false},
  descef:{label:"Descanso efectivo %",color:T.amber,goodUp:true}
};
function trendSeries(metric,thr){
  const g=zeroM();
  if(metric==="inas"){const inasM=zeroM(),permM=zeroM(),den=zeroM(),raw={};
    for(const r of A_INAD){if(!inCG(r[0]))continue;const m=DMETA[r[1]].mes;inasM[m]++;den[m]++;}
    for(const r of A_DAY){if(!inCG(r[0]))continue;const m=DMETA[r[1]].mes;if(r[2]===0)den[m]++;else if(r[2]===2){permM[m]++;den[m]++;}}
    PRESENT_MONTHS.forEach(m=>{if(!den[m]){g[m]=null;raw[m]={ina:0,den:0};return;}const inj=Math.round(inasM[m]/den[m]*1000)/10,jus=Math.round(permM[m]/den[m]*1000)/10;g[m]=Math.round((inj+jus)*10)/10;raw[m]={ina:inasM[m]+permM[m],den:den[m]};});
    return{vals:g,sub:"tasa de ausentismo total: (inasistencias + permisos) ÷ días programados",rate:true,raw};}
  if(metric==="correctas"){const tot=zeroM(),inc=zeroM(),raw={};
    for(const r of A_MET){if(!inCG(r[0]))continue;tot[DMETA[r[1]].mes]++;}
    for(const r of A_INCD){if(!inCG(r[0]))continue;inc[DMETA[r[1]].mes]+=r[2];}
    PRESENT_MONTHS.forEach(m=>{const ok=Math.max(0,tot[m]-inc[m]);g[m]=tot[m]?Math.round(ok/tot[m]*1000)/10:null;raw[m]={ina:ok,den:tot[m]};});
    return{vals:g,sub:"% de marcaciones sin inconsistencia sobre el total del mes",rate:true,raw};}
  if(metric==="descef"){const ef=zeroM(),den=zeroM(),raw={};
    for(const r of A_DESD){if(!inCG(r[0]))continue;const m=DMETA[r[1]].mes;den[m]++;if(r[2]===2)ef[m]++;}
    PRESENT_MONTHS.forEach(m=>{g[m]=den[m]?Math.round(ef[m]/den[m]*1000)/10:null;raw[m]={ina:ef[m],den:den[m]};});
    return{vals:g,sub:"% de descansos entre turnos mayores a 10 h sobre el total del mes",rate:true,raw};}
  if(metric==="jornada"){const okc=zeroM(),den=zeroM(),raw={};
    for(const r of A_HTD){if(!inCG(r[0]))continue;const m=DMETA[r[1]].mes;den[m]++;const h=r[2]/10,ok=thr.sign==="+"?h>=thr.h:h<thr.h;if(ok)okc[m]++;}
    PRESENT_MONTHS.forEach(m=>{g[m]=den[m]?Math.round(okc[m]/den[m]*1000)/10:null;raw[m]={ina:okc[m],den:den[m]};});
    return{vals:g,sub:(thr.sign==="+"?"% de jornadas de "+thr.h+" h o más":"% de jornadas menores a "+thr.h+" h")+" sobre las trabajadas del mes",rate:true,raw};}
  return{vals:g,sub:""};
}
function trendDrill(metric,mes,thr){
  const agg={},add=(pi,inc)=>{if(!inCG(pi))return;agg[pi]=(agg[pi]||0)+inc;};
  let title,label;
  if(metric==="ausJI"){for(const r of A_INAD){if(DMETA[r[1]].mes!==mes)continue;add(r[0],1);}for(const r of A_DAY){if(DMETA[r[1]].mes!==mes||r[2]!==2)continue;add(r[0],1);}title="Ausencias (just. + injust.) · "+mes;label="ausencias";}
  else if(metric==="inas"){for(const r of A_INAD){if(DMETA[r[1]].mes!==mes)continue;add(r[0],1);}title="Inasistencias · "+mes;label="inasist.";}
  else if(metric==="correctas"){for(const r of A_MET){if(DMETA[r[1]].mes!==mes)continue;add(r[0],1);}for(const r of A_INCD){if(DMETA[r[1]].mes!==mes)continue;add(r[0],-r[2]);}title="Marcaciones correctas · "+mes;label="correctas";}
  else if(metric==="descef"){for(const r of A_DESD){if(DMETA[r[1]].mes!==mes||r[2]!==2)continue;add(r[0],1);}title="Descanso efectivo · "+mes;label="efectivos";}
  else{for(const r of A_HTD){if(DMETA[r[1]].mes!==mes)continue;const h=r[2]/10,ok=thr.sign==="+"?h>=thr.h:h<thr.h;if(ok)add(r[0],1);}title=(thr.sign==="+"?"Jornadas ≥ "+thr.h+" h · ":"Jornadas < "+thr.h+" h · ")+mes;label="días";}
  const rows=Object.entries(agg).map(([pi,v])=>({pi:+pi,v})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  return {title,label:mes,sub:(CG?CG+" · ":"")+"Click en una persona → ficha",render(root){
    root.innerHTML=`<div class="dmeta">${rows.length} personas · ${fmt(rows.reduce((a,r)=>a+r.v,0))} ${label}</div>`+
      (rows.length?`<div class="plist">`+rows.map(x=>{const p=PRS[x.pi];return `<div class="prow" data-n="${esc(p.n)}"><div class="av">${initials(p.n)}</div><div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span></div><div class="pv">${fmt(x.v)}<small>${label}</small></div></div>`;}).join("")+`</div>`:`<div class="rkempty">Sin registros.</div>`);
    wireRows(root);}};
}
function trendJI(){
  const asi=zeroM(),inj=zeroM(),jus=zeroM();
  for(const r of A_DAY){if(!inCG(r[0]))continue;const m=DMETA[r[1]].mes;if(r[2]===0)asi[m]++;else if(r[2]===2)jus[m]++;}
  for(const r of A_INAD){if(!inCG(r[0]))continue;inj[DMETA[r[1]].mes]++;}
  const injP=zeroM(),jusP=zeroM();
  PRESENT_MONTHS.forEach(m=>{const den=asi[m]+inj[m]+jus[m];injP[m]=den?Math.round(inj[m]/den*1000)/10:null;jusP[m]=den?Math.round(jus[m]/den*1000)/10:null;});
  return{injP,jusP,inj,jus};
}
function justDrill(mes){
  const byTipo={},pplByTipo={};
  for(const r of PERMD){if(DMETA[r[1]].mes!==mes||!inCG(r[0]))continue;const t=PERMLAB[r[2]];byTipo[t]=(byTipo[t]||0)+1;(pplByTipo[t]=pplByTipo[t]||{});pplByTipo[t][r[0]]=(pplByTipo[t][r[0]]||0)+1;}
  const tipos=Object.entries(byTipo).sort((a,b)=>b[1]-a[1]);
  const total=tipos.reduce((a,x)=>a+x[1],0);
  const frame={title:"Ausentismo justificado · "+mes,label:mes,sub:(CG?CG+" · ":"")+"Click en un motivo → personas",
    render(root){
      if(!tipos.length){root.innerHTML=`<div class="rkempty">Sin detalle de motivos para este mes (disponible desde julio).</div>`;return;}
      root.innerHTML=`<div class="dmeta">${fmt(total)} días justificados · ${tipos.length} motivos</div><div class="plist">`+
        tipos.map(([t,n])=>`<div class="prow click rowtipo" data-t="${esc(t)}"><div class="pn"><b>${esc(t)}</b><span>${fmt1(n/total*100)}% del justificado</span></div><div class="pv">${fmt(n)}<small>días</small></div></div>`).join("")+`</div>`;
      root.querySelectorAll(".rowtipo").forEach(row=>row.onclick=()=>{
        const t=row.dataset.t,ppl=pplByTipo[t]||{};
        const rows=Object.entries(ppl).map(([pi,v])=>({pi:+pi,v})).sort((a,b)=>b.v-a.v);
        root.innerHTML=`<div class="dmeta"><button class="backbtn" id="jback">‹ motivos</button> <b>${esc(t)}</b> · ${mes} · ${rows.length} personas</div><div class="plist">`+
          rows.map(x=>{const p=PRS[x.pi];return `<div class="prow" data-n="${esc(p.n)}"><div class="av">${initials(p.n)}</div><div class="pn"><b>${esc(p.n)}</b><span>${esc(p.c)}</span></div><div class="pv">${fmt(x.v)}<small>días</small></div></div>`;}).join("")+`</div>`;
        $("#jback").onclick=()=>frame.render(root);wireRows(root);
      });
    }};
  return frame;
}
function buildTrendBoard(pfx,defMetric){
  const ctl=$("#trend-"+pfx+"-ctl");if(!ctl)return;
  let metric=defMetric||"inas",thrK="+12";
  const thrObj=()=>JL_THR.find(x=>x.k===thrK)||JL_THR[4];
  function drawCtl(){
    const metrics=[["inas","Ausentismo total %"],["ausJI","Ausentismo J/I"],["correctas","Marcaciones correctas %"],["jornada","Jornada laboral %"],["descef","Descanso efectivo %"]];
    let h=`<div class="trbar"><span class="trlab">Indicador</span>`+metrics.map(([k,l])=>`<button class="trchip${metric===k?" on":""}" data-k="${k}">${l}</button>`).join("")+`<span class="trmeta" id="trend-${pfx}-meta"></span></div>`;
    if(metric==="jornada")h+=`<div class="trbar"><span class="trlab">Umbral</span><div class="thrscroll">`+JL_THR.map(t=>`<button class="thrchip${thrK===t.k?" on":""}" data-t="${t.k}">${t.lbl}</button>`).join("")+`</div></div>`;
    ctl.innerHTML=h;
    ctl.querySelectorAll(".trchip").forEach(b=>b.onclick=()=>{metric=b.dataset.k;drawCtl();drawChart();});
    ctl.querySelectorAll(".thrchip").forEach(b=>b.onclick=()=>{thrK=b.dataset.t;drawCtl();drawChart();});
  }
  function drawChart(){
    const labels=PRESENT_MONTHS;
    if(metric==="ausJI"){
      const s=trendJI();
      const injv=labels.map(m=>s.injP[m]),jusv=labels.map(m=>s.jusP[m]);
      const tot=labels.map((m,i)=>injv[i]==null?null:Math.round((injv[i]+jusv[i])*10)/10);
      const valid=tot.map((v,i)=>[v,i]).filter(x=>x[0]!=null);
      let dtxt="—",dcls="flat";
      if(valid.length>=2){const [fv,fi]=valid[0],[lv]=valid[valid.length-1];const d=lv-fv;
        dcls=Math.abs(d)<0.2?"flat":(d<0?"good":"bad");dtxt=(d>0.2?"▲":d<-0.2?"▼":"■")+" "+fmt1(Math.abs(d))+" pp vs "+labels[fi];}
      const meta=$("#trend-"+pfx+"-meta");if(meta)meta.innerHTML=`<span class="tdelta ${dcls}">${dtxt}</span>`;
      const sub=$("#trend-"+pfx+"-sub");if(sub)sub.style.display="none";
      mkc("c_trend_"+pfx,{type:"bar",data:{labels,datasets:[
        {label:"Injustificado",data:injv,backgroundColor:T.red,stack:"a",maxBarThickness:56},
        {label:"Justificado",data:jusv,backgroundColor:T.amber,stack:"a",maxBarThickness:56}]},
        options:{plugins:{legend:{display:true,position:"bottom",labels:{boxWidth:12,font:{size:11}}},
          tooltip:{callbacks:{title:i=>labels[i[0].dataIndex]+" · ausentismo "+fmt1(tot[i[0].dataIndex])+"%",
            label:c=>c.dataset.label+": "+fmt1(c.parsed.y)+"% ("+fmt(c.dataset.label==="Injustificado"?s.inj[labels[c.dataIndex]]:s.jus[labels[c.dataIndex]])+" días)"}}},
          scales:{x:{...AN,stacked:true},y:{...AG,stacked:true,ticks:{callback:v=>v+"%"}}},
          onClick:(e,el)=>{if(!el.length)return;const mes=labels[el[0].index];openDrill(el[0].datasetIndex===1?justDrill(mes):trendDrill("inas",mes));}}});
      return;
    }
    const cfg=TREND_METRICS[metric],t=thrObj(),s=trendSeries(metric,t);
    const vals=labels.map(m=>s.vals[m]);
    const goodUp=metric==="jornada"?false:cfg.goodUp;
    const isRate=!!s.rate;
    let dtxt="—",dcls="flat";const valid=vals.map((v,i)=>[v,i]).filter(x=>x[0]!=null);
    if(valid.length>=2){const [fv,fi]=valid[0],[lv]=valid[valid.length-1];
      if(isRate){const d=lv-fv,improving=(d<0&&!goodUp)||(d>0&&goodUp);
        dcls=Math.abs(d)<0.2?"flat":(improving?"good":"bad");dtxt=(d>0.2?"▲":d<-0.2?"▼":"■")+" "+fmt1(Math.abs(d))+" pp vs "+labels[fi];}
      else if(fv>0){const d=(lv-fv)/fv*100,improving=(d>0&&goodUp)||(d<0&&!goodUp);
        dcls=Math.abs(d)<0.5?"flat":(improving?"good":"bad");dtxt=(d>0.5?"▲":d<-0.5?"▼":"■")+" "+fmt1(Math.abs(d))+"% vs "+labels[fi];}}
    const meta=$("#trend-"+pfx+"-meta");if(meta)meta.innerHTML=`<span class="tdelta ${dcls}">${dtxt}</span>`;
    const sub=$("#trend-"+pfx+"-sub");if(sub)sub.style.display="none";
    const yfmt=isRate?(v=>v+"%"):fmt;
    mkc("c_trend_"+pfx,{type:"bar",data:{labels,datasets:[{label:cfg.label,data:vals,backgroundColor:cfg.color,borderRadius:6,maxBarThickness:56}]},
      options:{plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>labels[i[0].dataIndex],label:c=>isRate?(fmt1(c.parsed.y)+"% · "+fmt(s.raw[labels[c.dataIndex]].ina)+" de "+fmt(s.raw[labels[c.dataIndex]].den)+" "+(metric==="correctas"?"marcaciones":metric==="descef"?"descansos":metric==="inas"?"días programados":"jornadas")):(fmt(c.parsed.y)+" · "+s.sub)}}},scales:{x:AN,y:{...AG,ticks:{callback:yfmt}}},
        onClick:(e,el)=>{if(!el.length)return;openDrill(trendDrill(metric,labels[el[0].index],t));}}});
  }
  drawCtl();drawChart();
}

/* ---------- ROUTER + FILTRO GLOBAL ---------- */
const R={resumen,asistencia,marcaciones,jornada,descanso};let done={},CURV="resumen";
function show(v){CURV=v;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.v===v));
  document.querySelectorAll(".view").forEach(s=>s.classList.toggle("active",s.id==="v-"+v));
  if(!done[v]){R[v]();done[v]=true;}setTimeout(()=>Object.values(charts).forEach(c=>{try{c.resize()}catch(e){}}),60);
  window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>show(b.dataset.v));
function refreshAll(){for(const id in charts){try{charts[id].destroy()}catch(e){}delete charts[id];}done={};R[CURV]();done[CURV]=true;setTimeout(()=>Object.values(charts).forEach(c=>{try{c.resize()}catch(e){}}),60);}

/* ---- barra de filtro (desplegables con seleccion multiple) ---- */
function monthsPresent(){const s=[];DMETA.forEach(m=>{if(!s.includes(m.mes))s.push(m.mes);});return MES_ORDER.filter(m=>s.includes(m));}
function monthRangeIdx(mes){let a=-1,b=-1;DAYS.forEach((f,i)=>{if(DMETA[i].mes===mes){if(a<0)a=i;b=i;}});return[a,b];}
function weeksOfMonth(mes){const[a,b]=monthRangeIdx(mes);const g={},order=[];for(let i=a;i<=b;i++){const w=DMETA[i].iso;if(!(w in g)){g[w]=[];order.push(w);}g[w].push(i);}return order.map((w,k)=>({n:k+1,ids:g[w]}));}

function renderMultiSelect({ id, labelHtml, placeholder, options, selectedValues, onChange }) {
  const selArr = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []);
  const selSet = new Set(selArr.map(String));

  let summary = placeholder;
  if (selSet.size === 1) {
    const found = options.find(o => String(o.val) === [...selSet][0]);
    summary = found ? found.label : [...selSet][0];
  } else if (selSet.size > 1 && selSet.size < options.length) {
    summary = `${selSet.size} seleccionados`;
  }

  const container = document.createElement("div");
  container.className = "msel-wrap";
  container.id = `msel-wrap-${id}`;

  container.innerHTML = `
    <span class="flab">${labelHtml}</span>
    <button type="button" class="msel-btn${selSet.size > 0 && selSet.size < options.length ? ' on' : ''}" id="msel-btn-${id}">
      <span class="msel-txt">${esc(summary)}</span>
      ${selSet.size > 0 && selSet.size < options.length ? `<span class="msel-badge">${selSet.size}</span>` : ''}
      <span class="msel-arrow">▼</span>
    </button>
    <div class="msel-pop" id="msel-pop-${id}" style="display:none">
      ${options.length > 5 ? `<div class="msel-search-row"><input type="text" class="msel-search" id="msel-srch-${id}" placeholder="🔍 Buscar..." autocomplete="off"></div>` : ''}
      <div class="msel-actions">
        <button type="button" class="msel-act-btn msel-all" id="msel-all-${id}">✓ Seleccionar todos</button>
      </div>
      <div class="msel-list" id="msel-list-${id}">
        ${options.map(opt => {
          const isChecked = selSet.size === 0 || selSet.has(String(opt.val));
          return `
            <label class="msel-opt">
              <input type="checkbox" value="${esc(opt.val)}" ${isChecked ? 'checked' : ''}>
              <span class="msel-chk"></span>
              <span class="msel-lbl">${esc(opt.label)}</span>
              ${opt.count != null ? `<span class="msel-cnt">${opt.count}</span>` : ''}
            </label>
          `;
        }).join('')}
      </div>
      <button type="button" class="msel-apply-btn" id="msel-apply-${id}">Aceptar</button>
    </div>
  `;

  const btn = container.querySelector(`#msel-btn-${id}`);
  const pop = container.querySelector(`#msel-pop-${id}`);
  const list = container.querySelector(`#msel-list-${id}`);
  const srch = container.querySelector(`#msel-srch-${id}`);
  const btnAll = container.querySelector(`#msel-all-${id}`);
  const btnApply = container.querySelector(`#msel-apply-${id}`);

  btn.onclick = (e) => {
    e.stopPropagation();
    const isOpen = pop.style.display !== "none";
    document.querySelectorAll(".msel-pop").forEach(p => p.style.display = "none");
    document.querySelectorAll(".msel-btn").forEach(b => b.classList.remove("on"));
    if (!isOpen) {
      pop.style.display = "flex";
      btn.classList.add("on");
      if (srch) { srch.value = ""; filterItems(""); srch.focus(); }
    }
  };

  pop.onclick = (e) => e.stopPropagation();

  function filterItems(q) {
    const query = q.toLowerCase();
    list.querySelectorAll(".msel-opt").forEach(opt => {
      const txt = opt.querySelector(".msel-lbl").textContent.toLowerCase();
      opt.style.display = txt.includes(query) ? "flex" : "none";
    });
  }

  if (srch) {
    srch.oninput = () => filterItems(srch.value);
  }

  btnAll.onclick = () => {
    list.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = true);
  };

  function getCheckedValues() {
    const checked = [];
    list.querySelectorAll("input[type='checkbox']:checked").forEach(cb => checked.push(cb.value));
    if (checked.length === 0 || checked.length === options.length) {
      return [];
    }
    return checked;
  }

  btnApply.onclick = (e) => {
    e.stopPropagation();
    pop.style.display = "none";
    btn.classList.remove("on");
    const checked = getCheckedValues();
    onChange(checked);
  };

  return container;
}

function buildFilterBar(){
  const fb=$("#filterbar"), months=monthsPresent();
  const CARGOS=[...new Set(PRS.map(p=>p.c))].sort((a,b)=>a.localeCompare(b,"es"));
  const ALL_CDS = DATA.cds || CD_LIST;

  function statusTxt(){
    const parts = [];
    if(REG_FILTER.length){
      parts.push(REG_FILTER.length === 1 ? (REGIONAL_META[REG_FILTER[0]]?.label || REG_FILTER[0]) : `${REG_FILTER.length} regionales`);
    }
    if(CD_FILTER.length){
      parts.push(CD_FILTER.length === 1 ? (ALL_CDS.find(c=>c.id===CD_FILTER[0])?.label || CD_FILTER[0]) : `${CD_FILTER.length} CDs`);
    }
    if(MONTH_FILTER.length){
      parts.push(MONTH_FILTER.length === 1 ? MONTH_FILTER[0] : `${MONTH_FILTER.length} meses`);
    }
    if(WEEK_FILTER.length){
      parts.push(WEEK_FILTER.length === 1 ? `Semana ${WEEK_FILTER[0]}` : `${WEEK_FILTER.length} semanas`);
    }
    if(DAY_FILTER.length){
      parts.push(DAY_FILTER.length === 1 ? `${fdate(DAYS[DAY_FILTER[0]])} · ${DMETA[DAY_FILTER[0]].dow}` : `${DAY_FILTER.length} días`);
    }
    if(CG.length){
      parts.push(CG.length === 1 ? CG[0] : `${CG.length} cargos`);
    }
    if(RG){
      parts.push(fdate(DAYS[RG.a]) + " → " + fdate(DAYS[RG.b]));
    }
    return parts.length ? parts.join(" · ") : "Todo · " + DAYS.length + " días";
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".msel-pop").forEach(p => p.style.display = "none");
    document.querySelectorAll(".msel-btn").forEach(b => b.classList.remove("on"));
  });

  function draw(){
    fb.innerHTML=`
      <div class="frow" id="frow-main">
        <span style="flex:1"></span>
        <span class="fnow" id="fnow">${statusTxt()}</span>
      </div>
      <div class="frow sub">
        <span class="flab">Rango exacto</span>
        <input type="date" class="fdate" id="fDesde" min="${DAYS[0]}" max="${DAYS[DAYS.length-1]}">
        <span class="dash">→</span>
        <input type="date" class="fdate" id="fHasta" min="${DAYS[0]}" max="${DAYS[DAYS.length-1]}">
        <button class="fbtn" id="fApply">Aplicar rango</button>
        <button class="fbtn ghost" id="fClear">Ver todo</button>
      </div>`;

    const frowMain = fb.querySelector("#frow-main");
    const fnowEl = frowMain.querySelector("#fnow");

    // 1. Regional
    const regOptions = Object.values(REGIONAL_META).map(r => ({
      val: r.id,
      label: r.label,
      count: A_PARR.filter(p => getPersonRegion(p) === r.id).length
    }));
    const regWidget = renderMultiSelect({
      id: "fReg",
      labelHtml: "🌎 Regional",
      placeholder: "🌐 Cobertura Nacional",
      options: regOptions,
      selectedValues: REG_FILTER,
      onChange: (vals) => { applyReg(vals); refreshAll(); draw(); }
    });

    // 2. CD / Centro
    const availCds = ALL_CDS.filter(c => !REG_FILTER.length || REG_FILTER.includes(c.region) || REG_FILTER.includes(CD_META[c.id]?.region));
    const cdOptions = availCds.map(c => ({
      val: c.id,
      label: c.label,
      count: A_PARR.filter(p => (p.cdId === c.id || p.cd === c.id) && (!REG_FILTER.length || REG_FILTER.includes(getPersonRegion(p)))).length
    }));
    const cdWidget = renderMultiSelect({
      id: "fCd",
      labelHtml: "🏭 CD / Centro",
      placeholder: REG_FILTER.length ? `Todos los CDs` : "Todos los CDs (Nacional)",
      options: cdOptions,
      selectedValues: CD_FILTER,
      onChange: (vals) => { applyCd(vals); refreshAll(); draw(); }
    });

    // 3. Mes
    const monthOptions = monthsPresent().map(m => ({
      val: m,
      label: m
    }));
    const monthWidget = renderMultiSelect({
      id: "fMes",
      labelHtml: "📅 Mes",
      placeholder: "Todos los meses",
      options: monthOptions,
      selectedValues: MONTH_FILTER,
      onChange: (vals) => { applyMonth(vals); refreshAll(); draw(); }
    });

    // 4. Semana
    let availWeeks = weekKeys();
    if (MONTH_FILTER.length > 0) {
      const mDays = DAYS.map((_, i) => i).filter(di => MONTH_FILTER.includes(DMETA[di].mes));
      availWeeks = [...new Set(mDays.map(di => String(DMETA[di].iso)))].sort((a,b) => +a - +b);
    }
    const weekOptions = availWeeks.map(w => ({
      val: w,
      label: ISOLBL[w] ? `Semana ${w} (${ISOLBL[w]})` : `Semana ${w}`
    }));
    const weekWidget = renderMultiSelect({
      id: "fSem",
      labelHtml: "🗓️ Semana",
      placeholder: "Todas las semanas",
      options: weekOptions,
      selectedValues: WEEK_FILTER,
      onChange: (vals) => { applyWeek(vals); refreshAll(); draw(); }
    });

    // 5. Día
    let availDays = DAYS.map((_, i) => i);
    if (WEEK_FILTER.length > 0) {
      availDays = availDays.filter(di => (!MONTH_FILTER.length || MONTH_FILTER.includes(DMETA[di].mes)) && WEEK_FILTER.includes(String(DMETA[di].iso)));
    } else if (MONTH_FILTER.length > 0) {
      availDays = availDays.filter(di => MONTH_FILTER.includes(DMETA[di].mes));
    }
    const dayOptions = availDays.map(di => ({
      val: String(di),
      label: `${fdate(DAYS[di])} · ${DMETA[di].dow} (${DMETA[di].mes})`
    }));
    const dayWidget = renderMultiSelect({
      id: "fDia",
      labelHtml: "📆 Día",
      placeholder: "Todos los días",
      options: dayOptions,
      selectedValues: DAY_FILTER.map(String),
      onChange: (vals) => { applyDay(vals); refreshAll(); draw(); }
    });

    // 6. Cargo
    const cargoOptions = CARGOS.map(c => ({
      val: c,
      label: c,
      count: A_PARR.filter(p => p.c === c && (!REG_FILTER.length || REG_FILTER.includes(getPersonRegion(p))) && (!CD_FILTER.length || CD_FILTER.includes(p.cdId || p.cd))).length
    }));
    const cargoWidget = renderMultiSelect({
      id: "fCargo",
      labelHtml: "👤 Cargo",
      placeholder: "Todos los cargos",
      options: cargoOptions,
      selectedValues: CG,
      onChange: (vals) => { applyCargo(vals); refreshAll(); draw(); }
    });

    frowMain.insertBefore(regWidget, fnowEl.previousElementSibling || fnowEl);
    frowMain.insertBefore(cdWidget, fnowEl.previousElementSibling || fnowEl);
    frowMain.insertBefore(monthWidget, fnowEl.previousElementSibling || fnowEl);
    frowMain.insertBefore(weekWidget, fnowEl.previousElementSibling || fnowEl);
    frowMain.insertBefore(dayWidget, fnowEl.previousElementSibling || fnowEl);
    frowMain.insertBefore(cargoWidget, fnowEl.previousElementSibling || fnowEl);

    $("#fApply").onclick=()=>{
      const d=$("#fDesde").value,h=$("#fHasta").value;
      if(!d||!h){return;}
      const a=DIDX[d],b=DIDX[h];
      if(a==null||b==null){$("#fnow").textContent="Fechas sin datos";return;}
      MONTH_FILTER=[]; WEEK_FILTER=[]; DAY_FILTER=[];
      applyRange(a,b);
      refreshAll();
      draw();
      $("#fnow").textContent=fdate(DAYS[Math.min(a,b)])+" → "+fdate(DAYS[Math.max(a,b)]);
    };
    $("#fClear").onclick=()=>{
      MONTH_FILTER=[]; WEEK_FILTER=[]; DAY_FILTER=[]; CG=[]; REG_FILTER=[]; CD_FILTER=[];
      applyRange(null);
      refreshAll();
      draw();
    };
  }
  draw();
}
buildFilterBar();
resumen();done.resumen=true;
}