import { getAcademicPriority, getField } from './fields.js'
import { getCapacityEvidence } from './capacity.js'

const REJECTION_CATEGORIES = ['Tope de Horario', 'Curso Ligado']
const MANUAL_CATEGORIES = ['Sección Cerrada', 'Creditos', 'Restricción Carrera']

function buildTopeEvidence(row, nrcInfoMap) {
  const error = getField(row, 'Error')
  const nrcSolicitado = getField(row, 'NRC')
  const nrcConflicto = error.match(/NRC\s+(\d+)/i)?.[1] ?? null
  if (!nrcConflicto) return null

  const solicitado = nrcInfoMap.get(nrcSolicitado)
  const conflicto = nrcInfoMap.get(nrcConflicto)
  return {
    nrcSolicitado,
    nrcConflicto,
    cursoSolicitado: getField(row, 'Nombre del Curso', 'Nombre del curso') || solicitado?.titulo || '',
    cursoConflicto: conflicto?.titulo || '',
    tipoSolicitado: solicitado?.tipo || '',
    tipoConflicto: conflicto?.tipo || '',
    horarioSolicitado: solicitado?.horario || '',
    horarioConflicto: conflicto?.horario || '',
    estadoEvidencia: conflicto?.validacionClase || 'Sin evidencia',
  }
}

export function runModulo1(rows, hasEstado, nrcInfoMap = new Map(), cuposMap = new Map()) {
  const clasificadas = rows.map((row, idx) => {
    const cat = getField(row, 'Error Categoría', 'Error Categoria', 'Error categoria')
    let clasificacion = 'Sin Clasificar'

    if (REJECTION_CATEGORIES.includes(cat)) {
      clasificacion = 'Rechazo Sugerido'
    } else if (MANUAL_CATEGORIES.includes(cat)) {
      clasificacion = 'Revisión Manual'
    }

    const prioridad = getAcademicPriority(row)
    const cupoEvidence = getCapacityEvidence(row, cuposMap)
    if (clasificacion === 'Sin Clasificar' && (cupoEvidence.estado === 'Sin cupos' || cupoEvidence.restriccion)) {
      clasificacion = 'Revisión Manual'
    }

    const topeEvidence = cat === 'Tope de Horario' ? buildTopeEvidence(row, nrcInfoMap) : null
    const topeDetalle = topeEvidence
      ? `${topeEvidence.tipoSolicitado ? `${topeEvidence.tipoSolicitado}: ` : ''}${topeEvidence.cursoSolicitado || `NRC ${topeEvidence.nrcSolicitado}`}` +
        ` topa con ${topeEvidence.tipoConflicto ? `${topeEvidence.tipoConflicto}: ` : ''}` +
        `${topeEvidence.cursoConflicto || `NRC ${topeEvidence.nrcConflicto}`}` +
        `${topeEvidence.horarioConflicto ? ` · ${topeEvidence.horarioConflicto}` : ''}` +
        ` · ${topeEvidence.estadoEvidencia}`
      : null

    return {
      ...row,
      _clasificacion: clasificacion,
      _origIdx: idx,
      _prioridadAcademica: prioridad,
      _cupoEvidence: cupoEvidence,
      _topeEvidence: topeEvidence,
      _topeDetalle: topeDetalle,
      _tipoNrc: topeEvidence?.tipoSolicitado || nrcInfoMap.get(getField(row, 'NRC'))?.tipo || null,
    }
  })

  const rechazos = clasificadas.filter(r => r._clasificacion === 'Rechazo Sugerido')
  const revision = clasificadas
    .filter(r => r._clasificacion === 'Revisión Manual')
    .sort((a, b) => (b._prioridadAcademica ?? -Infinity) - (a._prioridadAcademica ?? -Infinity) || a._origIdx - b._origIdx)
  const sinClasificar = clasificadas.filter(r => r._clasificacion === 'Sin Clasificar')

  let kpi1 = null
  let kpi1Details = null

  if (hasEstado) {
    const M = rechazos.length
    const C = rechazos.filter(r => getField(r, 'Estado').toLowerCase().includes('rechaz')).length
    kpi1 = M > 0 ? ((C / M) * 100).toFixed(1) : '0.0'
    kpi1Details = { M, C }
  }

  // Breakdown by category
  const byCategory = {}
  clasificadas.forEach(r => {
    const cat = getField(r, 'Error Categoría', 'Error Categoria', 'Error categoria') || 'Sin Categoría'
    byCategory[cat] = (byCategory[cat] || 0) + 1
  })

  // Breakdown by period
  const byPeriodo = {}
  clasificadas.forEach(r => {
    const periodo = getField(r, 'Catalogo', 'Período', 'Periodo')
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
    const carrera = getField(r, 'Carrera')
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
    conPrioridad: clasificadas.filter(r => r._prioridadAcademica !== null).length,
    conEvidenciaCupos: clasificadas.filter(r => r._cupoEvidence.estado !== 'Sin evidencia').length,
    total: clasificadas.length,
  }
}
