import { getField, getRawField, normalizeKey, parseNumeric } from './fields.js'

const TOTAL_ALIASES = ['Cupos', 'Cupo Total', 'Cupos Totales', 'Capacidad']
const ENROLLED_ALIASES = ['Inscritos', 'Matriculados', 'Cupos Ocupados', 'Ocupados']
const AVAILABLE_ALIASES = ['Disponibles', 'Cupos Disponibles', 'Vacantes']
const RESTRICTION_ALIASES = ['Carrera Restringida', 'Carreras Restringidas', 'Restricción Carrera', 'Restriccion Carrera']
const OBSERVATION_ALIASES = ['Observaciones', 'Observación', 'Observacion', 'Detalle Restricción', 'Detalle Restriccion']

function hasAnyCapacityField(row) {
  const aliases = [...TOTAL_ALIASES, ...ENROLLED_ALIASES, ...AVAILABLE_ALIASES, ...RESTRICTION_ALIASES, ...OBSERVATION_ALIASES]
  const keys = new Set(Object.keys(row ?? {}).map(normalizeKey))
  return aliases.some(alias => keys.has(normalizeKey(alias)))
}

export function buildCuposMap(rows = []) {
  const map = new Map()
  rows.forEach(row => {
    const nrc = getField(row, 'NRC')
    if (nrc) map.set(nrc, row)
  })
  return map
}

function restrictionMatches(restriction, carrera) {
  if (!restriction || !carrera) return false
  const target = normalizeKey(carrera)
  return restriction
    .split(/[,;|/]+/)
    .map(normalizeKey)
    .some(value => value === target || value.includes(target))
}

export function getCapacityEvidence(requestRow, cuposMap = new Map()) {
  const nrc = getField(requestRow, 'NRC')
  const externalRow = cuposMap.get(nrc)
  const sourceRow = externalRow || requestRow
  const hasEvidence = Boolean(externalRow) || hasAnyCapacityField(requestRow)

  if (!hasEvidence) {
    return {
      estado: 'Sin evidencia',
      fuente: 'No informada',
      cupos: null,
      inscritos: null,
      disponibles: null,
      restriccion: '',
      restriccionCoincide: false,
      observaciones: '',
    }
  }

  const cupos = parseNumeric(getRawField(sourceRow, ...TOTAL_ALIASES))
  const inscritos = parseNumeric(getRawField(sourceRow, ...ENROLLED_ALIASES))
  const explicitAvailable = parseNumeric(getRawField(sourceRow, ...AVAILABLE_ALIASES))
  const disponibles = explicitAvailable ?? (cupos !== null && inscritos !== null ? cupos - inscritos : null)
  const restriccion = getField(sourceRow, ...RESTRICTION_ALIASES)
  const carrera = getField(requestRow, 'Carrera')
  const restriccionCoincide = restrictionMatches(restriccion, carrera)
  const observaciones = getField(sourceRow, ...OBSERVATION_ALIASES)

  let estado = 'Evidencia parcial'
  if (disponibles !== null) estado = disponibles > 0 ? 'Con cupos' : 'Sin cupos'
  if (restriccion) estado = restriccionCoincide ? 'Restricción coincide' : 'Restricción no coincide'

  return {
    estado,
    fuente: externalRow ? 'Archivo de cupos' : 'Excel principal',
    cupos,
    inscritos,
    disponibles,
    restriccion,
    restriccionCoincide,
    observaciones,
  }
}
