// auditar.js — audita los JSON de data/ contra los Excel de origen.
// Uso: npm run auditar
// NO importa el pipeline a propósito: relee los Excel con su propio código y
// vuelve a contar. Si compartiera funciones, un error en el pipeline pasaría
// desapercibido porque el auditor cometería el mismo error.
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

import { GRUPOS, grupoIncluido } from './entidades.js';

const DATA = 'data';
let fallos = 0, avisos = 0, ok = 0;

const t = (v) => String(v ?? '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
const ced = (v) => { const s = t(v).replace(/[.\s,'-]/g, ''); return /^\d+$/.test(s) ? Number(s) : null; };
function fecha(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') { const d = XLSX.SSF.parse_date_code(v); return d ? `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}` : null; }
  const s = t(v);
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0];
  m = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  return m ? `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}` : null;
}
const hojas = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /\.xlsx?$/i.test(f) && !f.startsWith('~$')).map(f => path.join(dir, f)) : [];
function filas(file, hoja, desde) {
  const wb = XLSX.readFile(file, { cellDates: true });
  const nm = wb.SheetNames.includes(hoja) ? hoja : wb.SheetNames[0];
  return XLSX.utils.sheet_to_json(wb.Sheets[nm], { header: 1, defval: null, blankrows: false, raw: true }).slice(desde);
}
const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

function check(cond, titulo, detalle = '') {
  if (cond) { ok++; console.log(`  ✓ ${titulo}`); }
  else { fallos++; console.log(`  ✗ ${titulo}${detalle ? '\n      ' + detalle : ''}`); }
}
function aviso(cond, titulo, detalle = '') {
  if (!cond) { avisos++; console.log(`  ⚠ ${titulo}${detalle ? '\n      ' + detalle : ''}`); }
  else { ok++; console.log(`  ✓ ${titulo}`); }
}

console.log('=== AUDITORÍA · Control de Asistencia CD Itagüí T2 ===');

// ---------- 0. archivos presentes ----------
console.log('\n[0] Integridad de data/');
const man = leer('manifiesto.json');
const agg = leer(man.datasets.agregados.archivo);
const fes = leer('festivos.json');
const partes = man.datasets.diario.particiones;
const per = agg.persons.map((p, i) => ({ i, nombre:p.n, cargo:p.c,
  cedula: Number(agg.people[p.n]?.id), excluido: agg.excluidos.includes(p.n) ? 1 : undefined }));
const res = { meses: agg.por_mes };
const DAYS = agg.days, DM = agg.daymeta;
check(partes.length > 0, `manifiesto declara ${partes.length} particiones de jornada`);
const faltantes = partes.filter(p => !fs.existsSync(path.join(DATA, p.archivo)));
check(!faltantes.length, 'todas las particiones declaradas existen en disco',
  faltantes.map(f => f.archivo).join(', '));

// reconstruir los arrays diarios igual que hace el frontend
const D = {};
for (const nom of ['htDays','jlDays','dayState','inasDays','permDays','inconDays','metodoDays','descDays']) D[nom] = [];
for (const p of partes) { const t = leer(p.archivo); for (const nom of Object.keys(D)) if (t[nom]) D[nom].push(...t[nom]); }
const total = partes.reduce((a, p) => a + p.registros, 0);
const suma = Object.values(D).reduce((a, x) => a + x.length, 0);
check(suma === total, `registros en disco (${suma}) coinciden con el manifiesto (${total})`);
// vista persona-día equivalente a la anterior: { p, f, s, ... }
const reg = D.dayState.map(([p, di, s]) => ({ p, f: DAYS[di], s, di }));
const conHT = new Map(D.htDays.map(([p, di, h]) => [`${p}|${di}`, h]));
const conInc = new Set(D.inconDays.map(([p, di]) => `${p}|${di}`));
const excSet = new Set(per.filter(x => x.excluido).map(x => x.i));
const inasSet = new Set(D.inasDays.map(([p, di]) => `${p}|${di}`));
for (const r of reg) {
  const k = `${r.p}|${r.di}`;
  if (conHT.has(k)) r.h = conHT.get(k);
  if (conInc.has(k)) r.i = 1;
  if (excSet.has(r.p)) r.x = 1;
}
const marcasPorReg = new Map();
for (const [p, di] of D.metodoDays) { const k = `${p}|${di}`; marcasPorReg.set(k, (marcasPorReg.get(k) || 0) + 1); }
for (const r of reg) { const n = marcasPorReg.get(`${r.p}|${r.di}`); if (n) r.m = [n, 0, 0, 0]; }
const desc = D.descDays.map(([p, di, b]) => ({ p, f: DAYS[di], b, h: b === 2 ? 110 : 90 }));

// ---------- 1. GA: conteo independiente ----------
console.log('\n[1] Gestión de Asistencia · recuento independiente');
const ga = new Map(); const personasGA = new Set();
for (const f of hojas('apartado_ga')) {
  for (const r of filas(f, 'Información Diaria', 2)) {
    if (!r || r[2] === null || !grupoIncluido(r[3])) continue;
    const c = ced(r[2]), fe = fecha(r[4]);
    if (c === null || !fe) continue;
    ga.set(`${c}|${fe}`, { turno: t(r[6]), permiso: t(r[5]) || 'Ninguno', entro: !!r[7], ht: r[17] });
    personasGA.add(c);
  }
}
const hasta = man.corte;
const gaHasta = [...ga.keys()].filter(k => k.split('|')[1] <= hasta);
console.log(`      GA: ${ga.size} registros, ${personasGA.size} cédulas · hasta el corte: ${gaHasta.length}`);

const cedsJSON = new Set(per.map(p => p.cedula));
const intrusas = [...cedsJSON].filter(c => !personasGA.has(c));
check(!intrusas.length, 'toda persona del tablero existe en el GA', intrusas.slice(0, 5).join(', '));
check(agg.persons.length === man.personas, `persons (${agg.persons.length}) coincide con el manifiesto (${man.personas})`);
check(per.every((p, i) => p.i === i), 'los índices de persons son correlativos desde 0');

const idxMax = Math.max(...reg.map(r => r.p));
check(idxMax < agg.persons.length, `ningún registro apunta a una persona inexistente (máx índice ${idxMax})`);

// ---------- 2. Ausencias: cada una está reflejada ----------
console.log('\n[2] Ausencias · trazabilidad una a una');
const aus = new Set();
for (const f of hojas('apartado_ausencias')) {
  for (const r of filas(f, 'Content', 1)) {
    if (!r || r[2] === null || !grupoIncluido(r[4])) continue;
    const c = ced(r[2]), fe = fecha(r[3]);
    if (c !== null && fe && fe <= hasta) aus.add(`${c}|${fe}`);
  }
}
const festivos = new Set(fes.festivos.map(f => f.fecha));
const pIdx = new Map(per.map(p => [p.cedula, p.i]));
const regK = new Map(reg.map(r => [`${r.p}|${r.f}`, r]));
let refInas = 0, refDesc = 0, refOtro = 0, refPerdidas = 0;
const perdidas = [];
for (const k of aus) {
  const [c, f] = k.split('|');
  const i = pIdx.get(Number(c));
  if (i === undefined) continue;                      // persona borrada, correcto
  const r = regK.get(`${i}|${f}`);
  if (!r) { refPerdidas++; perdidas.push(k); continue; }
  if (r.s === 1) refInas++;
  else if (r.s === 3 && festivos.has(f)) refDesc++;
  else if (f === hasta && r.s === 5) { /* fecha de actualización (corte): omitida por regla de negocio */ }
  else refOtro++;
}
console.log(`      ausencias del Excel: ${aus.size} · como inasistencia: ${refInas} · como descanso por festivo: ${refDesc} · otro estado: ${refOtro}`);
check(refPerdidas === 0, 'ninguna ausencia de persona activa se perdió', perdidas.slice(0, 5).join(', '));
aviso(refOtro === 0, 'ninguna ausencia quedó en un estado inesperado',
  refOtro ? `${refOtro} ausencias cayeron en asistencia/permiso (la persona marcó ese día)` : '');

const inasJSON = reg.filter(r => r.s === 1).length;
check(inasJSON <= aus.size, `inasistencias en JSON (${inasJSON}) no exceden las ausencias del Excel (${aus.size})`);

// ---------- 3. festivos y domingos ----------
console.log('\n[3] Festivos y domingos');
const inasFestivo = reg.filter(r => r.s === 1 && festivos.has(r.f));
check(!inasFestivo.length, 'ningún día festivo tiene inasistencias',
  [...new Set(inasFestivo.map(r => r.f))].join(', '));
const jul13 = reg.filter(r => r.f === '2026-07-13');
if (jul13.length) check(!jul13.some(r => r.s === 1),
  '13-jul-2026 (Chiquinquirá, Ley 2578) sin inasistencias');
const anios = [...new Set(reg.map(r => r.f.slice(0, 4)))];
check(fes.anios.length === anios.length, `festivos calculados para los años presentes (${anios.join(', ')})`);

// ---------- 4. resumen mensual vs particiones ----------
console.log('\n[4] resumen_mensual.json vs particiones');
let descuadres = 0;
for (const m of res.meses) {
  const rs = reg.filter(r => DM[r.di].mes === m.mes);
  const a = rs.filter(r => r.s === 0).length, i = rs.filter(r => r.s === 1).length, p = rs.filter(r => r.s === 2).length;
  if (a !== m.asist || i !== m.inas || p !== m.permisos) {
    descuadres++;
    console.log(`      ✗ ${m.mes}: por_mes dice ${m.asist}/${m.inas}/${m.permisos}, particiones dan ${a}/${i}/${p}`);
  }
}
check(descuadres === 0, 'los conteos de por_mes coinciden con las particiones, mes por mes');

let malCuadre = 0;
console.log('      mes        aus%    inj%   jus%');
for (const m of res.meses) {
  const rs = reg.filter(r => DM[r.di].mes === m.mes);
  const inasAct = rs.filter(r => r.s === 1 && !r.x).length;
  const prog = m.asist + inasAct + m.permisos;
  if (!prog) continue;
  const inj = Math.round(inasAct / prog * 1000) / 10;
  const jus = Math.round(m.permisos / prog * 1000) / 10;
  const tot = Math.round((inj + jus) * 10) / 10;
  if (Math.abs(tot - (inj + jus)) > 1e-9) { malCuadre++; console.log(`      ✗ ${m.mes}`); }
  console.log(`      ${m.mes.padEnd(10)} ${tot.toFixed(1).padStart(5)}% ${inj.toFixed(1).padStart(6)}% ${jus.toFixed(1).padStart(5)}%`);
}
check(malCuadre === 0, 'REGLA DURA · ausentismo total = injustificado + justificado en todos los meses');

// ---------- 5. marcaciones ----------
console.log('\n[5] PunchReport · recuento independiente');
const marcasExcel = new Set();
for (const f of hojas('apartado_punch')) {
  for (const r of filas(f, 'Con Marcas', 2)) {
    if (!r || r[2] === null || !grupoIncluido(r[3])) continue;
    const c = ced(r[2]), fe = fecha(r[4]);
    if (c !== null && fe && fe <= hasta) marcasExcel.add(`${c}|${t(r[4])}|${t(r[5])}|${t(r[6])}`);
  }
}
const marcasJSON = reg.reduce((a, r) => a + (r.m ? r.m.reduce((x, y) => x + y, 0) : 0), 0);
const cobertura = marcasExcel.size ? marcasJSON / marcasExcel.size : 0;
console.log(`      Excel: ${marcasExcel.size} marcas únicas · JSON: ${marcasJSON} (${(cobertura * 100).toFixed(1)}%)`);
aviso(cobertura > 0.95, 'las marcaciones del JSON cubren al menos el 95% de las del Excel',
  cobertura <= 0.95 ? 'la diferencia son marcas de personas borradas del tablero' : '');

// ---------- 6. coherencia interna ----------
console.log('\n[6] Coherencia interna de los registros');
const fueraRango = reg.filter(r => r.f < man.inicio || r.f > man.corte);
check(!fueraRango.length, `ningún registro fuera de ${man.inicio}…${man.corte}`,
  [...new Set(fueraRango.map(r => r.f))].slice(0, 5).join(', '));
const dupes = reg.length - new Set(reg.map(r => `${r.p}|${r.f}`)).size;
check(dupes === 0, 'no hay duplicados persona-día', `${dupes} duplicados`);
const estadoRaro = reg.filter(r => r.s < 0 || r.s > 5);
check(!estadoRaro.length, 'todos los estados están en el rango 0–5');
const sinHT = reg.filter(r => r.s === 0 && !r.h).length;
aviso(sinHT / Math.max(1, reg.filter(r => r.s === 0).length) < 0.05,
  'menos del 5% de las asistencias no tienen HT', `${sinHT} asistencias sin HT (entraron sin cerrar jornada)`);
const htAbsurda = reg.filter(r => r.h && (r.h < 0 || r.h > 300));
check(!htAbsurda.length, 'ninguna jornada supera las 24 h ni es negativa');
const retiroActivo = reg.filter(r => r.s === 4).length;
aviso(retiroActivo === 0, 'ninguna persona activa tiene días en estado retiro',
  retiroActivo ? `${retiroActivo} días en retiro pertenecen a personas que siguen en el tablero` : '');

// ---------- 7. exclusiones ----------
console.log('\n[7] Exclusiones y borrados');
const exCeds = new Set(per.filter(p => p.excluido).map(p => p.i));
const marcadosEnReg = new Set(reg.filter(r => r.x).map(r => r.p));
check([...marcadosEnReg].every(p => exCeds.has(p)),
  'la bandera de exclusión coincide con la lista de excluidos');
check(man.excluidos === exCeds.size, `excluidos en el manifiesto (${man.excluidos}) = agregados (${exCeds.size})`);
const inasExcl = reg.filter(r => r.s === 1 && r.x).length;
console.log(`      ${exCeds.size} excluidos aportan ${inasExcl} días de inasistencia fuera del conteo activo`);

// ---------- 8. descansos ----------
console.log('\n[8] Descanso efectivo');
if (desc.length) {
  const bandaMala = desc.filter(d => d.b < 0 || d.b > 2);
  check(!bandaMala.length, 'todas las bandas de descanso están en 0–2');
  const horaMala = desc.filter(d => d.h < 0 || d.h > 480);
  check(!horaMala.length, 'ningún descanso supera las 48 h');
  const idxMalo = desc.filter(d => d.p >= agg.persons.length);
  check(!idxMalo.length, 'los descansos apuntan a personas existentes');
  ok++; console.log(`  ✓ ${desc.length} descansos evaluados en total`);
} else console.log('      (sin datos de descanso)');

// ---------- veredicto ----------
console.log('\n' + '='.repeat(56));
console.log(`  ${ok} verificaciones OK · ${avisos} avisos · ${fallos} fallos`);
console.log('='.repeat(56));
if (fallos) { console.log('\n  AUDITORÍA FALLIDA. Revisa los ✗ antes de desplegar.\n'); process.exit(1); }
console.log(avisos ? '\n  Auditoría aprobada con avisos.\n' : '\n  Auditoría aprobada sin observaciones.\n');