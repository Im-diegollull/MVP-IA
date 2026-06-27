import { getField } from './fields.js'

export const TIPO_MAP = {
  CLAS: 'Clase',
  OLIN: 'Clase Online',
  AYUD: 'Ayudantía',
  AYON: 'Ayudantía Online',
  LABT: 'Laboratorio',
}

const CLASS_TYPES = new Set(['CLAS', 'OLIN'])
const NON_CLASS_TYPES = new Set(['AYUD', 'AYON', 'LABT'])
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function validateMeetingTypes(typeCodes) {
  const codes = [...new Set(typeCodes.map(code => String(code ?? '').trim().toUpperCase()).filter(Boolean))]
  if (!codes.length) return 'Sin evidencia'
  if (codes.every(code => CLASS_TYPES.has(code))) return 'Clase verificada'
  if (codes.every(code => NON_CLASS_TYPES.has(code))) return 'Actividad no clase'
  return 'Sin evidencia'
}

function buildMeeting(row) {
  const tipoRaw = getField(row, 'TIPO DE REUNION', 'TIPO DE REUNIÓN', 'Tipo de reunion').toUpperCase()
  const horario = DAYS
    .map(day => {
      const value = getField(row, day)
      return value ? `${day} ${value}` : null
    })
    .filter(Boolean)
    .join(', ')

  return {
    tipoRaw,
    tipo: TIPO_MAP[tipoRaw] || tipoRaw || 'Tipo no informado',
    horario,
  }
}

export function buildNrcInfoMap(horarioRows = []) {
  const grouped = new Map()

  horarioRows.forEach(row => {
    const nrc = getField(row, 'NRC')
    if (!nrc) return
    if (!grouped.has(nrc)) grouped.set(nrc, [])
    grouped.get(nrc).push({ row, meeting: buildMeeting(row) })
  })

  const map = new Map()
  grouped.forEach((entries, nrc) => {
    const reuniones = entries.map(entry => entry.meeting)
    const tipos = [...new Set(reuniones.map(r => r.tipo).filter(Boolean))]
    const horarios = [...new Set(reuniones.map(r => r.horario).filter(Boolean))]
    const titulo = entries.map(entry => getField(entry.row, 'TITULO', 'Título', 'Nombre del Curso')).find(Boolean) || ''

    map.set(nrc, {
      nrc,
      titulo,
      tipo: tipos.join(', '),
      horario: horarios.join(' · '),
      reuniones,
      validacionClase: validateMeetingTypes(reuniones.map(r => r.tipoRaw)),
    })
  })

  return map
}

export function validateClassPair(nrc1, nrc2, nrcInfoMap = new Map()) {
  const statuses = [nrcInfoMap.get(String(nrc1))?.validacionClase, nrcInfoMap.get(String(nrc2))?.validacionClase]
  if (statuses.every(status => status === 'Clase verificada')) return 'Clase verificada'
  if (statuses.some(status => status === 'Actividad no clase')) return 'Actividad no clase'
  return 'Sin evidencia'
}
