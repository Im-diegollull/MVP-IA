import test from 'node:test'
import assert from 'node:assert/strict'
import { getAcademicPriority, getAcademicPriorityGroup } from '../src/utils/fields.js'
import { buildCuposMap, getCapacityEvidence } from '../src/utils/capacity.js'
import { buildNrcInfoMap, validateClassPair } from '../src/utils/schedule.js'
import { runModulo1 } from '../src/utils/modulo1.js'
import { runModulo2 } from '../src/utils/modulo2.js'
import { runModulo3 } from '../src/utils/modulo3.js'
import { buildRunPayload } from '../src/utils/persistence.js'

test('extrae variantes de prioridad académica y conserva fallback nulo', () => {
  assert.equal(getAcademicPriority({ 'Prioridad Académica': '8' }), 8)
  assert.equal(getAcademicPriority({ 'Prioridad Academica': 4 }), 4)
  assert.equal(getAcademicPriority({ Prioridad: '9,5' }), 9.5)
  assert.equal(getAcademicPriority({ Prioridad: 5, 'Prioridad Académica': 9 }), 9)
  assert.equal(getAcademicPriority({ PA: '7' }), 7)
  assert.equal(getAcademicPriority({ Carrera: 'INGI' }), null)
})

test('extrae el grupo de prioridad académica desde la columna PA Grupo', () => {
  assert.equal(getAcademicPriorityGroup({ 'PA Grupo': 'A' }), 'A')
  assert.equal(getAcademicPriorityGroup({ 'PA_Grupo': '2' }), '2')
  assert.equal(getAcademicPriorityGroup({ Carrera: 'INGI' }), '')
})

test('ordena revisión manual por la prioridad numérica más alta', () => {
  const rows = [
    { NRC: '1', 'Error Categoría': 'Sección Cerrada', Prioridad: 3 },
    { NRC: '2', 'Error Categoría': 'Creditos' },
    { NRC: '3', 'Error Categoría': 'Restricción Carrera', 'Prioridad Académica': 10 },
  ]
  const result = runModulo1(rows, false)
  assert.deepEqual(result.revision.map(row => row.NRC), ['3', '1', '2'])
})

test('calcula disponibles y detecta coincidencia de restricción', () => {
  const map = buildCuposMap([{ NRC: '123', Cupos: 40, Inscritos: 40, 'Carrera Restringida': 'INGI; INGC' }])
  const evidence = getCapacityEvidence({ NRC: '123', Carrera: 'INGI' }, map)
  assert.equal(evidence.disponibles, 0)
  assert.equal(evidence.restriccionCoincide, true)
  assert.equal(evidence.estado, 'Restricción coincide')
})

test('mantiene evidencia de cupos opcional cuando no hay datos', () => {
  const evidence = getCapacityEvidence({ NRC: '999', Carrera: 'INGI' })
  assert.equal(evidence.estado, 'Sin evidencia')
  assert.equal(evidence.disponibles, null)
})

test('valida clase, actividad no clase y falta de evidencia', () => {
  const map = buildNrcInfoMap([
    { NRC: '100', 'TIPO DE REUNION': 'CLAS', TITULO: 'Cálculo', Lunes: '08:30-09:40' },
    { NRC: '200', 'TIPO DE REUNION': 'OLIN', TITULO: 'Física', Martes: '10:00-11:10' },
    { NRC: '300', 'TIPO DE REUNION': 'AYUD', TITULO: 'Cálculo', Viernes: '12:00-13:10' },
    { NRC: '400', 'TIPO DE REUNION': 'EXAM', TITULO: 'Cálculo', Viernes: '15:00-16:10' },
  ])
  assert.equal(validateClassPair('100', '200', map), 'Clase verificada')
  assert.equal(validateClassPair('100', '300', map), 'Actividad no clase')
  assert.equal(validateClassPair('100', '400', map), 'Actividad no clase')
  assert.equal(validateClassPair('100', '999', map), 'Sin evidencia')
})

test('calcula KPI 1 sobre rechazos sugeridos con Estado', () => {
  const rows = [
    { NRC: '1', 'Error Categoría': 'Tope de Horario', Estado: 'Rechazada' },
    { NRC: '2', 'Error Categoría': 'Curso Ligado', Estado: 'Aceptada' },
  ]
  const result = runModulo1(rows, true)
  assert.equal(result.kpi1, '50.0')
  assert.deepEqual(result.kpi1Details, { M: 2, C: 1 })
})

test('calcula KPI 2 histórico y contador de pares clase verificada', () => {
  const rows = [
    { NRC: '100', 'Nombre del Curso': 'Cálculo', 'Error Categoría': 'Tope de Horario', Error: 'NRC 200 - Física', Catalogo: '2025-1', _id: 1 },
    { NRC: '100', 'Nombre del Curso': 'Cálculo', 'Error Categoría': 'Tope de Horario', Error: 'NRC 200 - Física', Catalogo: '2025-2', _id: 2 },
  ]
  const schedule = buildNrcInfoMap([
    { NRC: '100', 'TIPO DE REUNION': 'CLAS', TITULO: 'Cálculo' },
    { NRC: '200', 'TIPO DE REUNION': 'CLAS', TITULO: 'Física' },
  ])
  const result = runModulo2(rows, [], schedule)
  assert.equal(result.kpi2, 1)
  assert.equal(result.numRecurrentesVerificados, 1)
})

test('calcula KPI 3 con una serie sintética de demanda creciente', () => {
  const rows = []
  for (let i = 0; i < 3; i++) rows.push({ 'Nombre del Curso': 'Cálculo', 'Error Categoría': 'Sección Cerrada', Catalogo: '2025-1' })
  for (let i = 0; i < 4; i++) rows.push({ 'Nombre del Curso': 'Cálculo', 'Error Categoría': 'Sección Cerrada', Catalogo: '2025-2' })
  const result = runModulo3(rows)
  assert.equal(result.kpi3, 1)
  assert.equal(result.sugeridos[0].proyeccionProxPeriodo, 5)
})

test('construye persistencia anonimizada sin incluir RUT', () => {
  const m1 = runModulo1([{ RUT: 'ANON-1', _id: 1, NRC: '123', 'Error Categoría': 'Creditos' }], false)
  const m2 = runModulo2([])
  const m3 = runModulo3([])
  const payload = buildRunPayload({
    fileName: 'solicitudes.xlsx', m1, m2, m3, hasEstado: false, hasHorario: false, hasCupos: false,
    decisiones: { 0: 'Aceptada' }, m3Decisiones: {},
  })
  const serialized = JSON.stringify(payload)
  assert.equal(serialized.includes('RUT'), false)
  assert.equal(payload.decisions[0].subjectId, 'ANON-1')
})
