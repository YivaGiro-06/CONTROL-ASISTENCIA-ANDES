# Control de Asistencia · Regional Andes

Tablero de asistencia, ausentismo, calidad de marcaje, jornada laboral y descanso
efectivo para el personal operativo de los **10 Centros de Distribución** de la **Regional Andes** (LIS · Bavaria/AB InBev):

1. **CD Itagüí**
2. **CD Armenia**
3. **CD Forjandes**
4. **CD UC Girardota**
5. **CD OL Girardota**
6. **CD UC Pereira**
7. **CD OL Pereira**
8. **CD Manizales**
9. **CD Med Aranjuez**
10. **CD Med Envigado**

Datos extraídos y pre-procesados de GeoVictoria.

Frontend estático (HTML + JS + Chart.js) desplegado en Cloudflare Pages.
Los datos se pre-procesan a JSON con un pipeline de Node; no hay backend.

---

## Uso diario

```bash
npm install          # una sola vez
npm run generar      # lee los Excel de apartado_*/ y escribe data/*.json
npm run auditar      # verifica que los JSON sean fieles a los Excel
git add . && git commit -m "corte YYYY-MM-DD" && git push
```

Cloudflare Pages redespliega solo. Para ver los cambios en el navegador: **Ctrl+Shift+R**
(recarga sin caché).

Antes de subir, opcionalmente: `npm run smoke` prueba el frontend sin navegador.

---

## Dónde va cada Excel

| Carpeta | Archivo | Hoja | Contenido |
|---|---|---|---|
| `apartado_ga/` | `GA_2026-08.xlsx` | Información Diaria | **Fuente maestra.** Estado, turno, permiso, HT, atraso, cargo, recargos |
| `apartado_ausencias/` | `AUS_2026-08.xlsx` | Content | **Fuente única de inasistencias** |
| `apartado_punch/` | `PUNCH_2026-08.xlsx` | Con Marcas | Marcaciones con tipo y método |
| `apartado_inconsistencias/` | `INCONS_2026-08.xlsx` | Content | *Opcional*: si falta, se derivan del GA (salida sin entrada) |

Un archivo por mes. El del mes en curso se reemplaza conforme avanza.

**El nombre del archivo no decide nada.** Cada fila se clasifica por la fecha que trae
adentro; el nombre solo se usa para avisar si no coinciden. Un archivo mal bautizado
genera una advertencia en consola pero los datos quedan bien.

Los Excel están en `.gitignore` y nunca suben al repo.

> ⚠️ GeoVictoria carga las ausencias **con retraso**. Un export del día siguiente sale
> subestimado. Conviene volver a bajar el mes recién cerrado unos días después.

---

## Estructura

```
CONTROL-ASISTENCIA/
├── index.html · css/style.css · js/app.js     frontend
├── data/                                      JSON generados (sí se despliegan)
│   ├── agregados.json      KPI, people, por_mes, cargo_stats, breakdowns, calendario
│   ├── diario_YYYY-MM.json arrays diarios particionados por mes
│   ├── manifiesto.json     índice de particiones
│   └── festivos.json       calculados, no editables a mano
├── apartado_*/                                Excel (NO se despliegan)
└── scratch/                                   pipeline (NO se despliega)
    ├── generar_datos.js    lectura de Excel + agregación + escritura
    ├── lib.js              normalizadores, resolveCols, particionado
    ├── entidades.js        tablas escalables (grupos, estados, métodos, permisos)
    ├── clasificar.js       reglas de negocio y umbrales
    ├── festivos.js         cálculo automático de festivos
    ├── auditar.js          auditoría independiente
    └── smoke.js           prueba del frontend con jsdom
```

Un solo comando corre todo: `generar_datos.js` importa los demás.

---

## Reglas de negocio

Viven en **`scratch/clasificar.js`**. Es el único archivo que se toca cuando cambia una
decisión de negocio.

### Estado de cada día — orden de precedencia

