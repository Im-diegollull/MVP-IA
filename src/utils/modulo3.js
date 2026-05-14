// Module 3: Overcapacity projection (basic AI - statistical)

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
      courseByPeriod.set(curso, { curso, periodos: new Map(), carreras: new Set() })
    }

    const entry = courseByPeriod.get(curso)
    if (!entry.periodos.has(periodo)) entry.periodos.set(periodo, 0)
    entry.periodos.set(periodo, entry.periodos.get(periodo) + 1)
    if (carrera) entry.carreras.add(carrera)
  })

  // Get all periods sorted
  const allPeriods = [...new Set(secCerrada.map(r =>
    getField(r, 'Catalogo', 'catalogo', 'Período', 'periodo')
  ).filter(Boolean))].sort()

  const latestPeriod = allPeriods[allPeriods.length - 1]

  // Build statistics per course
  const cursoStats = Array.from(courseByPeriod.values()).map(entry => {
    const counts = [...entry.periodos.values()]
    const total = counts.reduce((a, b) => a + b, 0)
    const numPeriodos = entry.periodos.size
    const mediaHist = mean(counts)
    const deHist = stddev(counts)
    const umbral = mediaHist + deHist
    const ultimaDemanda = entry.periodos.get(latestPeriod) || 0
    const tieneAltaDemanda = ultimaDemanda > umbral && umbral > 0

    return {
      curso: entry.curso,
      total,
      numPeriodos,
      mediaHist: +mediaHist.toFixed(1),
      deHist: +deHist.toFixed(1),
      umbral: +umbral.toFixed(1),
      ultimaDemanda,
      latestPeriod,
      tieneAltaDemanda,
      periodos: Object.fromEntries(entry.periodos),
      carreras: [...entry.carreras],
    }
  })

  // Suggestion criteria: >=5 total solicitudes AND >=2 periods
  const sugeridos = cursoStats
    .filter(c => c.total >= 5 && c.numPeriodos >= 2)
    .sort((a, b) => b.total - a.total)

  // KPI 3: how many suggested courses confirmed high demand in latest period
  const confirmados = sugeridos.filter(c => c.tieneAltaDemanda)

  // Top 10 for chart
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
