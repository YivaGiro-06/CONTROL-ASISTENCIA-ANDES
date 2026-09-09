// festivos.js — festivos de Colombia calculados para CUALQUIER año. Cero mantenimiento manual.
// Tres familias:
//   1. Fijos: no se mueven nunca.
//   2. Ley Emiliani (Ley 51 de 1983): si no caen lunes, se corren al lunes siguiente.
//   3. Móviles por Pascua: desplazamiento en días desde el Domingo de Resurrección.
//      Jueves y Viernes Santo NO se mueven; los otros tres ya vienen corridos al lunes.

// Nota: si en el futuro se crea otro festivo por ley, se agrega UNA línea a FIJOS o a
// EMILIANI con su año de vigencia. No hay que tocar nada más.
const FIJOS = [
  [1, 1, 'Año Nuevo'],
  [5, 1, 'Día del Trabajo'],
  [7, 20, 'Grito de Independencia'],
  [8, 7, 'Batalla de Boyacá'],
  [12, 8, 'Inmaculada Concepción'],
  [12, 25, 'Navidad'],
];

// El 4º elemento opcional es el año DESDE el cual rige (para festivos creados por ley nueva).
const EMILIANI = [
  [1, 6, 'Reyes Magos'],
  [3, 19, 'San José'],
  [6, 29, 'San Pedro y San Pablo'],
  // Ley 2578 del 1-jun-2026: Ntra. Sra. del Rosario de Chiquinquirá, patrona de Colombia.
  // Permanente, cada 9 de julio, con Ley Emiliani. En 2026 se disfrutó el lunes 13-jul.
  [7, 9, 'Ntra. Sra. del Rosario de Chiquinquirá', 2026],
  [8, 15, 'Asunción de la Virgen'],
  [10, 12, 'Día de la Raza'],
  [11, 1, 'Todos los Santos'],
  [11, 11, 'Independencia de Cartagena'],
];

// offset en días desde el Domingo de Pascua
const PASCUA = [
  [-3, 'Jueves Santo'],
  [-2, 'Viernes Santo'],
  [43, 'Ascensión del Señor'],      // 39 días (jueves) → lunes
  [64, 'Corpus Christi'],           // 60 días (jueves) → lunes
  [71, 'Sagrado Corazón'],          // 68 días (viernes) → lunes
];

// Domingo de Resurrección — algoritmo gregoriano anónimo (Meeus/Jones/Butcher)
export function domingoDePascua(anio) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

const iso = (d) => d.toISOString().slice(0, 10);
const sumarDias = (d, n) => new Date(d.getTime() + n * 86400000);

// Corre la fecha al lunes siguiente si no cae lunes (getUTCDay: 0=dom, 1=lun)
function alLunes(d) {
  const dow = d.getUTCDay();
  return dow === 1 ? d : sumarDias(d, (8 - dow) % 7);
}

// Devuelve [{ fecha:'YYYY-MM-DD', nombre, tipo }] ordenado, para un año.
export function festivosDeAnio(anio, agrupar = false) {
  const out = [];
  for (const [m, dia, nombre] of FIJOS) {
    out.push({ fecha: iso(new Date(Date.UTC(anio, m - 1, dia))), nombre, tipo: 'fijo' });
  }
  for (const [m, dia, nombre, desde] of EMILIANI) {
    if (desde && anio < desde) continue;      // aún no existía la ley
    out.push({ fecha: iso(alLunes(new Date(Date.UTC(anio, m - 1, dia)))), nombre, tipo: 'emiliani' });
  }
  const pascua = domingoDePascua(anio);
  for (const [off, nombre] of PASCUA) {
    out.push({ fecha: iso(sumarDias(pascua, off)), nombre, tipo: 'pascua' });
  }
  const orden = out.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return agrupar ? agruparPorFecha(orden) : orden;
}

// Dos festivos pueden caer el MISMO día: en 2025 San Pedro (corrido al lunes 30-jun)
// coincidió con Sagrado Corazón (Pascua+71 = 30-jun). Ese año Colombia tuvo 17 días
// festivos distintos, no 18. Se agrupan por fecha uniendo los nombres.
function agruparPorFecha(lista) {
  const m = new Map();
  for (const f of lista) {
    if (!m.has(f.fecha)) m.set(f.fecha, { fecha: f.fecha, nombre: f.nombre, tipo: f.tipo });
    else {
      const prev = m.get(f.fecha);
      prev.nombre += ` / ${f.nombre}`;
      prev.coincidencia = true;
    }
  }
  return [...m.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Para varios años a la vez (los que aparezcan en los datos).
export function festivosDeAnios(anios) {
  const todos = [...new Set(anios)].sort().flatMap(a => festivosDeAnio(Number(a)));
  return agruparPorFecha(todos);
}

export function setDeFestivos(anios) {
  return new Set(festivosDeAnios(anios).map(f => f.fecha));
}