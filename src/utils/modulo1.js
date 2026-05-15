// Module 1: Rule-based filtering (not AI)

const REJECTION_CATEGORIES = ['Tope de Horario', 'Curso Ligado']
const MANUAL_CATEGORIES = ['Sección Cerrada', 'Creditos', 'Restricción Carrera']

function getErrorCategoria(row) {
  return String(row['Error Categoría'] ?? row['Error Categoria'] ?? row['Error categoria'] ?? '').trim()
}

function getEstado(row) {
  return String(row['Estado'] ?? '').trim()
}

export function runModulo1(rows, hasEstado, nrcInfoMap = new Map()) {
  const clasificadas = rows.map((row, idx) => {
    const cat = getErrorCategoria(row)
    let clasificacion = 'Sin Clasificar'

    if (REJECTION_CATEGORIES.includes(cat)) {
      clasificacion = 'Rechazo Sugerido'
    } else if (MANUAL_CATEGORIES.includes(cat)) {
      clasificacion = 'Revisión Manual'
    }

    const errorStr = String(row['Error'] ?? row['error'] ?? '').trim()
    const nrcConflicto = errorStr.match(/NRC\s+(\d+)/i)?.[1] ?? null

    let _topeDetalle = null
    if (cat === 'Tope de Horario' && nrcConflicto) {
      const info = nrcInfoMap.get(nrcConflicto)
      if (info) {
        _topeDetalle = `Tope con ${info.tipo} de ${info.titulo} (NRC ${nrcConflicto})${info.horario ? ' — ' + info.horario : ''}`
      } else {
        _topeDetalle = `NRC ${nrcConflicto} (sin detalle)`
      }
    }

    return { ...row, _clasificacion: clasificacion, _origIdx: idx, _topeDetalle }
  })

  const rechazos = clasificadas.filter(r => r._clasificacion === 'Rechazo Sugerido')
  const revision = clasificadas.filter(r => r._clasificacion === 'Revisión Manual')
  const sinClasificar = clasificadas.filter(r => r._clasificacion === 'Sin Clasificar')

  let kpi1 = null
  let kpi1Details = null

  if (hasEstado) {
    const M = rechazos.length
    const C = rechazos.filter(r => getEstado(r).toLowerCase().includes('rechaz')).length
    kpi1 = M > 0 ? ((C / M) * 100).toFixed(1) : '0.0'
    kpi1Details = { M, C }
  }

  // Breakdown by category
  const byCategory = {}
  clasificadas.forEach(r => {
    const cat = getErrorCategoria(r) || 'Sin Categoría'
    byCategory[cat] = (byCategory[cat] || 0) + 1
  })

  // Breakdown by period
  const byPeriodo = {}
  clasificadas.forEach(r => {
    const periodo = String(r['Catalogo'] ?? r['catalogo'] ?? r['Período'] ?? '').trim()
    if (periodo) {
      if (!byPeriodo[periodo]) byPeriodo[periodo] = { total: 0, rechazos: 0, revision: 0 }
      byPeriodo[periodo].total++
      if (r._clasificacion === 'Rechazo Sugerido') byPeriodo[periodo].rechazos++
      if (r._clasificacion === 'Revisión Manual') byPeriodo[periodo].revision++
    }
  })

  // Breakdown by carrera
  const byCarrera = {}
  clasificadas.forEach(r => {
    const carrera = String(r['Carrera'] ?? '').trim()
    if (carrera) byCarrera[carrera] = (byCarrera[carrera] || 0) + 1
  })

  return {
    clasificadas,
    rechazos,
    revision,
    sinClasificar,
    kpi1,
    kpi1Details,
    byCategory,
    byPeriodo,
    byCarrera,
    total: clasificadas.length,
  }
}
