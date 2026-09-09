// generar_datos.js — pipeline Control de Asistencia CD Itagüí T2
// Uso: npm run generar
// Lee los Excel de apartado_*/ y escribe data/*.json (particionado por mes + manifiesto).
import fs from 'node:fs';
import {
  leerHoja, resolveCols, archivosDe, escribirJSON, escribirParticionado,
  normalizeText, normalizeCedula, parseFecha, parseHoras, periodoDe, validarNombre,
} from './lib.js';
import {
  grupoIncluido, resolveGrupo, resolveTipoPermiso, esRetiro,
  idxEstado, idxMetodo, catalogosExportables,
} from './entidades.js';
import { festivosDeAnios } from './festivos.js';
import {
  REGLAS, clasificar, esRegistroReal, rachaInasistencias,
  BANDAS_JORNADA, bandaJornada, BANDAS_DESCANSO, bandaDescanso,
} from './clasificar.js';

// ---------- configuración ----------
const CFG = {
  corte: process.env.CORTE || null,     // 'YYYY-MM-DD'; null = último día completo con datos
  inicio: '2026-01-01',
  carpetas: {
    ga: 'apartado_ga',
    ausencias: 'apartado_ausencias',
    punch: 'apartado_punch',
    inconsistencias: 'apartado_inconsistencias',
  },
};

// Los festivos se CALCULAN para los años que aparezcan en los datos. No hay lista manual.
// Se llena en construirYEscribir(), cuando ya se sabe qué años hay.
let FESTIVOS = new Set();

// Estado compartido entre las fuentes. La llave universal es la cédula normalizada (Number).
const M = {
  ga: new Map(),          // `${cedula}|${fecha}` -> { turno, permiso, entro, ht, atraso, rec, slots }
  personas: new Map(),    // cedula -> { cedula, nombre, cargo, grupo }
  ausencias: new Set(),   // `${cedula}|${fecha}`
  marcas: [],             // { ced, f, ts, tipo, metodo }
  incon: new Map(),       // `${cedula}|${fecha}` -> 1
  diasIncon: new Set(),   // fechas cubiertas por archivo oficial
};

// ================= FUENTE 1: Gestión de Asistencia =================
// Hoja "Información Diaria". Headers en fila 2 (índice 1), datos desde la 3.
// Fuente maestra: define la planta, los cargos, el turno, el permiso, HT y los recargos.
const SPEC_GA = {
  apellidos:  { headers: ['Apellidos'],     index: 0 },
  nombres:    { headers: ['Nombres'],       index: 1 },
  cedula:     { headers: ['Identificador'], index: 2 },
  grupo:      { headers: ['Grupo'],         index: 3 },
  fecha:      { headers: ['Fecha'],         index: 4 },
  permiso:    { headers: ['Permiso'],       index: 5 },
  turno:      { headers: ['Turno'],         index: 6 },
  entrada:    { headers: ['Entró'],         index: 7 },
  atraso:     { headers: ['Atraso'],        index: 8 },
  salidaD:    { headers: ['Salió'],         index: 9 },
  entradaD:   { headers: ['Entró'],         index: 11 },
  salida:     { headers: ['Salió'],         index: 13 },
  ht:         { headers: ['HT'],            index: 17 },
  rno:        { headers: ['RNO'],           index: 32 },
  rdd:        { headers: ['RDD'],           index: 38 },
  rnd:        { headers: ['RND'],           index: 40 },
  rdf:        { headers: ['RDF'],           index: 46 },
  rnf:        { headers: ['RNF'],           index: 48 },
  cargo:      { headers: ['Cargo'],         index: 50 },
};

