// Module 3: Overcapacity projection — linear regression forecast

function getField(row, ...keys) {
  for (const k of keys) {
    const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase())
    if (found && row[found] !== undefined && row[found] !== '') return String(row[found]).trim()
  }
  return ''
}

function mean(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function stddev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((acc, v) => acc + (v - m) ** 2, 0) / arr.length)
}

// Ordinary least squares linear regression
function linearRegression(xArr, yArr) {
  const n = xArr.length
  if (n < 2) return { slope: 0, intercept: yArr[0] || 0 }
  const sumX = xArr.reduce((a, b) => a + b, 0)
  const sumY = yArr.reduce((a, b) => a + b, 0)
  const sumXY = xArr.reduce((acc, x, i) => acc + x * yArr[i], 0)
  const sumX2 = xArr.reduce((acc, x) => acc + x * x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

const UMBRAL_PROYECCION = 3   // solicitudes mínimas proyectadas para recomendar sobrecupo
const MIN_TOTAL = 3           // mínimo histórico para ser candidato
const MIN_PERIODOS = 2        // mínimos períodos con datos

export function runModulo3(rows) {
  // Filter sección cerrada
  const secCerrada = rows.filter(r => {
    const cat = getField(r, 'Error Categoría', 'Error Categoria', 'Error categoria')
    return cat === 'Sección Cerrada'
  })

  // Group by course and period
  const courseByPeriod = new Map()

  secCerrada.forEach(row => {
    const curso = getField(row, 'Nombre del Curso', 'Nombre del curso', 'nombre del curso') ||
                  getField(row, 'Curso', 'curso')
    const periodo = getField(row, 'Catalogo', 'catalogo', 'Período', 'periodo')
    const carrera = getField(row, 'Carrera', 'carrera')

    if (!curso) return

    if (!courseByPeriod.has(curso)) {
      courseByPeriod.set(curso, { curso, periodos: new Map(), carreras: new Set(), nrcs: new Set() })
    }

    const entry = courseByPeriod.get(curso)
    if (!entry.periodos.has(periodo)) entry.periodos.set(periodo, 0)
    entry.periodos.set(periodo, entry.periodos.get(periodo) + 1)
    if (carrera) entry.carreras.add(carrera)
    const nrc = getField(row, 'NRC', 'nrc')
    if (nrc) entry.nrcs.add(nrc)
  })

  // All periods sorted chronologically
  const allPeriods = [...new Set(secCerrada.map(r =>
    getField(r, 'Catalogo', 'catalogo', 'Período', 'periodo')
  ).filter(Boolean))].sort()

  const latestPeriod = allPeriods[allPeriods.length - 1]

  // Build statistics + regression per course
  const cursoStats = Array.from(courseByPeriod.values()).map(entry => {
    // Counts in chronological order (sorted by period label)
    const sortedPeriods = [...entry.periodos.keys()].sort()
    const counts = sortedPeriods.map(p => entry.periodos.get(p))

    const total = counts.reduce((a, b) => a + b, 0)
    const numPeriodos = entry.periodos.size
    const mediaHist = mean(counts)
    const deHist = stddev(counts)

    // Linear regression: x = period index (0,1,2,...), y = demand count
    const xArr = counts.map((_, i) => i)
    const { slope, intercept } = linearRegression(xArr, counts)

    // Proyección para el próximo semestre (índice = numPeriodos)
    const proyeccionRaw = slope * numPeriodos + intercept
    const proyeccionProxPeriodo = Math.max(0, Math.round(proyeccionRaw))

    // Clasificación de tendencia
    const tendencia = slope > 0.3 ? 'creciente' : slope < -0.3 ? 'decreciente' : 'estable'

    // ¿Se recomienda sobrecupo? Basado en proyección, no en último período
    const recomendaSobrecupo = proyeccionProxPeriodo >= UMBRAL_PROYECCION

    const ultimaDemanda = entry.periodos.get(latestPeriod) || 0

    return {
      curso: entry.curso,
      nrcs: [...entry.nrcs].sort(),
      total,
      numPeriodos,
      mediaHist: +mediaHist.toFixed(1),
      deHist: +deHist.toFixed(1),
      slope: +slope.toFixed(2),
      intercept: +intercept.toFixed(2),
      proyeccionProxPeriodo,
      tendencia,
      recomendaSobrecupo,
      ultimaDemanda,
      latestPeriod,
      // kept for backward compat
      tieneAltaDemanda: recomendaSobrecupo,
      umbral: +(mediaHist + deHist).toFixed(1),
      periodos: Object.fromEntries(entry.periodos),
      carreras: [...entry.carreras],
    }
  })

  // Candidates: enough historical data to make a reliable projection
  const sugeridos = cursoStats
    .filter(c => c.total >= MIN_TOTAL && c.numPeriodos >= MIN_PERIODOS)
    .sort((a, b) => b.proyeccionProxPeriodo - a.proyeccionProxPeriodo || b.total - a.total)

  // KPI 3: courses the model predicts will need sobrecupo next semester
  const confirmados = sugeridos.filter(c => c.recomendaSobrecupo)

  const top10 = sugeridos.slice(0, 10)

  return {
    secCerrada,
    cursoStats,
    sugeridos,
    confirmados,
    top10,
    allPeriods,
    latestPeriod,
    numSugeridos: sugeridos.length,
    numConfirmados: confirmados.length,
    kpi3: confirmados.length,
  }
}