1. Retiro declarado en el GA → `retiro`
2. `INGRESO NO ACTIVO A LA FECHA` → `noplan` *(aún no contratado, fuera del denominador)*
3. Trabajó (HT > 0 o marcó entrada) → `asist` *(también en festivo y domingo)*
4. **Festivo** → `descanso` *(no trabajar un festivo no es falta, aunque Ausencias lo reporte)*
5. Reportado en Ausencias → `inas`
6. Permiso en el GA → `permiso`
7. Turno "Descanso" o **domingo** → `descanso`
8. "No Planificado" → `noplan`
9. Resto → `descanso`

### Borrado de personas

- **Retiro al cierre**: GeoVictoria lo marca → se borra con toda su historia.
- **Inactividad (14 días)**: sin ningún registro real en los últimos 14 días → se borra.

Un "registro real" es asistencia, ausencia, permiso o descanso **planificado**. Un domingo
o un día sin plan no cuentan: si contaran, cualquier retirado reviviría cada semana.

### Exclusión (no es borrado)

Más de **20 inasistencias continuas** → sale del conteo activo pero se conserva. Marcado
con la bandera `x` en las particiones. La racha no la rompen descanso, `noplan` ni retiro;
sí la rompen una asistencia o un permiso. Un festivo reportado en Ausencias sí cuenta para
la racha, aunque en los indicadores ese día quede como descanso.

### Marcaciones incorrectas (Calidad de marcaje)

Se clasifican como marcaciones incorrectas o inconsistencias **únicamente** aquellos registros en los que existe marca de **salida pero no de entrada** (falta la marcación de ingreso).

Se extraen del reporte de inconsistencias (`apartado_inconsistencias/`) o se derivan directamente del GA identificando jornadas con marca de salida sin su correspondiente entrada. Las entradas sin salida o marcaciones completas no se cuentan como inconsistencia.

### Indicadores

Todos son **tasas**, para que sean comparables mes a mes. Los deltas van en **puntos
porcentuales**. Un mes sin datos va como `null` (barra saltada), nunca como 0 %.

```
Ausentismo total %      = (inasistencias + permisos) ÷ días programados
Marcaciones correctas % = (marcas − inconsistencias) ÷ marcas
Descanso efectivo %     = descansos > 10 h ÷ total de descansos
```

Días programados = asistencias + inasistencias + permisos. Descansos, retiros y `noplan`
quedan fuera del denominador.

Inconsistencias = marcaciones con salida sin entrada.

**Regla dura:** el ausentismo total debe ser exactamente injustificado + justificado. El
total se calcula sumando las dos partes ya redondeadas, no redondeando el total aparte.
El auditor lo verifica.

### Festivos

Se **calculan**, no se listan. `scratch/festivos.js` cubre cualquier año:

- **Fijos**: 1-ene, 1-may, 20-jul, 7-ago, 8-dic, 25-dic.
- **Ley Emiliani**: se corren al lunes siguiente.
- **Móviles por Pascua**: algoritmo gregoriano; Jueves y Viernes Santo a −3 y −2 días,
  Ascensión +43, Corpus Christi +64, Sagrado Corazón +71.

Incluye el festivo de **Ntra. Sra. del Rosario de Chiquinquirá** (9 de julio, Ley 2578 del
1-jun-2026, con Emiliani), vigente desde 2026.

Dos festivos pueden caer el mismo día: en 2025 San Pedro coincidió con Sagrado Corazón el
30 de junio, y ese año Colombia tuvo 17 días festivos, no 18. El pipeline lo detecta y lo
reporta.

Si sale otra ley, se agrega **una línea** a `FIJOS` o `EMILIANI` con su año de vigencia.

---

## Cómo escala

### Particiones por mes

Los datasets diarios se parten en `jornada_YYYY-MM.json` y `descanso_YYYY-MM.json`, con
`manifiesto.json` como índice. El frontend lee el manifiesto y **solo trae las particiones
del período que se está viendo**.