function procesarGA() {
  console.log('\n[1/4] Gestión de Asistencia');
  const files = archivosDe(CFG.carpetas.ga);
  if (!files.length) { console.warn('      ! sin archivos en ' + CFG.carpetas.ga); return; }
  let leidas = 0, fueraGrupo = 0, sinCedula = 0, sinFecha = 0, fueraRango = 0;
  const gruposVistos = new Map();

  let discrepancias = 0;
  for (const file of files) {
    const periodosArchivo = new Set();
    const { hoja, headers, filas } = leerHoja(file, 'Información Diaria', 1);
    const C = resolveCols(headers, SPEC_GA, `GA/${hoja}`);
    // Ojo: 'Entró' y 'Salió' se repiten (jornada partida). El header resuelve al primero,
    // así que entradaD/salidaD se fuerzan por índice.
    C.salidaD = SPEC_GA.salidaD.index; C.entradaD = SPEC_GA.entradaD.index; C.salida = SPEC_GA.salida.index;

    for (const r of filas) {
      if (!r || r[C.cedula] === null) continue;
      leidas++;
      const grupoRaw = normalizeText(r[C.grupo]);
      gruposVistos.set(grupoRaw, (gruposVistos.get(grupoRaw) || 0) + 1);
      if (!grupoIncluido(grupoRaw)) { fueraGrupo++; continue; }
      const ced = normalizeCedula(r[C.cedula]);
      if (ced === null) { sinCedula++; continue; }
      const f = parseFecha(r[C.fecha]);
      if (!f) { sinFecha++; continue; }
      if (f < CFG.inicio) { fueraRango++; continue; }
      periodosArchivo.add(periodoDe(f));

      // clasificación por CONTENIDO; el Map hace idempotente el reemplazo del mes en curso
      M.ga.set(`${ced}|${f}`, {
        turno: normalizeText(r[C.turno]),
        permiso: normalizeText(r[C.permiso]) || 'Ninguno',
        entro: !!r[C.entrada],
        ht: parseHoras(r[C.ht]),
        atraso: parseHoras(r[C.atraso]),
        rec: { RNO: parseHoras(r[C.rno]), RDD: parseHoras(r[C.rdd]), RND: parseHoras(r[C.rnd]),
               RDF: parseHoras(r[C.rdf]), RNF: parseHoras(r[C.rnf]) },
        slots: [r[C.entrada], r[C.salidaD], r[C.entradaD], r[C.salida]].map(x => (x ? 1 : 0)),
      });
      const nombre = `${normalizeText(r[C.nombres])} ${normalizeText(r[C.apellidos])}`.trim();
      const prev = M.personas.get(ced) || {};
      const resG = resolveGrupo(grupoRaw);
      M.personas.set(ced, {
        cedula: ced,
        nombre: nombre || prev.nombre || String(ced),
        cargo: normalizeText(r[C.cargo]) || prev.cargo || 'Sin cargo',
        grupo: resG?.clave || prev.grupo,
        cdId: resG?.cdId || prev.cdId || 'ITAGUI',
      });
    }
    if (validarNombre(file, periodosArchivo)) discrepancias++;
  }
  if (discrepancias) console.warn(`      ! ${discrepancias} archivo(s) con nombre que no coincide con su contenido`);
  console.log(`      archivos ${files.length} · filas leídas ${leidas} · registros útiles ${M.ga.size} · personas ${M.personas.size}`);
  console.log(`      descartes: fuera de grupo ${fueraGrupo} · sin cédula ${sinCedula} · sin fecha ${sinFecha} · antes del inicio ${fueraRango}`);
  const desc = [...gruposVistos.entries()].map(([g, n]) => `${g || '(vacío)'}=${n}`).join(' · ');
  console.log(`      grupos encontrados: ${desc}`);
}

// ================= FUENTE 2: Ausencias =================
// Hoja "Content". Fuente ÚNICA de inasistencias.
const SPEC_AUS = {
  cedula: { headers: ['RUT', 'Identificador'], index: 2 },
  fecha:  { headers: ['Fecha'],                index: 3 },
  grupo:  { headers: ['Grupo'],                index: 4 },
};

function procesarAusencias() {
  console.log('\n[2/4] Ausencias');
  const files = archivosDe(CFG.carpetas.ausencias);
  if (!files.length) { console.warn('      ! sin archivos en ' + CFG.carpetas.ausencias); return; }
  let leidas = 0, fueraGrupo = 0, invalidas = 0;
  const porMes = new Map();
  for (const file of files) {
    const periodosArchivo = new Set();
    const { hoja, headers, filas } = leerHoja(file, 'Content', 0);
    const C = resolveCols(headers, SPEC_AUS, `Ausencias/${hoja}`);
    for (const r of filas) {
      if (!r || r[C.cedula] === null) continue;
      leidas++;
      if (!grupoIncluido(normalizeText(r[C.grupo]))) { fueraGrupo++; continue; }
      const ced = normalizeCedula(r[C.cedula]);
      const f = parseFecha(r[C.fecha]);
      if (ced === null || !f || f < CFG.inicio) { invalidas++; continue; }
      M.ausencias.add(`${ced}|${f}`);
      const p = periodoDe(f); porMes.set(p, (porMes.get(p) || 0) + 1);
      periodosArchivo.add(p);
    }
    validarNombre(file, periodosArchivo);
  }
  console.log(`      archivos ${files.length} · filas ${leidas} · ausencias únicas ${M.ausencias.size} · fuera de grupo ${fueraGrupo} · inválidas ${invalidas}`);
  console.log('      por mes: ' + [...porMes.entries()].sort().map(([p, n]) => `${p}=${n}`).join(' · '));
}

// ================= FUENTE 3: PunchReport =================
// Hoja "Con Marcas". Headers en fila 2 (índice 1); la fila 0 trae bandas de agrupación
// ("Grupo", "GeoVictoria Call"...) que NO son headers. La columna de grupo se llama
// "Grupo Usuario"; si se busca "Grupo" a secas hace match con la banda y se corre todo.
const SPEC_PUNCH = {
  cedula: { headers: ['Rut', 'RUT', 'Identificador'],      index: 2 },
  grupo:  { headers: ['Grupo Usuario'],                    index: 3 },
  fecha:  { headers: ['Fecha'],                            index: 4 },
  tipo:   { headers: ['Tipo'],                             index: 5 },
  metodo: { headers: ['Método de Marcaje', 'Metodo de Marcaje'], index: 6 },
};

