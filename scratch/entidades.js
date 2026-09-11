// entidades.js — tablas escalables. Agregar una categoría = una línea aquí, nada más.
// Estas tablas se exportan a data/catalogos.json para que el frontend las lea data-driven.

// Centros de Distribución (CDs) de la Regional Andes
export const CDS = {
  'ITAGUI':       { id: 'ITAGUI',       label: 'CD Itagüí',       aliases: ['itagui', 'itagüi', 'itagui t2', 'ud itagui'], color: '#F57C00' },
  'ARMENIA':      { id: 'ARMENIA',      label: 'CD Armenia',      aliases: ['armenia', 'cd armenia', 'ud armenia'], color: '#2E7D32' },
  'FORJANDES':    { id: 'FORJANDES',    label: 'CD Forjandes',    aliases: ['forjandes', 'cd forjandes', 'ud forjandes'], color: '#0288D1' },
  'GIRARDOTA':    { id: 'GIRARDOTA',    label: 'CD Girardota',    aliases: ['girardota', 'cd girardota', 'ud girardota'], color: '#7B1FA2' },
  'PEREIRA':      { id: 'PEREIRA',      label: 'CD Pereira',      aliases: ['pereira', 'cd pereira', 'ud pereira'], color: '#E64A19' },
  'MED_ARANJUEZ': { id: 'MED_ARANJUEZ', label: 'CD Med Aranjuez', aliases: ['med aranjuez', 'aranjuez', 'cd med aranjuez', 'ud aranjuez'], color: '#C2185B' },
  'MED_ENVIGADO': { id: 'MED_ENVIGADO', label: 'CD Med Envigado', aliases: ['med envigado', 'envigado', 'cd med envigado', 'udc envigado', 'ud envigado'], color: '#00796B' },
};

// Grupos GeoVictoria que entran al tablero. Mapeados a su correspondiente CD.
export const GRUPOS = {
  // CD ITAGÜÍ
  'ITAGUI T2': { id: 'T2', label: 'Itagüí T2', aliases: ['itagui t2', 'itagüi t2'], incluir: true, cdId: 'ITAGUI' },
  'UD Itagui': { id: 'UD', label: 'UD Itagüí',  aliases: ['ud itagui', 'ud itagüi', 'ud itagui jn', 'ud itagüi jn'], incluir: true, cdId: 'ITAGUI' },
  
  // CD ARMENIA
  'CD ARMENIA': { id: 'ARM', label: 'CD Armenia', aliases: ['cd armenia', 'armenia', 'ud armenia'], incluir: true, cdId: 'ARMENIA' },
  
  // CD FORJANDES
  'CD FORJANDES': { id: 'FORJ', label: 'CD Forjandes', aliases: ['cd forjandes', 'forjandes', 'ud forjandes'], incluir: true, cdId: 'FORJANDES' },
  
  // CD GIRARDOTA
  'CD GIRARDOTA': { id: 'GIR', label: 'CD Girardota', aliases: ['cd girardota', 'girardota', 'ud girardota'], incluir: true, cdId: 'GIRARDOTA' },
  
  // CD PEREIRA
  'CD PEREIRA': { id: 'PER', label: 'CD Pereira', aliases: ['cd pereira', 'pereira', 'ud pereira'], incluir: true, cdId: 'PEREIRA' },
  
  // CD MED ARANJUEZ
  'CD MED ARANJUEZ': { id: 'ARAN', label: 'CD Med Aranjuez', aliases: ['cd med aranjuez', 'med aranjuez', 'aranjuez', 'ud aranjuez'], incluir: true, cdId: 'MED_ARANJUEZ' },
  
  // CD MED ENVIGADO
  'CD MED ENVIGADO': { id: 'ENV', label: 'CD Med Envigado', aliases: ['cd med envigado', 'med envigado', 'envigado', 'udc envigado', 'ud envigado'], incluir: true, cdId: 'MED_ENVIGADO' },
  'UDC Envigado': { id: 'ENV2', label: 'UDC Envigado', aliases: ['udc envigado'], incluir: true, cdId: 'MED_ENVIGADO' },
};