`agregados.json` trae todo lo pre-calculado (KPI, `people`, `por_mes`, `cargo_stats`,
breakdowns, calendario). Las **particiones `diario_YYYY-MM.json`** llevan los arrays
diarios: `dayState`, `htDays`, `jlDays`, `inasDays`, `permDays`, `inconDays`, `metodoDays`
y `descDays`, cada uno con la forma `[índice de persona, índice de día, valor]`.

El índice de día es **global al calendario**, así que el cargador solo concatena las
particiones en orden: no hay que reindexar nada.

Las 8 particiones se piden **en paralelo**, lo que es más rápido que un solo archivo de
3,5 MB, y el navegador cachea por separado los meses que no cambiaron. Al reprocesar
agosto solo se invalida `diario_2026-08.json`.

### El frontend es el original, sin modificar

`js/app.js` tiene dos partes: un **cargador** que arma el objeto `DATA` desde los JSON, y
debajo las **788 líneas del tablero original sin un solo cambio**, envueltas en
`arrancarTablero(DATA)`. El CSS y el HTML también son idénticos al desplegado.

Esto es deliberado: toda la interacción que ya funcionaba (drill-down de dos niveles,
buscador de colaborador, "Todo es clickeable", fichas de persona) sigue funcionando porque
es literalmente el mismo código. La partición es transparente para el tablero.

### Lectura de Excel a prueba de cambios

`resolveCols()` hace doble blindaje: busca la columna **por nombre de header** (tolerante a
acentos, mayúsculas, espacios y saltos de línea) y si no la encuentra cae a un **índice
fijo**. Si difieren, gana el header y avisa por consola.

Esto ya se ganó el sueldo: el PunchReport tiene los headers en la fila 2, no en la 4, la
columna se llama `Grupo Usuario` y la fila 0 trae bandas de agrupación con la palabra
"Grupo". Sin el blindaje se perdían 83.371 filas en silencio.

### Categorías escalables

En `scratch/entidades.js`. Agregar un grupo, un estado, un método de marcación o un tipo de
permiso es **una línea**. Los cargos ni siquiera se listan: se descubren desde el GA y se
colorean con una rampa. Los selectores del frontend se llenan desde `catalogos.json`, no
están cableados en el HTML.

---

## Auditoría

`npm run auditar` **no importa nada del pipeline**. Relee los Excel con su propio código y
vuelve a contar. Si compartiera funciones, un error en el pipeline pasaría desapercibido
porque el auditor cometería el mismo error.

Verifica en 8 bloques: integridad de `data/`, recuento independiente del GA, trazabilidad
de cada ausencia una por una, festivos y domingos, resumen contra particiones, recuento del
PunchReport, coherencia interna, exclusiones y descansos.

Sale con código 1 si hay fallos. Los **avisos** son observaciones esperables:

| Aviso | Por qué |
|---|---|
| Cobertura de marcaciones < 100 % | Las que faltan son de personas borradas |
| Asistencias sin HT | Entraron sin cerrar jornada |
| Días en estado retiro de personas activas | GeoVictoria marcó retiro y la persona volvió |

---

## Cosas que conviene saber

**UDC Envigado** empezó a aparecer en los exports. El filtro lo descarta, pero el pipeline
reporta cuántas filas descartó por grupo.

**Domingos.** El archivo de Ausencias reporta faltas en domingo (artefacto de Horario
Libre). Hoy esas ausencias ganan sobre la regla de "domingo = descanso", lo que puede
inflar el ausentismo de un mes. Cambiarlo es mover el paso 5 antes del 7 en
`clasificar.js`. **Decisión pendiente.**

**Corte.** Se calcula como el último día con actividad real, no la última fila del GA: el
export del mes en curso trae los días futuros vacíos.

**Los permisos salen de la columna `Permiso` del GA**, no de un archivo aparte. Que un mes
tenga cero permisos significa que el GA dice "Ninguno", no que falte un archivo.

---

## Despliegue

Cloudflare Pages, `Deploy from a branch` → `main` → `/ (root)`. Se publica `index.html`,
`css/`, `js/` y `data/`.

Los archivos grandes hay que subirlos con **Add file → Upload files**, arrastrando. El
editor web de GitHub trunca archivos grandes sin avisar.