function procesarPunch() {
  console.log('\n[3/4] PunchReport');
  const files = archivosDe(CFG.carpetas.punch);
  if (!files.length) { console.warn('      ! sin archivos en ' + CFG.carpetas.punch); return; }
  // Con un archivo por mes no debería haber solape, pero si alguien deja dos exports
  // del mismo mes, la clave de contenido evita el doble conteo.
  const vistas = new Set();
  let leidas = 0, omitidasSolape = 0, invalidas = 0;
  const metodos = new Map(), tipos = new Map();
  for (const file of files) {
    const periodosArchivo = new Set();
    const { hoja, headers, filas } = leerHoja(file, 'Con Marcas', 1);
    const C = resolveCols(headers, SPEC_PUNCH, `Punch/${hoja}`);
    for (const r of filas) {
      if (!r || r[C.cedula] === null) continue;
      leidas++;
      if (!grupoIncluido(normalizeText(r[C.grupo]))) { invalidas++; continue; }
      const f = parseFecha(r[C.fecha]);
      const ced = normalizeCedula(r[C.cedula]);
      if (!f || ced === null || f < CFG.inicio) { invalidas++; continue; }
      const tipo = normalizeText(r[C.tipo]);
      const metodo = normalizeText(r[C.metodo]);
      const clave = `${ced}|${normalizeText(r[C.fecha])}|${tipo}|${metodo}`;
      if (vistas.has(clave)) { omitidasSolape++; continue; }
      vistas.add(clave);
      periodosArchivo.add(periodoDe(f));
      metodos.set(metodo, (metodos.get(metodo) || 0) + 1);
      tipos.set(tipo, (tipos.get(tipo) || 0) + 1);
      M.marcas.push({ ced, f, ts: normalizeText(r[C.fecha]), tipo, metodo: idxMetodo(metodo) });
    }
    validarNombre(file, periodosArchivo);
  }
  console.log(`      archivos ${files.length} · filas ${leidas} · marcas útiles ${M.marcas.length} · duplicadas omitidas ${omitidasSolape} · inválidas ${invalidas}`);
  console.log('      métodos: ' + [...metodos.entries()].map(([m, n]) => `${m || '(vacío)'}=${n}`).join(' · '));
  console.log('      tipos: ' + [...tipos.entries()].map(([t, n]) => `${t || '(vacío)'}=${n}`).join(' · '));
}

// ================= FUENTE 4: Inconsistencias (opcional) =================
// Hoja "Content". Headers en fila 6 (índice 5); las primeras filas son metadata del reporte.
// Si falta un día, se deriva del GA con el patrón de las 4 ranuras (98,0 % precisión).
const SPEC_INC = {
  cedula: { headers: ['RUT', 'Identificador'], index: 2 },
  grupo:  { headers: ['Grupo'],                index: 3 },
  fecha:  { headers: ['Fecha'],                index: 4 },
};
const PATRONES_OK = new Set(['1,0,0,1', '1,1,1,1']);   // continua y con descanso

function procesarInconsistencias() {
  console.log('\n[4/4] Inconsistencias (Salida sin Entrada)');
  const files = archivosDe(CFG.carpetas.inconsistencias);
  let oficiales = 0;
  for (const file of files) {
    const periodosArchivo = new Set();
    const { hoja, headers, filas } = leerHoja(file, 'Content', 5);
    const C = resolveCols(headers, SPEC_INC, `Incon/${hoja}`);
    for (const r of filas) {
      if (!r || r[C.cedula] === null) continue;
      if (!grupoIncluido(normalizeText(r[C.grupo]))) continue;
      const ced = normalizeCedula(r[C.cedula]);
      const f = parseFecha(r[C.fecha]);
      if (ced === null || !f || f < CFG.inicio) continue;
      M.diasIncon.add(f);
      const e1 = r[6], s1 = r[7], e2 = r[8], s2 = r[9];
      const tieneEntrada = Boolean(e1 || e2);
      const tieneSalida = Boolean(s1 || s2);
      if (tieneSalida && !tieneEntrada) {
        M.incon.set(`${ced}|${f}`, 1);
        oficiales++;
      }
      periodosArchivo.add(periodoDe(f));
    }
    validarNombre(file, periodosArchivo);
  }
  // respaldo derivado del GA (para días sin archivo oficial o no capturados en el reporte)
  let derivadas = 0; const diasDerivados = new Set();
  for (const [k, g] of M.ga) {
    const f = k.split('|')[1];
    const tieneEntrada = Boolean(g.slots[0] || g.slots[2]);
    const tieneSalida = Boolean(g.slots[1] || g.slots[3]);
    if (tieneSalida && !tieneEntrada) {
      if (!M.incon.has(k)) {
        M.incon.set(k, 1);
        derivadas++;
        diasDerivados.add(f);
      }
    }
  }
  console.log(`      archivos ${files.length} · oficial (salida sin entrada) ${oficiales}`);
  if (derivadas) console.log(`      derivadas del GA (salida sin entrada): ${derivadas} en ${diasDerivados.size} días`);
  console.log(`      total marcaciones incorrectas ${M.incon.size}`);
}