// Estados del día. El orden define el índice que se guarda en las particiones.
export const ESTADOS = {
  asist:    { i: 0, label: 'Asistencia',     color: '#2E7D32', enDenominador: true,  esAusencia: false },
  inas:     { i: 1, label: 'Inasistencia',   color: '#D32F2F', enDenominador: true,  esAusencia: true  },
  permiso:  { i: 2, label: 'Permiso',        color: '#FFC107', enDenominador: true,  esAusencia: true  },
  descanso: { i: 3, label: 'Descanso',       color: '#94908a', enDenominador: false, esAusencia: false },
  retiro:   { i: 4, label: 'Retiro',         color: '#6f6f6a', enDenominador: false, esAusencia: false },
  noplan:   { i: 5, label: 'No planificado', color: '#e7e6e2', enDenominador: false, esAusencia: false },
};

// Métodos de marcación del PunchReport.
export const METODOS = {
  'Reloj Control': { i: 0, label: 'Reloj Control', color: '#F57C00' },
  'Marca Manual':  { i: 1, label: 'Marca Manual',  color: '#9c6b3f' },
  'App':           { i: 2, label: 'App',           color: '#94908a' },
  'Otro':          { i: 3, label: 'Otro',          color: '#e7e6e2' },
};

// Tipos de permiso. Se descubren desde el GA; aquí solo el color y si es de retiro.
// Lo que no esté listado cae en 'Otro' vía resolveTipoPermiso().
export const TIPOS_PERMISO = {
  'Incapacidad':                  { color: '#F57C00', retiro: false },
  'Vacaciones':                   { color: '#FFC107', retiro: false },
  'Licencia No Remunerada':       { color: '#9c6b3f', retiro: false },
  'Luto':                         { color: '#6f6f6a', retiro: false },
  'Retiro voluntario':            { color: '#D32F2F', retiro: true  },
  'Retiro involuntario':          { color: '#D32F2F', retiro: true  },
  'Retiro Sizing':                { color: '#D32F2F', retiro: true  },
  'INGRESO NO ACTIVO A LA FECHA': { color: '#e7e6e2', retiro: false, noPlan: true },
};

// Cargos: NO se cablean. Se descubren desde el GA y se pintan con esta rampa por orden
// de frecuencia. Agregar un cargo nuevo no requiere tocar código.
export const RAMPA_CARGOS = ['#F57C00','#9c6b3f','#94908a','#FFC107','#6f6f6a','#E39A1C','#D32F2F','#111111'];

// ---------- helpers ----------
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function resolveGrupo(raw) {
  const n = norm(raw);
  for (const [clave, cfg] of Object.entries(GRUPOS)) {
    if (norm(clave) === n || (cfg.aliases || []).some(a => norm(a) === n)) return { clave, ...cfg };
  }
  // Coincidencia dinámica por alias de CD si el grupo trae el nombre del centro
  for (const [cdKey, cdCfg] of Object.entries(CDS)) {
    if (cdCfg.aliases.some(a => n.includes(norm(a)))) {
      return { clave: raw, id: cdKey, label: raw, incluir: true, cdId: cdKey };
    }
  }
  return null;
}

export const grupoIncluido = (raw) => !!resolveGrupo(raw)?.incluir;

export function resolveTipoPermiso(raw) {
  const s = String(raw || '').trim();
  if (!s || norm(s) === 'ninguno') return null;
  if (TIPOS_PERMISO[s]) return { tipo: s, ...TIPOS_PERMISO[s] };
  const hit = Object.keys(TIPOS_PERMISO).find(k => norm(k) === norm(s));
  if (hit) return { tipo: hit, ...TIPOS_PERMISO[hit] };
  return { tipo: s, color: '#94908a', retiro: false, nuevo: true };
}

export const esRetiro = (raw) => !!resolveTipoPermiso(raw)?.retiro;
export const idxEstado = (clave) => ESTADOS[clave]?.i ?? 5;
export const idxMetodo = (raw) => METODOS[String(raw || '').trim()]?.i ?? METODOS['Otro'].i;
export const colorCargo = (cargo, orden) => RAMPA_CARGOS[orden % RAMPA_CARGOS.length];

export function catalogosExportables(cargosDescubiertos = [], permisosDescubiertos = []) {
  return {
    cds: Object.values(CDS),
    grupos: Object.entries(GRUPOS).filter(([, c]) => c.incluir).map(([clave, c]) => ({ clave, ...c })),
    estados: Object.entries(ESTADOS).map(([clave, c]) => ({ clave, ...c })),
    metodos: Object.entries(METODOS).map(([clave, c]) => ({ clave, ...c })),
    cargos: cargosDescubiertos.map((c, i) => ({ cargo: c, color: colorCargo(c, i) })),
    tiposPermiso: permisosDescubiertos.map(t => ({ tipo: t, ...(TIPOS_PERMISO[t] || { color: '#94908a' }) })),
  };
}