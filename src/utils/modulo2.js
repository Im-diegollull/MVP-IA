// Module 2: Pattern discovery (AI - Apriori-like analysis)

const NRC_REGEX = /NRC\s+(\d+)/i

function extractNRCFromError(errorStr) {
  const match = String(errorStr ?? '').match(NRC_REGEX)
  return match ? match[1] : null
}

function getField(row, ...keys) {
  for (const k of keys) {
    const found = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase())
    if (found && row[found] !== undefined && row[found] !== '') return String(row[found]).trim()
  }
  return ''
}

export function runModulo2(rows) {
  // Filter topes de horario
  const topes = rows.filter(r => {
    const cat = getField(r, 'Error Categoría', 'Error Categoria', 'Error categoria')
    return cat === 'Tope de Horario'
  })

  // Build pairs
  const pairMap = new Map()

  topes.forEach(row => {
    const nrcSolicitado = getField(row, 'NRC', 'nrc')
    const errorStr = getField(row, 'Error', 'error')
    const nrcConflicto = extractNRCFromError(errorStr)
    const periodo = getField(row, 'Catalogo', 'catalogo', 'Período', 'periodo')
    const cursoPrincipal = getField(row, 'Nombre del Curso', 'Nombre del curso', 'nombre del curso')
    const cursoConflicto = errorStr.split('-').slice(1).join('-').trim() || `NRC ${nrcConflicto}`

    if (!nrcSolicitado || !nrcConflicto) return

    const pairKey = [nrcSolicitado, nrcConflicto].sort().join('||')
    const displayKey = [cursoPrincipal || `NRC ${nrcSolicitado}`, cursoConflicto || `NRC ${nrcConflicto}`]
      .sort()
      .join(' vs ')

    if (!pairMap.has(pairKey)) {
      pairMap.set(pairKey, {
        pairKey,
        displayKey,
        nrc1: pairKey.split('||')[0],
        nrc2: pairKey.split('||')[1],
        curso1: cursoPrincipal || `NRC ${nrcSolicitado}`,
        curso2: cursoConflicto || `NRC ${nrcConflicto}`,
        solicitudes: 0,
        periodos: new Set(),
        carreras: new Set(),
      })
    }

    const entry = pairMap.get(pairKey)
    entry.solicitudes++
    if (periodo) entry.periodos.add(periodo)
    const carrera = getField(row, 'Carrera', 'carrera')
    if (carrera) entry.carreras.add(carrera)
  })

  const pares = Array.from(pairMap.values()).map(p => ({
    ...p,
    periodos: [...p.periodos].sort(),
    carreras: [...p.carreras],
    numPeriodos: p.periodos.size,
  }))

  const recurrentes = pares.filter(p => p.numPeriodos >= 2)

  // Sort by solicitudes desc
  pares.sort((a, b) => b.solicitudes - a.solicitudes)
  recurrentes.sort((a, b) => b.solicitudes - a.solicitudes || b.numPeriodos - a.numPeriodos)

  // Apriori-like: frequent itemsets from course names per period
  const transacciones = {}
  topes.forEach(row => {
    const periodo = getField(row, 'Catalogo', 'catalogo', 'Período', 'periodo')
    const rut = getField(row, '_id') || getField(row, 'RUT', 'rut')
    const txKey = `${periodo}||${rut}`
    const curso = getField(row, 'Nombre del Curso', 'Nombre del curso', 'nombre del curso')
    if (!transacciones[txKey]) transacciones[txKey] = new Set()
    if (curso) transacciones[txKey].add(curso)
  })

  // Count co-occurrences of course pairs in same transaction
  const coOccurrences = new Map()
  Object.values(transacciones).forEach(itemset => {
    const items = [...itemset]
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const key = [items[i], items[j]].sort().join('|||')
        coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1)
      }
    }
  })

  const frecuentItemsets = Array.from(coOccurrences.entries())
    .filter(([, count]) => count >= 2)
    .map(([key, count]) => {
      const [a, b] = key.split('|||')
      return { items: [a, b], support: count }
    })
    .sort((a, b) => b.support - a.support)

  return {
    topes,
    pares,
    recurrentes,
    frecuentItemsets,
    numPares: pares.length,
    numRecurrentes: recurrentes.length,
    numTopes: topes.length,
    kpi2: recurrentes.length,
  }
}
