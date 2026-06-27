const API_URL = String(import.meta.env?.VITE_API_URL || '').replace(/\/$/, '')

export const persistenceEnabled = Boolean(API_URL)

export function buildRunPayload({ fileName, m1, m2, m3, hasEstado, hasHorario, hasCupos, decisiones, m3Decisiones }) {
  const module1Decisions = Object.entries(decisiones).map(([origIdx, decision]) => {
    const row = m1.clasificadas.find(item => String(item._origIdx) === String(origIdx))
    return {
      module: 'modulo1',
      subjectId: row?._id ? `ANON-${row._id}` : `ROW-${origIdx}`,
      decision,
      metadata: {
        nrc: String(row?.NRC || ''),
        classification: row?._clasificacion || '',
      },
    }
  })

  const module3Decisions = Object.entries(m3Decisiones).map(([course, decision]) => ({
    module: 'modulo3',
    subjectId: course,
    decision,
    metadata: {},
  }))

  return {
    fileName,
    totalRequests: m1.total,
    kpi1: m1.kpi1 === null ? null : Number(m1.kpi1),
    kpi2: m2.kpi2,
    kpi3: m3.kpi3,
    hasEstado,
    summaries: {
      module1: {
        byCategory: m1.byCategory,
        byPeriod: m1.byPeriodo,
        rejections: m1.rechazos.length,
        manualReview: m1.revision.length,
        withAcademicPriority: m1.conPrioridad,
        withCapacityEvidence: m1.conEvidenciaCupos,
        hasCapacityFile: hasCupos,
      },
      module2: {
        totalScheduleConflicts: m2.numTopes,
        uniquePairs: m2.numPares,
        recurrentPairs: m2.numRecurrentes,
        verifiedClassPairs: m2.numRecurrentesVerificados,
        hasScheduleFile: hasHorario,
        pairs: m2.recurrentes.slice(0, 100).map(pair => ({
          nrc1: pair.nrc1,
          nrc2: pair.nrc2,
          requests: pair.solicitudes,
          periods: pair.periodos,
          classValidation: pair.validacionClase,
        })),
      },
      module3: {
        candidates: m3.numSugeridos,
        recommended: m3.numConfirmados,
        latestPeriod: m3.latestPeriod,
        courses: m3.sugeridos.slice(0, 100).map(course => ({
          course: course.curso,
          projection: course.proyeccionProxPeriodo,
          trend: course.tendencia,
        })),
      },
    },
    decisions: [...module1Decisions, ...module3Decisions],
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `Error de persistencia (${response.status})`)
  return body
}

export function saveAnalysisRun(payload) {
  if (!persistenceEnabled) throw new Error('La API de persistencia no está configurada')
  return apiRequest('/api/runs', { method: 'POST', body: JSON.stringify(payload) })
}

export function listAnalysisRuns() {
  if (!persistenceEnabled) return Promise.resolve([])
  return apiRequest('/api/runs')
}
