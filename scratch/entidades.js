// entidades.js — tablas escalables. Agregar una categoría = una línea aquí, nada más.
// Estas tablas se exportan a data/catalogos.json para que el frontend las lea data-driven.

// Regionales (nivel nacional)
export const REGIONALES = {
  ANDES:  { id: 'ANDES',  label: 'Regional Andes',  color: '#FCA311' },
  NORTE:  { id: 'NORTE',  label: 'Regional Norte',  color: '#2563eb' },
  CENTRO: { id: 'CENTRO', label: 'Regional Centro', color: '#16a34a' },
  SUR:    { id: 'SUR',    label: 'Regional Sur',    color: '#7c3aed' },
};

// Centros de Distribución (CDs) - Cobertura Nacional
// Regla: Si una plaza opera Operador Logístico (OL), vive como un CD independiente OL_*.
export const CDS = {
  // REGIONAL ANDES
  'ITAGUI':       { id: 'ITAGUI',       label: 'CD Itagüí',       region: 'ANDES', aliases: ['itagui', 'itagüi', 'itagui t2', 'ud itagui'], color: '#FCA311' },
  'OL_ITAGUI':    { id: 'OL_ITAGUI',    label: 'OL Itagüí',       region: 'ANDES', aliases: ['ol itagui', 'ol itagüi'], color: '#0891b2' },
  'ARMENIA':      { id: 'ARMENIA',      label: 'CD Armenia',      region: 'ANDES', aliases: ['armenia', 'cd armenia', 'ud armenia'], color: '#16a34a' },
  'OL_ARMENIA':   { id: 'OL_ARMENIA',   label: 'OL Armenia',      region: 'ANDES', aliases: ['ol armenia'], color: '#0891b2' },
  'FORJANDES':    { id: 'FORJANDES',    label: 'CD Forjandes',    region: 'ANDES', aliases: ['forjandes', 'cd forjandes', 'ud forjandes'], color: '#1e40af' },
  'OL_FORJANDES': { id: 'OL_FORJANDES', label: 'OL Forjandes',    region: 'ANDES', aliases: ['ol forjandes'], color: '#0891b2' },
  'MANIZALES':    { id: 'MANIZALES',    label: 'CD Manizales',    region: 'ANDES', aliases: ['manizales', 'cd manizales'], color: '#2563eb' },
  'OL_MANIZALES': { id: 'OL_MANIZALES', label: 'OL Manizales',    region: 'ANDES', aliases: ['ol manizales'], color: '#0891b2' },
  'UC_PEREIRA':   { id: 'UC_PEREIRA',   label: 'UC Pereira',      region: 'ANDES', aliases: ['pereira', 'uc pereira', 'udc pereira', 'cd pereira'], color: '#fbbf24' },
  'OL_PEREIRA':   { id: 'OL_PEREIRA',   label: 'OL Pereira',      region: 'ANDES', aliases: ['ol pereira'], color: '#0891b2' },
  'UC_GIRARDOTA': { id: 'UC_GIRARDOTA', label: 'UC Girardota',    region: 'ANDES', aliases: ['girardota', 'uc girardota', 'udc girardota', 'cd girardota'], color: '#7c3aed' },
  'OL_GIRARDOTA': { id: 'OL_GIRARDOTA', label: 'OL Girardota',    region: 'ANDES', aliases: ['ol girardota'], color: '#0891b2' },
  'MED_ARANJUEZ': { id: 'MED_ARANJUEZ', label: 'CD Med Aranjuez', region: 'ANDES', aliases: ['med aranjuez', 'aranjuez', 'cd med aranjuez', 'ud aranjuez'], color: '#dc2626' },
  'MED_ENVIGADO': { id: 'MED_ENVIGADO', label: 'CD Med Envigado', region: 'ANDES', aliases: ['med envigado', 'envigado', 'cd med envigado', 'udc envigado', 'ud envigado'], color: '#14213D' },

  // REGIONAL NORTE
  'SANTA_MARTA':    { id: 'SANTA_MARTA',    label: 'CD Santa Marta', region: 'NORTE', aliases: ['santa marta', 'santamarta', 'cd santa marta', 'ud santa marta'], color: '#2563eb' },
  'OL_SANTA_MARTA': { id: 'OL_SANTA_MARTA', label: 'OL Santa Marta', region: 'NORTE', aliases: ['ol santa marta', 'ol santamarta'], color: '#0891b2' },
  'ARENOSA':        { id: 'ARENOSA',        label: 'CD Arenosa',     region: 'NORTE', aliases: ['arenosa', 'cd arenosa', 'ud arenosa'], color: '#3b82f6' },
  'OL_ARENOSA':     { id: 'OL_ARENOSA',     label: 'OL Arenosa',     region: 'NORTE', aliases: ['ol arenosa'], color: '#0891b2' },
  'CUCUTA':         { id: 'CUCUTA',         label: 'CD Cúcuta',      region: 'NORTE', aliases: ['cucuta', 'cd cucuta', 'ud cucuta'], color: '#1e40af' },
  'OL_CUCUTA':      { id: 'OL_CUCUTA',      label: 'OL Cúcuta',      region: 'NORTE', aliases: ['ol cucuta'], color: '#0891b2' },

  // REGIONAL CENTRO
  'AUTOSUR':    { id: 'AUTOSUR',    label: 'CD Autosur', region: 'CENTRO', aliases: ['autosur', 'cd autosur', 'ud autosur'], color: '#16a34a' },
  'OL_AUTOSUR': { id: 'OL_AUTOSUR', label: 'OL Autosur', region: 'CENTRO', aliases: ['ol autosur'], color: '#0891b2' },
  'SIBERIA':    { id: 'SIBERIA',    label: 'CD Siberia', region: 'CENTRO', aliases: ['siberia', 'cd siberia', 'ud siberia'], color: '#15803d' },
  'OL_SIBERIA': { id: 'OL_SIBERIA', label: 'OL Siberia', region: 'CENTRO', aliases: ['ol siberia'], color: '#0891b2' },
  'SIBATE':     { id: 'SIBATE',     label: 'CD Sibaté',  region: 'CENTRO', aliases: ['sibate', 'cd sibate', 'ud sibate'], color: '#22c55e' },
  'OL_SIBATE':  { id: 'OL_SIBATE',  label: 'OL Sibaté',  region: 'CENTRO', aliases: ['ol sibate'], color: '#0891b2' },

  // REGIONAL SUR
  'UC_YUMBO':         { id: 'UC_YUMBO',         label: 'UC Yumbo',        region: 'SUR', aliases: ['yumbo', 'uc yumbo', 'cd yumbo', 'ud yumbo'], color: '#7c3aed' },
  'OL_YUMBO':         { id: 'OL_YUMBO',         label: 'OL Yumbo',        region: 'SUR', aliases: ['ol yumbo'], color: '#0891b2' },
  'CALI':             { id: 'CALI',             label: 'CD Cali',         region: 'SUR', aliases: ['cali', 'cd cali', 'ud cali', 'uc cali'], color: '#8b5cf6' },
  'OL_CALI':          { id: 'OL_CALI',          label: 'OL Cali',         region: 'SUR', aliases: ['ol cali'], color: '#0891b2' },
  'TULUA':            { id: 'TULUA',            label: 'CD Tuluá',        region: 'SUR', aliases: ['tulua', 'tuluá', 'cd tulua', 'cd tuluá', 'ud tulua'], color: '#6b21a8' },
  'OL_TULUA':         { id: 'OL_TULUA',         label: 'OL Tuluá',        region: 'SUR', aliases: ['ol tulua', 'ol tuluá'], color: '#0891b2' },
};