// ================= agregación y escritura =================
function construirYEscribir() {
  console.log('\n[5/5] Clasificando y agregando');

  const anios = [...new Set([...M.ga.keys()].map(k => k.split('|')[1].slice(0, 4)))].sort();
  const listaFestivos = festivosDeAnios(anios);
  FESTIVOS = new Set(listaFestivos.map(f => f.fecha));
  console.log(`      festivos ${anios.join(', ')}: ${FESTIVOS.size} días`);
  for (const f of listaFestivos.filter(f => f.coincidencia))
    console.log(`      · ${f.fecha}: dos festivos coinciden (${f.nombre}) — cuenta como un día`);

  // corte = último día con actividad real (el GA trae los días futuros del mes vacíos)
  let corte = CFG.corte;
  if (!corte) {
    const act = new Set();
    for (const [k, g] of M.ga) if (g.ht > 0 || g.entro) act.add(k.split('|')[1]);
    for (const m of M.marcas) act.add(m.f);
    corte = [...act].sort().at(-1) || null;
  }
  const futuras = [...M.ga.keys()].filter(k => k.split('|')[1] > corte).length;
  console.log(`      corte ${corte}` + (futuras ? ` · ${futuras} filas posteriores descartadas` : ''));

  // ---- calendario: days[] y daymeta[] como los espera el frontend ----
  const MESN = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DOWN = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const DOWF = { Lun:'Lunes', Mar:'Martes', 'Mié':'Miércoles', Jue:'Jueves', Vie:'Viernes', 'Sáb':'Sábado', Dom:'Domingo' };
  const days = [], daymeta = [];
  for (let d = new Date(CFG.inicio + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= corte; d.setUTCDate(d.getUTCDate() + 1)) {
    const f = d.toISOString().slice(0, 10);
    const dow = DOWN[(d.getUTCDay() + 6) % 7];
    days.push(f);
    daymeta.push({ f, mes: MESN[d.getUTCMonth()], dow, iso: semanaISO(f) });
  }
  const DI = new Map(days.map((f, i) => [f, i]));
  const DOM = new Set(days.filter(f => new Date(f + 'T00:00:00Z').getUTCDay() === 0));

  const isolbl = {};
  const rango = new Map();
  daymeta.forEach((m, i) => { const r = rango.get(m.iso) || [i, i]; r[1] = i; rango.set(m.iso, r); });
  for (const [iso, [a, b]] of [...rango].sort((x, y) => x[0] - y[0]))
    isolbl[iso] = `Sem ${String(iso).padStart(2, '0')} · ${days[a].slice(8)}/${days[a].slice(5, 7)}–${days[b].slice(8)}/${days[b].slice(5, 7)}`;

  // ---- clasificación ----
  const estado = new Map();
  for (const [k, g] of M.ga) {
    const f = k.split('|')[1];
    if (f > corte) continue;
    estado.set(k, clasificar({ ga: g, esFestivo: FESTIVOS.has(f), esDomingo: DOM.has(f), enAusencias: M.ausencias.has(k) }));
  }
  let huerfanas = 0;
  for (const k of M.ausencias) {
    const [c, f] = k.split('|');
    if (estado.has(k) || f > corte || !M.personas.has(Number(c))) continue;
    estado.set(k, FESTIVOS.has(f) ? 'descanso' : 'inas'); huerfanas++;
  }
  if (huerfanas) console.log(`      ${huerfanas} ausencias sin fila en el GA, agregadas`);

  const porPersona = new Map();
  for (const [k, s] of estado) {
    const [c, f] = k.split('|'); const n = Number(c);
    if (!porPersona.has(n)) porPersona.set(n, new Map());
    porPersona.get(n).set(f, s);
  }

  // ---- borrado ----
  const borrados = new Map();
  for (const ced of M.personas.keys()) {
    const mias = porPersona.get(ced) || new Map();
    const reales = [...mias.keys()].filter(f => esRegistroReal(mias.get(f), M.ga.get(`${ced}|${f}`))).sort();
    const retiros = [...mias.keys()].filter(f => mias.get(f) === 'retiro').sort();
    if (!reales.length) { borrados.set(ced, 'sin registros reales'); continue; }
    const ult = reales.at(-1);
    const gap = Math.round((Date.parse(corte) - Date.parse(ult)) / 86400000);
    if (retiros.length && retiros.at(-1) > ult) borrados.set(ced, `retiro al cierre (${retiros.at(-1)})`);
    else if (gap >= REGLAS.diasInactividad) borrados.set(ced, `inactivo ${gap}d (último ${ult})`);
  }
  const vivos = [...M.personas.keys()].filter(c => !borrados.has(c));
  const motivos = new Map();
  for (const r of borrados.values()) {
    const t = r.startsWith('retiro') ? 'retiro' : r.startsWith('inactivo') ? 'inactividad' : 'sin registros';
    motivos.set(t, (motivos.get(t) || 0) + 1);
  }
  console.log(`      borrados ${borrados.size} (${[...motivos].map(([t, n]) => `${t}=${n}`).join(', ')}) · activos ${vivos.length}`);

  // ---- exclusión ----
  const excl = new Set();
  for (const ced of vivos) {
    const mias = porPersona.get(ced) || new Map();
    if (rachaInasistencias(days, f => mias.get(f), f => FESTIVOS.has(f) && M.ausencias.has(`${ced}|${f}`)) > REGLAS.maxInasContinuas) excl.add(ced);
  }
  console.log(`      excluidos por >${REGLAS.maxInasContinuas} inasistencias continuas: ${excl.size}`);

  // ---- índices ----
  const cedsOrden = vivos.map(c => M.personas.get(c)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const PI = new Map(cedsOrden.map((p, i) => [p.cedula, i]));
  const persons = cedsOrden.map(p => ({ n: p.nombre, c: p.cargo, cd: p.cdId || 'ITAGUI' }));
  const permTipoLabels = [...new Set([...M.ga.values()].map(g => g.permiso)
    .filter(t => { const r = resolveTipoPermiso(t); return r && !r.retiro && !r.noPlan; }))]
    .sort((a, b) => a.localeCompare(b, 'es'));
  const TI = new Map(permTipoLabels.map((t, i) => [t, i]));
  const metodoLabels = ['Reloj Control', 'Marca Manual', 'App', 'Otro'];
  const stateLabels = ['asist', 'inas', 'permiso', 'descanso', 'retiro', 'noplan'];
  const SI = new Map(stateLabels.map((s, i) => [s, i]));

  // ---- marcaciones por persona-día ----
  const marcasDia = new Map();      // conteo por metodo
  const marcasLista = new Map();    // marcas con hora, ordenadas y sin duplicados
  const minutoDe = (ts) => {
    const t = String(ts).match(/(\d{1,2}):(\d{2})/);
    return t ? (+t[1]) * 60 + (+t[2]) : 0;
  };
  for (const m of M.marcas) {
    if (!PI.has(m.ced) || m.f > corte) continue;
    const k = `${m.ced}|${m.f}`;
    if (!marcasDia.has(k)) { marcasDia.set(k, [0, 0, 0, 0]); marcasLista.set(k, []); }
    marcasDia.get(k)[m.metodo]++;
    marcasLista.get(k).push({ metodo: m.metodo, min: minutoDe(m.ts),
                              tipo: /salida/i.test(m.tipo) ? 1 : 0 });
  }
  // Se conservan TODAS las marcas para no alterar el conteo de marcaciones correctas.
  // Los duplicados del reloj (hasta 3 marcas identicas seguidas) se descartan al
  // pintar la ficha, no aqui.
  for (const [, arr] of marcasLista) arr.sort((a, b) => a.min - b.min);

  // ---- arrays diarios con la forma [pi, di, valor] ----
  const htDays = [], jlDays = [], dayState = [], inasDays = [], permDays = [], inconDays = [], metodoDays = [];
  const r1 = (x) => Math.round(x * 10) / 10;
  const P = new Map();   // acumulador por persona para people{}
  const REC = ['RNO','RDD','RND','RDF','RNF'];
  for (const ced of vivos) {
    const p = M.personas.get(ced);
    P.set(ced, { nombre:p.nombre, cargo:p.cargo, id:String(ced), cdId:p?.cdId || 'ITAGUI', asist:0, inas:0, permisos:0, descansos:0,
      ht:0, dias:0, jornada:0, recTotal:0, rec:Object.fromEntries(REC.map(k => [k, 0])), jornadas14:0,
      atraso:0, incon:0, marcTot:0, metodo:Object.fromEntries(metodoLabels.map(m => [m, 0])),
      marcManualPct:0, sinMarca:0, pausaSi:0, pausaNo:0, retiroDias:0,
      fechas_inas:[], meses:{}, dows:{}, permTipos:{} });
  }

  const porMesA = new Map(), porMesHT = new Map(), porDiaA = new Map(), porDowA = new Map();
  const bump = (m, k, f, n = 1) => { if (!m.has(k)) m.set(k, {}); m.get(k)[f] = (m.get(k)[f] || 0) + n; };
  const inas_events = [];

  for (const [k, s] of [...estado].sort()) {
    const [cedS, f] = k.split('|'); const ced = Number(cedS);
    if (!PI.has(ced) || f > corte) continue;
    const pi = PI.get(ced), di = DI.get(f), dm = daymeta[di], acc = P.get(ced);
    const g = M.ga.get(k) || { ht:0, atraso:0, rec:{}, permiso:'Ninguno', turno:'' };
    dayState.push([pi, di, SI.get(s)]);

    if (s === 'asist') {
      acc.asist++;
      if (g.ht > 0) {
        acc.ht += g.ht; acc.dias++;
        // [pi, di, ht*10, recargo*10, atraso en minutos]
        // Los dos ultimos son aditivos: el tablero solo lee el indice 2, asi que
        // no rompen nada, pero permiten recalcular la ficha con el filtro aplicado.
        htDays.push([pi, di, Math.round(g.ht * 10),
                     Math.round(REC.reduce((x, kk) => x + (g.rec[kk] || 0), 0) * 10),
                     Math.round(g.atraso * 60)]);
        jlDays.push([pi, di, bandaJornada(g.ht)]);
        if (g.ht >= 14) acc.jornadas14++;
        bump(porMesHT, dm.mes, 'h', g.ht);
      }
      acc.atraso += g.atraso;
      for (const kk of REC) { const v = g.rec[kk] || 0; acc.rec[kk] += v; acc.recTotal += v; }
      if (g.turno.includes('mins)')) acc.pausaSi++; else if (g.turno.includes('Sin Descanso')) acc.pausaNo++;
      if (!marcasDia.has(k)) acc.sinMarca++;
      bump(porMesA, dm.mes, 'asist'); bump(porDiaA, f, 'asist'); bump(porDowA, dm.dow, 'asist');
    } else if (s === 'inas') {
      acc.inas++; acc.fechas_inas.push(f);
      acc.meses[dm.mes] = (acc.meses[dm.mes] || 0) + 1;
      acc.dows[dm.dow] = (acc.dows[dm.dow] || 0) + 1;
      if (!excl.has(ced)) inasDays.push([pi, di]);
      bump(porMesA, dm.mes, 'inas'); bump(porDiaA, f, 'inas'); bump(porDowA, dm.dow, 'inas');
      inas_events.push({ id:String(ced), nombre:acc.nombre, cargo:acc.cargo, fecha:f, mes:dm.mes, dow:dm.dow, turno:g.turno || 'Sin plan' });
    } else if (s === 'permiso') {
      acc.permisos++;
      acc.permTipos[g.permiso] = (acc.permTipos[g.permiso] || 0) + 1;
      if (TI.has(g.permiso)) permDays.push([pi, di, TI.get(g.permiso)]);
      bump(porMesA, dm.mes, 'permisos'); bump(porDiaA, f, 'permisos'); bump(porDowA, dm.dow, 'permisos');
    } else if (s === 'descanso') {
      acc.descansos++;
      bump(porMesA, dm.mes, 'descansos'); bump(porDiaA, f, 'descansos'); bump(porDowA, dm.dow, 'descansos');
    } else if (s === 'retiro') acc.retiroDias++;

    if (M.incon.has(k)) {
      acc.incon++; inconDays.push([pi, di, 1]);
      bump(porMesA, dm.mes, 'incon'); bump(porDiaA, f, 'incon');
    }
    const mk = marcasDia.get(k);
    if (mk) mk.forEach((n, mi) => {
      acc.marcTot += n; acc.metodo[metodoLabels[mi]] += n;
      bump(porMesA, dm.mes, 'marcTot', n);
    });
    // Una fila por marca con su hora: [pi, di, metodo, minuto del dia, tipo]
    // tipo 0 = Ingreso, 1 = Salida. El tablero solo lee el indice 2.
    for (const m of (marcasLista.get(k) || [])) {
      metodoDays.push([pi, di, m.metodo, m.min, m.tipo]);
    }
  }
  for (const acc of P.values()) {
    acc.ht = r1(acc.ht); acc.jornada = acc.dias ? r1(acc.ht / acc.dias) : 0;
    acc.recTotal = r1(acc.recTotal); acc.atraso = r1(acc.atraso);
    for (const kk of REC) acc.rec[kk] = r1(acc.rec[kk]);
    acc.marcManualPct = acc.marcTot ? r1(acc.metodo['Marca Manual'] / acc.marcTot * 100) : 0;
  }

  // ---- descanso efectivo ----
  const porCed = new Map();
  for (const m of M.marcas) { if (!PI.has(m.ced)) continue; (porCed.get(m.ced) || porCed.set(m.ced, []).get(m.ced)).push(m); }
  const descDays = [];
  for (const [ced, lista] of porCed) {
    lista.sort((a, b) => (a.f + a.ts).localeCompare(b.f + b.ts));
    for (let i = 0; i < lista.length - 1; i++) {
      const a = lista[i], b = lista[i + 1];
      if (a.tipo !== 'Salida' || b.tipo !== 'Ingreso' || b.f > corte) continue;
      const h = (Date.parse(hhmmISO(b)) - Date.parse(hhmmISO(a))) / 3600000;
      if (!(h >= 0.17 && h <= 48)) continue;
      descDays.push([PI.get(ced), DI.get(b.f), bandaDescanso(h)]);
    }
  }

  // ---- agregados de tablas ----
  const por_mes = [...porMesA.keys()].sort((a, b) => MESN.indexOf(a) - MESN.indexOf(b)).map(mes => {
    const a = porMesA.get(mes), ht = (porMesHT.get(mes) || {}).h || 0;
    const dtr = htDays.filter(([, di]) => daymeta[di].mes === mes).length;
    const rec = [...P.values()].length ? 0 : 0;
    return { mes, mo: String(MESN.indexOf(mes) + 1).padStart(2, '0'),
      asist:a.asist || 0, inas:a.inas || 0, permisos:a.permisos || 0, descansos:a.descansos || 0,
      ht:Math.round(ht), dias:dtr, recargo:0, incon:a.incon || 0, marcTot:a.marcTot || 0,
      jornada: dtr ? r1(ht / dtr) : 0 };
  });
  // recargo por mes
  for (const [k, g] of M.ga) {
    const [c, f] = k.split('|');
    if (!PI.has(Number(c)) || f > corte || estado.get(k) !== 'asist') continue;
    const row = por_mes.find(r => r.mes === daymeta[DI.get(f)].mes);
    if (row) row.recargo += REC.reduce((x, kk) => x + (g.rec[kk] || 0), 0);
  }
  por_mes.forEach(r => r.recargo = Math.round(r.recargo));

  const por_dia = days.map((f, i) => {
    const a = porDiaA.get(f) || {}, dm = daymeta[i];
    return { fecha:f, mes:dm.mes, dow:dm.dow, asistencias:a.asist || 0, inasistencias:a.inas || 0,
      permisos:a.permisos || 0, descansos:a.descansos || 0, label:`${f.slice(8)}-${f.slice(5, 7)}`, incon:a.incon || 0 };
  });
  const por_dow = DOWN.map(d => {
    const a = porDowA.get(d) || {};
    return { dow:d, asistencias:a.asist || 0, inasistencias:a.inas || 0, permisos:a.permisos || 0,
      descansos:a.descansos || 0, dowFull:DOWF[d] };
  });

  const porCargo = new Map();
  for (const [ced, acc] of P) { if (!porCargo.has(acc.cargo)) porCargo.set(acc.cargo, []); porCargo.get(acc.cargo).push(acc); }
  const cargo_stats = [...porCargo].map(([cargo, ps]) => {
    const sum = (f) => ps.reduce((a, p) => a + p[f], 0);
    const ht = sum('ht'), dias = sum('dias'), marcTot = sum('marcTot'), incon = sum('incon');
    return { cargo, personas:ps.length, asist:sum('asist'), inas:sum('inas'), permisos:sum('permisos'),
      descansos:sum('descansos'), ht:Math.round(ht), dias, recargo:Math.round(sum('recTotal')),
      jornadas14:sum('jornadas14'), atraso:r1(sum('atraso')), incon, marcTot,
      marcaManual:ps.reduce((a, p) => a + p.metodo['Marca Manual'], 0),
      pausaSi:sum('pausaSi'), pausaNo:sum('pausaNo'),
      jornada: dias ? r1(ht / dias) : 0, marc_inc_pct: marcTot ? r1(incon / marcTot * 100) : 0 };
  }).sort((a, b) => b.personas - a.personas);

  const acumular = (campo) => { const m = new Map(); for (const p of P.values()) for (const [k, v] of Object.entries(p[campo])) m.set(k, (m.get(k) || 0) + v); return m; };
  const permisos_breakdown = [...acumular('permTipos')].sort((a, b) => b[1] - a[1]).map(([tipo, count]) => ({ tipo, count }));
  const metodo_breakdown = [...acumular('metodo')].filter(([, n]) => n).sort((a, b) => b[1] - a[1]).map(([metodo, count]) => ({ metodo, count }));
  const RECLBL = { RNO:'Rec. nocturno', RDD:'Dom. diurno', RND:'Dom. nocturno', RDF:'Festivo diurno', RNF:'Festivo noct.' };
  const recargos_breakdown = REC.map(t => ({ tipo:t, horas:Math.round([...P.values()].reduce((a, p) => a + p.rec[t], 0)), label:RECLBL[t] }));
  const distCount = new Map();
  for (const [ced, p] of P) if (p.inas > 0 && !excl.has(ced)) distCount.set(p.inas, (distCount.get(p.inas) || 0) + 1);
  const distribucion_inasist = [...distCount].sort((a, b) => a[0] - b[0]).map(([dias, personas]) => ({ dias, personas }));

  const porCd = new Map();
  for (const [ced, acc] of P) {
    const cdId = acc.cdId || 'ITAGUI';
    if (!porCd.has(cdId)) porCd.set(cdId, []);
    porCd.get(cdId).push(acc);
  }
  const cd_stats = [...porCd].map(([cdId, ps]) => {
    const sum = (f) => ps.reduce((a, p) => a + p[f], 0);
    const ht = sum('ht'), dias = sum('dias'), marcTot = sum('marcTot'), incon = sum('incon');
    const inasActCd = ps.filter(p => !excl.has(Number(p.id))).reduce((a, p) => a + p.inas, 0);
    const denCd = sum('asist') + inasActCd + sum('permisos');
    return { cdId, personas:ps.length, asist:sum('asist'), inas:inasActCd, permisos:sum('permisos'),
      descansos:sum('descansos'), ht:Math.round(ht), dias, incon, marcTot,
      pct_inas: denCd ? r1(inasActCd / denCd * 100) : 0,
      pct_asist: denCd ? r1(sum('asist') / denCd * 100) : 0,
      marc_corr_pct: marcTot ? r1((marcTot - incon) / marcTot * 100) : 0,
      jornada_prom: dias ? r1(ht / dias) : 0 };
  });

  // ---- kpi ----
  const tot = (f) => [...P.values()].reduce((a, p) => a + p[f], 0);
  const inasAct = [...P].filter(([c]) => !excl.has(c)).reduce((a, [, p]) => a + p.inas, 0);
  const inasExc = tot('inas') - inasAct;
  const htT = tot('ht'), diasT = tot('dias'), marcT = tot('marcTot'), incT = tot('incon');
  const den = tot('asist') + inasAct + tot('permisos');
  const mm = [...P.values()].reduce((a, p) => a + p.metodo['Marca Manual'], 0);
  const kpi = { personas:P.size, asistencias:tot('asist'), inasistencias:inasAct, permisos:tot('permisos'),
    descansos:tot('descansos'), ht:Math.round(htT), dias_trab:diasT, recargo:Math.round(tot('recTotal')),
    jornadas14:tot('jornadas14'), atraso:r1(tot('atraso')), incon:incT, marcTot:marcT, marcaManual:mm,
    sinMarca:tot('sinMarca'), pausaSi:tot('pausaSi'), pausaNo:tot('pausaNo'), retiroDias:tot('retiroDias'),
    jornada_prom: diasT ? r1(htT / diasT) : 0,
    pct_asist: den ? r1(tot('asist') / den * 100) : 0,
    pct_inas: den ? r1(inasAct / den * 100) : 0,
    marc_inc_pct: marcT ? r1(incT / marcT * 100) : 0,
    marc_corr_pct: marcT ? r1((marcT - incT) / marcT * 100) : 0,
    marca_manual_pct: marcT ? r1(mm / marcT * 100) : 0,
    pausa_pct: (tot('pausaSi') + tot('pausaNo')) ? r1(tot('pausaSi') / (tot('pausaSi') + tot('pausaNo')) * 100) : 0,
    inas_excluidos: excl.size, inas_excluidos_dias: inasExc };

  // ---- escritura: agregados en un JSON, arrays diarios particionados ----
  const periodo = por_mes.length ? `${por_mes[0].mes} – ${por_mes.at(-1).mes} ${corte.slice(0, 4)}` : '';
  escribirJSON('festivos.json', { generado:new Date().toISOString(), anios, festivos:listaFestivos });
  escribirJSON('agregados.json', {
    meta:{ periodo, dias:days.length, cd:'Regional Andes' }, kpi, persons, days, daymeta, isolbl,
    stateLabels, metodoLabels, permTipoLabels, jlBands:BANDAS_JORNADA, descBands:BANDAS_DESCANSO,
    people:Object.fromEntries([...P.values()].map(p => [p.nombre, p])),
    por_mes, por_dia, por_dow, cargo_stats, cd_stats, permisos_breakdown, metodo_breakdown, recargos_breakdown,
    distribucion_inasist, inas_events,
    excluidos:[...excl].map(c => M.personas.get(c).nombre).sort((a, b) => a.localeCompare(b, 'es')),
  });

  // Los arrays diarios se parten por mes: [pi, di, ...] con di global al calendario.
  const porMesArr = (arr) => {
    const m = new Map();
    for (const r of arr) { const p = daymeta[r[1]].f ? days[r[1]].slice(0, 7) : null; if (!m.has(p)) m.set(p, []); m.get(p).push(r); }
    return m;
  };
  const DIARIOS = { htDays, jlDays, dayState, inasDays, permDays, inconDays, metodoDays, descDays };
  const particiones = {};
  const meses = [...new Set(days.map(f => f.slice(0, 7)))].sort();
  for (const mes of meses) {
    const payload = {};
    for (const [nom, arr] of Object.entries(DIARIOS)) payload[nom] = porMesArr(arr).get(mes) || [];
    const info = escribirJSON(`diario_${mes}.json`, payload);
    (particiones.diario = particiones.diario || []).push({ periodo:mes, archivo:info.archivo, kb:info.kb,
      registros:Object.values(payload).reduce((a, b) => a + b.length, 0) });
  }

  escribirJSON('manifiesto.json', {
    generado:new Date().toISOString(), inicio:CFG.inicio, corte, dias:days.length,
    personas:P.size, excluidos:excl.size, borrados:borrados.size,
    datasets:{ diario:{ particionado:true, particiones:particiones.diario },
      agregados:{ particionado:false, archivo:'agregados.json' },
      festivos:{ particionado:false, archivo:'festivos.json' } },
  });

  console.log(`\n      ${dayState.length} días-persona · ${metodoDays.length} marcas · ${descDays.length} descansos`);
  console.log('\n      mes        aus%    inj%   jus%   marc.corr%  jornada');
  for (const m of por_mes) {
    const prog = m.asist + m.inas + m.permisos;
    const inasAc = inasDays.filter(([, di]) => daymeta[di].mes === m.mes).length;
    const progAc = m.asist + inasAc + m.permisos;
    const inj = progAc ? Math.round(inasAc / progAc * 1000) / 10 : 0;
    const jus = progAc ? Math.round(m.permisos / progAc * 1000) / 10 : 0;
    const mc = m.marcTot ? Math.round((m.marcTot - m.incon) / m.marcTot * 1000) / 10 : 0;
    console.log(`      ${m.mes.padEnd(10)} ${(inj + jus).toFixed(1).padStart(5)}% ${inj.toFixed(1).padStart(6)}% ${jus.toFixed(1).padStart(5)}%  ${mc.toFixed(1).padStart(9)}%  ${String(m.jornada).padStart(6)}h`);
  }
}

function semanaISO(f) {
  const d = new Date(f + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
}

// 'dd-mm-yyyy HH:MM:SS' -> ISO parseable
function hhmmISO(m) {
  const t = String(m.ts).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return `${m.f}T${t ? t[1].padStart(2, '0') + ':' + t[2] : '00:00'}:00Z`;
}

// ---------- main ----------
console.log('=== Control de Asistencia · CD Itagüí T2 ===');
procesarGA();
procesarAusencias();
procesarPunch();
procesarInconsistencias();
construirYEscribir();
console.log('\nListo. Ahora: git push → Cloudflare Pages redespliega.\n');
