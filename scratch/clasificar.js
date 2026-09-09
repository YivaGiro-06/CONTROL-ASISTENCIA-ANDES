// clasificar.js — reglas de negocio. Validadas contra el tablero de enero–agosto 2026.
import { periodoDe } from './lib.js';
import { esRetiro, resolveTipoPermiso } from './entidades.js';

export const REGLAS = {
  diasInactividad: 14,        // regla C: sin ningún registro real → se borra
  maxInasContinuas: 20,       // > este valor → excluido del conteo activo (no se borra)
  umbralDescansoEfectivo: 10, // horas entre turnos
};

// Orden de precedencia. Cada paso gana sobre los siguientes.
//   1. Retiro declarado en el GA.
//   2. INGRESO NO ACTIVO A LA FECHA → noplan (aún no contratado, fuera del denominador).
//   3. Trabajó (HT > 0 o marcó entrada) → asistencia. Aplica también en festivo y domingo.
//   4. Festivo → descanso. No trabajar un festivo NO es falta, aunque Ausencias lo reporte.
//   5. Reportado en Ausencias → inasistencia. Fuente única.
//   6. Permiso en el GA → permiso.
//   7. Turno "Descanso" o domingo → descanso.
//   8. "No Planificado" → noplan.
//   9. Resto (sin plan, sin marca, sin ausencia) → descanso.
export function clasificar({ ga, esFestivo, esDomingo, enAusencias }) {
  const p = resolveTipoPermiso(ga.permiso);
  if (p?.retiro) return 'retiro';
  if (p?.noPlan) return 'noplan';
  if (ga.ht > 0 || ga.entro) return 'asist';
  if (esFestivo) return 'descanso';
  if (enAusencias) return 'inas';
  if (p) return 'permiso';
  if (ga.turno === 'Descanso' || esDomingo) return 'descanso';
  if (ga.turno === 'No Planificado') return 'noplan';
  return 'descanso';
}

// Registro "real": lo que prueba que la persona sigue vinculada.
// Un domingo o un día sin plan NO cuentan: si contaran, cualquier retirado reviviría
// cada semana y ni la regla de retiro ni la de inactividad dispararían nunca.
export function esRegistroReal(estado, ga) {
  if (estado === 'asist' || estado === 'inas' || estado === 'permiso') return true;
  if (estado === 'descanso') return ga?.turno === 'Descanso';
  return false;
}

// Racha de inasistencias continuas. NO la rompen descanso, noplan ni retiro (domingos,
// días sin plan). Sí la rompen una asistencia real o un permiso otorgado.
// Un festivo reportado en Ausencias SÍ cuenta para la racha, aunque en los indicadores
// ese día quede como descanso: si no, un festivo partiría una ausencia larga.
export function rachaInasistencias(dias, estadoDe, contaFestivo) {
  let max = 0, run = 0;
  for (const f of dias) {
    const s = estadoDe(f);
    if (s === 'inas' || contaFestivo(f)) { run++; if (run > max) max = run; }
    else if (s === 'descanso' || s === 'noplan' || s === 'retiro' || s === undefined) { /* no rompe */ }
    else run = 0;
  }
  return max;
}

export const BANDAS_JORNADA = ['<8', '8-10', '10-12', '12-13', '13-14', '>14'];
export function bandaJornada(h) {
  if (h < 8) return 0;
  if (h < 10) return 1;
  if (h < 12) return 2;
  if (h < 13) return 3;
  if (h < 14) return 4;
  return 5;
}

export const BANDAS_DESCANSO = ['<8', '8-10', '>10'];
export function bandaDescanso(h) { return h < 8 ? 0 : (h < 10 ? 1 : 2); }