// Plazas/ciudades -> region + cdId.
export const CIUDADES = [
  // ANDES
  { match: ['itagui', 'itagüi'],          region: 'ANDES',  base: 'ITAGUI',       ol: 'OL_ITAGUI' },
  { match: ['armenia'],                   region: 'ANDES',  base: 'ARMENIA',      ol: 'OL_ARMENIA' },
  { match: ['forjandes'],                 region: 'ANDES',  base: 'FORJANDES',    ol: 'OL_FORJANDES' },
  { match: ['manizales'],                 region: 'ANDES',  base: 'MANIZALES',    ol: 'OL_MANIZALES' },
  { match: ['pereira'],                   region: 'ANDES',  base: 'UC_PEREIRA',   ol: 'OL_PEREIRA' },
  { match: ['girardota'],                 region: 'ANDES',  base: 'UC_GIRARDOTA', ol: 'OL_GIRARDOTA' },
  { match: ['aranjuez'],                  region: 'ANDES',  base: 'MED_ARANJUEZ', ol: 'OL_MED_ARANJUEZ' },
  { match: ['envigado'],                  region: 'ANDES',  base: 'MED_ENVIGADO', ol: 'OL_MED_ENVIGADO' },
  // NORTE
  { match: ['santa marta', 'santamarta'], region: 'NORTE',  base: 'SANTA_MARTA',  ol: 'OL_SANTA_MARTA' },
  { match: ['arenosa'],                   region: 'NORTE',  base: 'ARENOSA',      ol: 'OL_ARENOSA' },
  { match: ['cucuta'],                    region: 'NORTE',  base: 'CUCUTA',       ol: 'OL_CUCUTA' },
  // CENTRO
  { match: ['autosur'],                   region: 'CENTRO', base: 'AUTOSUR',      ol: 'OL_AUTOSUR' },
  { match: ['siberia'],                   region: 'CENTRO', base: 'SIBERIA',      ol: 'OL_SIBERIA' },
  { match: ['sibate'],                    region: 'CENTRO', base: 'SIBATE',       ol: 'OL_SIBATE' },
  // SUR
  { match: ['yumbo'],                     region: 'SUR',    base: 'UC_YUMBO',     ol: 'OL_YUMBO' },
  { match: ['cali'],                      region: 'SUR',    base: 'CALI',         ol: 'OL_CALI' },
  { match: ['tulua', 'tuluá'],            region: 'SUR',    base: 'TULUA',        ol: 'OL_TULUA' },
];

