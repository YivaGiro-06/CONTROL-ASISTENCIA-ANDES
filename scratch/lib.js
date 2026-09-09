// lib.js — normalizadores, resolveCols y escritura particionada.
// Compartido por todas las funciones procesar<Fuente>().
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

export const DATA_DIR = 'data';
export const NULOS = new Set(['', '#N/A', '#N/D', '#REF!', '#VALUE!', '#¡REF!', 'NULL', 'NaN', '-']);

// ---------- normalizadores ----------
export function normalizeText(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normHeader(v) {
  return normalizeText(v)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // acentos
    .replace(/[\n\r]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Llave universal. Devuelve Number o null.
export function normalizeCedula(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const s = normalizeText(v).replace(/[.\s,'-]/g, '');
  if (!s || NULOS.has(s.toUpperCase())) return null;
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

const MESES_TXT = { ene:1, feb:2, mar:3, abr:4, may:5, jun:6, jul:7, ago:8, sep:9, oct:10, nov:11, dic:12 };

// Devuelve 'YYYY-MM-DD' o null. Maneja Date, serial de Excel,
// 'Jue 01-01-2026' (formato del GA), dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd y '01-ene-2026'.
export function parseFecha(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !isNaN(v)) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === 'number') {
    if (v < 1 || v > 80000) return null;
    const d = XLSX.SSF.parse_date_code(v);
    return d ? iso(d.y, d.m, d.d) : null;
  }
  const s = normalizeText(v);
  if (!s || NULOS.has(s.toUpperCase())) return null;

  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);              // yyyy-mm-dd
  if (m) return iso(+m[1], +m[2], +m[3]);

  m = s.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);            // dd-mm-yyyy (con o sin 'Jue ' delante)
  if (m) return iso(+m[3], +m[2], +m[1]);

  m = s.match(/(\d{1,2})[-/ ]([a-zA-Z]{3})[a-zA-Z]*[-/ ](\d{4})/);  // 01-ene-2026
  if (m) {
    const mes = MESES_TXT[m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
    if (mes) return iso(+m[3], mes, +m[1]);
  }
  return null;
}

function iso(y, m, d) {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 'HH:MM' o 'HH:MM:SS' -> horas decimales. Soporta negativos.
export function parseHoras(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v > 0 && v < 2 ? v * 24 : v;   // fracción de día de Excel
  const s = normalizeText(v);
  const m = s.match(/^(-?)(\d+):(\d{2})/);
  if (m) {
    const h = +m[2] + (+m[3]) / 60;
    return m[1] === '-' ? -h : h;
  }
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export const periodoDe = (fechaIso) => fechaIso ? fechaIso.slice(0, 7) : null;

// ---------- lectura de Excel ----------
// Lee la hoja como matriz cruda. headerRow es 0-indexed.
export function leerHoja(file, sheetName, headerRow = 0) {
  const wb = XLSX.readFile(file, { cellDates: true, cellNF: false, cellText: false });
  const nombre = sheetName && wb.SheetNames.includes(sheetName) ? sheetName : wb.SheetNames[0];
  if (sheetName && nombre !== sheetName) {
    console.warn(`      ! hoja "${sheetName}" no existe en ${path.basename(file)}, uso "${nombre}"`);
  }
  const filas = XLSX.utils.sheet_to_json(wb.Sheets[nombre], { header: 1, defval: null, blankrows: false, raw: true });
  return { hoja: nombre, headers: filas[headerRow] || [], filas: filas.slice(headerRow + 1) };
}

// Doble blindaje: match por nombre de header (tolerante) con fallback a índice fijo.
// spec = { campo: { headers: ['alias 1','alias 2'], index: 4 } }
export function resolveCols(headers, spec, etiqueta = '') {
  const norm = headers.map(normHeader);
  const out = {};
  for (const [campo, cfg] of Object.entries(spec)) {
    const alias = (cfg.headers || []).map(normHeader);
    let porHeader = -1;
    for (const a of alias) {
      const i = norm.indexOf(a);
      if (i !== -1) { porHeader = i; break; }
    }
    if (porHeader === -1) {
      for (const a of alias) {
        const i = norm.findIndex(h => h && a && (h.includes(a) || a.includes(h)));
        if (i !== -1) { porHeader = i; break; }
      }
    }
    const porIndice = cfg.index;
    if (porHeader === -1) {
      out[campo] = porIndice;
      console.warn(`      ! ${etiqueta}: header de "${campo}" no encontrado, uso índice fijo ${porIndice}`);
    } else {
      if (porIndice !== undefined && porHeader !== porIndice) {
        console.warn(`      ! ${etiqueta}: "${campo}" esperado en col ${porIndice} pero el header está en ${porHeader} — gana el header`);
      }
      out[campo] = porHeader;
    }
  }
  return out;
}

// El período del NOMBRE es solo una pista para validar. La verdad es la fecha de cada fila.
// Acepta GA_2026-08.xlsx, AUS_2026_08.xlsx, PUNCH-202608.xlsx, etc.
export function periodoDeNombre(file) {
  const base = path.basename(file);
  let m = base.match(/(20\d{2})[-_ ]?(0[1-9]|1[0-2])(?!\d)/);
  return m ? `${m[1]}-${m[2]}` : null;
}

// Compara el período declarado en el nombre contra los períodos realmente encontrados
// en el contenido. No descarta nada: solo avisa. Devuelve true si hay discrepancia.
export function validarNombre(file, periodosEnContenido) {
  const decl = periodoDeNombre(file);
  const hallados = [...periodosEnContenido].sort();
  const nom = path.basename(file);
  if (!decl) {
    console.log(`      · ${nom}: sin período en el nombre, me guío por el contenido (${hallados.join(', ') || 'vacío'})`);
    return false;
  }
  if (!hallados.length) {
    console.warn(`      ! ${nom}: declara ${decl} pero no tiene filas válidas`);
    return true;
  }
  const otros = hallados.filter(p => p !== decl);
  if (!otros.length) return false;
  if (hallados.includes(decl)) {
    console.warn(`      ! ${nom}: declara ${decl} pero además trae ${otros.join(', ')} — clasifico por contenido`);
  } else {
    console.warn(`      !! ${nom}: declara ${decl} y NO trae ese mes; su contenido es ${hallados.join(', ')} — REVISAR NOMBRE`);
  }
  return true;
}

export function archivosDe(carpeta) {
  if (!fs.existsSync(carpeta)) return [];
  return fs.readdirSync(carpeta)
    .filter(f => /\.xlsx?$/i.test(f) && !f.startsWith('~$'))
    .sort()
    .map(f => path.join(carpeta, f));
}

// ---------- escritura ----------
export function escribirJSON(nombre, obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = path.join(DATA_DIR, nombre);
  fs.writeFileSync(p, JSON.stringify(obj));          // minificado, sin espacios
  const kb = (fs.statSync(p).size / 1024).toFixed(1);
  console.log(`      → ${nombre} (${kb} KB)`);
  return { archivo: nombre, kb: Number(kb) };
}

// Parte un dataset por periodo YYYY-MM y devuelve la lista de particiones para el manifiesto.
// registros: array de objetos. campoFecha: nombre de la propiedad con la fecha ISO.
export function escribirParticionado(base, registros, campoFecha = 'f') {
  const porPeriodo = new Map();
  let sinFecha = 0;
  for (const r of registros) {
    const p = periodoDe(r[campoFecha]);
    if (!p) { sinFecha++; continue; }
    if (!porPeriodo.has(p)) porPeriodo.set(p, []);
    porPeriodo.get(p).push(r);
  }
  if (sinFecha) console.warn(`      ! ${base}: ${sinFecha} registros sin fecha válida, descartados`);
  const particiones = [];
  for (const p of [...porPeriodo.keys()].sort()) {
    const filas = porPeriodo.get(p);
    const info = escribirJSON(`${base}_${p}.json`, filas);
    particiones.push({ periodo: p, archivo: info.archivo, registros: filas.length, kb: info.kb });
  }
  return particiones;
}