export const REGION_BY_CD = (() => {
  const m = {};
  for (const c of CIUDADES) { m[c.base] = c.region; if (c.ol) m[c.ol] = c.region; }
  for (const [cdId, cdCfg] of Object.entries(CDS)) { if (cdCfg.region) m[cdId] = cdCfg.region; }
  return m;
})();
export const resolveRegion = (cdId) => REGION_BY_CD[cdId] || null;

export const GRUPOS = {
  // ANDES
  'ITAGUI T2': { id: 'T2', label: 'Itagüí T2', aliases: ['itagui t2', 'itagüi t2'], incluir: true, cdId: 'ITAGUI', region: 'ANDES' },
  'UD Itagui': { id: 'UD', label: 'UD Itagüí',  aliases: ['ud itagui', 'ud itagüi', 'ud itagui jn', 'ud itagüi jn'], incluir: true, cdId: 'ITAGUI', region: 'ANDES' },
  'CD ARMENIA': { id: 'ARM', label: 'CD Armenia', aliases: ['cd armenia', 'armenia', 'ud armenia'], incluir: true, cdId: 'ARMENIA', region: 'ANDES' },
  'CD FORJANDES': { id: 'FORJ', label: 'CD Forjandes', aliases: ['cd forjandes', 'forjandes', 'ud forjandes'], incluir: true, cdId: 'FORJANDES', region: 'ANDES' },
  'CD GIRARDOTA': { id: 'GIR', label: 'CD Girardota', aliases: ['cd girardota', 'girardota', 'ud girardota'], incluir: true, cdId: 'UC_GIRARDOTA', region: 'ANDES' },
  'CD PEREIRA': { id: 'PER', label: 'CD Pereira', aliases: ['cd pereira', 'pereira', 'ud pereira'], incluir: true, cdId: 'UC_PEREIRA', region: 'ANDES' },
  'CD MED ARANJUEZ': { id: 'ARAN', label: 'CD Med Aranjuez', aliases: ['cd med aranjuez', 'med aranjuez', 'aranjuez', 'ud aranjuez'], incluir: true, cdId: 'MED_ARANJUEZ', region: 'ANDES' },
  'CD MED ENVIGADO': { id: 'ENV', label: 'CD Med Envigado', aliases: ['cd med envigado', 'med envigado', 'envigado', 'udc envigado', 'ud envigado'], incluir: true, cdId: 'MED_ENVIGADO', region: 'ANDES' },
  'UDC Envigado': { id: 'ENV2', label: 'UDC Envigado', aliases: ['udc envigado'], incluir: true, cdId: 'MED_ENVIGADO', region: 'ANDES' },

  // NORTE
  'CD SANTA MARTA': { id: 'STM', label: 'CD Santa Marta', aliases: ['santa marta', 'santamarta', 'cd santa marta', 'ud santa marta'], incluir: true, cdId: 'SANTA_MARTA', region: 'NORTE' },
  'OL SANTA MARTA': { id: 'OL_STM', label: 'OL Santa Marta', aliases: ['ol santa marta', 'ol santamarta'], incluir: true, cdId: 'OL_SANTA_MARTA', region: 'NORTE' },
  'CD ARENOSA': { id: 'ARN', label: 'CD Arenosa', aliases: ['arenosa', 'cd arenosa', 'ud arenosa'], incluir: true, cdId: 'ARENOSA', region: 'NORTE' },
  'OL ARENOSA': { id: 'OL_ARN', label: 'OL Arenosa', aliases: ['ol arenosa'], incluir: true, cdId: 'OL_ARENOSA', region: 'NORTE' },
  'CD CUCUTA': { id: 'CUC', label: 'CD Cúcuta', aliases: ['cucuta', 'cd cucuta', 'ud cucuta'], incluir: true, cdId: 'CUCUTA', region: 'NORTE' },
  'OL CUCUTA': { id: 'OL_CUC', label: 'OL Cúcuta', aliases: ['ol cucuta'], incluir: true, cdId: 'OL_CUCUTA', region: 'NORTE' },

  // CENTRO
  'CD AUTOSUR': { id: 'ATS', label: 'CD Autosur', aliases: ['autosur', 'cd autosur', 'ud autosur'], incluir: true, cdId: 'AUTOSUR', region: 'CENTRO' },
  'OL AUTOSUR': { id: 'OL_ATS', label: 'OL Autosur', aliases: ['ol autosur'], incluir: true, cdId: 'OL_AUTOSUR', region: 'CENTRO' },
  'CD SIBERIA': { id: 'SIB', label: 'CD Siberia', aliases: ['siberia', 'cd siberia', 'ud siberia'], incluir: true, cdId: 'SIBERIA', region: 'CENTRO' },
  'OL SIBERIA': { id: 'OL_SIB', label: 'OL Siberia', aliases: ['ol siberia'], incluir: true, cdId: 'OL_SIBERIA', region: 'CENTRO' },
  'CD SIBATE': { id: 'SBT', label: 'CD Sibaté', aliases: ['sibate', 'cd sibate', 'ud sibate'], incluir: true, cdId: 'SIBATE', region: 'CENTRO' },
  'OL SIBATE': { id: 'OL_SBT', label: 'OL Sibaté', aliases: ['ol sibate'], incluir: true, cdId: 'OL_SIBATE', region: 'CENTRO' },

  // SUR
  'UC YUMBO': { id: 'YMB', label: 'UC Yumbo', aliases: ['yumbo', 'uc yumbo', 'cd yumbo', 'ud yumbo'], incluir: true, cdId: 'UC_YUMBO', region: 'SUR' },
  'OL YUMBO': { id: 'OL_YMB', label: 'OL Yumbo', aliases: ['ol yumbo'], incluir: true, cdId: 'OL_YUMBO', region: 'SUR' },
  'CD CALI': { id: 'CLI', label: 'CD Cali', aliases: ['cali', 'cd cali', 'ud cali', 'uc cali'], incluir: true, cdId: 'CALI', region: 'SUR' },
  'OL CALI': { id: 'OL_CLI', label: 'OL Cali', aliases: ['ol cali'], incluir: true, cdId: 'OL_CALI', region: 'SUR' },
  'CD TULUA': { id: 'TLU', label: 'CD Tuluá', aliases: ['tulua', 'tuluá', 'cd tulua', 'cd tuluá', 'ud tulua'], incluir: true, cdId: 'TULUA', region: 'SUR' },
  'OL TULUA': { id: 'OL_TLU', label: 'OL Tuluá', aliases: ['ol tulua', 'ol tuluá'], incluir: true, cdId: 'OL_TULUA', region: 'SUR' },
};

// Estados del día. El orden define el índice que se guarda en las particiones.
export const ESTADOS = {
  asist:    { i: 0, label: 'Asistencia',     color: '#16a34a', enDenominador: true,  esAusencia: false },
  inas:     { i: 1, label: 'Inasistencia',   color: '#dc2626', enDenominador: true,  esAusencia: true  },
  permiso:  { i: 2, label: 'Permiso',        color: '#fbbf24', enDenominador: true,  esAusencia: true  },
  descanso: { i: 3, label: 'Descanso',       color: '#64748b', enDenominador: false, esAusencia: false },
  retiro:   { i: 4, label: 'Retiro',         color: '#94a3b8', enDenominador: false, esAusencia: false },
  noplan:   { i: 5, label: 'No planificado', color: '#cbd5e1', enDenominador: false, esAusencia: false },
};

// Métodos de marcación del PunchReport.
export const METODOS = {
  'Reloj Control': { i: 0, label: 'Reloj Control', color: '#14213D' },
  'Marca Manual':  { i: 1, label: 'Marca Manual',  color: '#7c3aed' },
  'App':           { i: 2, label: 'App',           color: '#fbbf24' },
  'Otro':          { i: 3, label: 'Otro',          color: '#cbd5e1' },
};

// Tipos de permiso.
export const TIPOS_PERMISO = {
  'Incapacidad':                  { color: '#FCA311', retiro: false },
  'Vacaciones':                   { color: '#facc15', retiro: false },
  'Licencia No Remunerada':       { color: '#0891b2', retiro: false },
  'Luto':                         { color: '#64748b', retiro: false },
  'Retiro voluntario':            { color: '#dc2626', retiro: true  },
  'Retiro involuntario':          { color: '#dc2626', retiro: true  },
  'Retiro Sizing':                { color: '#dc2626', retiro: true  },
  'INGRESO NO ACTIVO A LA FECHA': { color: '#cbd5e1', retiro: false, noPlan: true },
};

export const RAMPA_CARGOS = ['#FCA311','#1e40af','#16a34a','#7c3aed','#0891b2','#2563eb','#dc2626','#14213D'];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function resolveGrupo(raw) {
  const n = norm(raw);
  const esOL = /(^|\s)ol(\s|$)/.test(n) || /(^|\s)operador\s*log/i.test(n);
  for (const c of CIUDADES) {
    if (c.match.some(t => n.includes(t))) {
      const cdId = (esOL && c.ol) ? c.ol : c.base;
      return { clave: raw, id: cdId, label: raw, incluir: true, cdId, region: c.region };
    }
  }
  for (const [clave, cfg] of Object.entries(GRUPOS)) {
    if (norm(clave) === n || (cfg.aliases || []).some(a => norm(a) === n)) return { clave, ...cfg, region: cfg.region || resolveRegion(cfg.cdId) };
  }
  for (const [cdKey, cdCfg] of Object.entries(CDS)) {
    if (cdCfg.aliases.some(a => n.includes(norm(a)))) {
      return { clave: raw, id: cdKey, label: raw, incluir: true, cdId: cdKey, region: cdCfg.region };
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
    regionales: Object.values(REGIONALES),
    cds: Object.values(CDS),
    grupos: Object.entries(GRUPOS).filter(([, c]) => c.incluir).map(([clave, c]) => ({ clave, ...c })),
    estados: Object.entries(ESTADOS).map(([clave, c]) => ({ clave, ...c })),
    metodos: Object.entries(METODOS).map(([clave, c]) => ({ clave, ...c })),
    cargos: cargosDescubiertos.map((c, i) => ({ cargo: c, color: colorCargo(c, i) })),
    tiposPermiso: permisosDescubiertos.map(t => ({ tipo: t, ...(TIPOS_PERMISO[t] || { color: '#94908a' }) })),
  };
}