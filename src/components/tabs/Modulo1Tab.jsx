import React, { useState } from 'react'

const PAGE_SIZE = 20

const CLF_COLORS = {
  'Rechazo Sugerido': 'bg-red-900/40 text-red-300 border border-red-700',
  'Revisión Manual': 'bg-amber-900/40 text-amber-300 border border-amber-700',
  'Sin Clasificar': 'bg-slate-700 text-slate-300',
}

const ESTADO_COLORS = {
  'Rechazada': 'text-red-400',
  'Aceptada': 'text-emerald-400',
}

const TIPO_COLORS = {
  'Clase': 'bg-blue-900/40 text-blue-300 border border-blue-700',
  'Clase Online': 'bg-blue-900/40 text-blue-300 border border-blue-700',
  'Ayudantía': 'bg-teal-900/40 text-teal-300 border border-teal-700',
  'Ayudantía Online': 'bg-teal-900/40 text-teal-300 border border-teal-700',
  'Laboratorio': 'bg-purple-900/40 text-purple-300 border border-purple-700',
  'Examen': 'bg-orange-900/40 text-orange-300 border border-orange-700',
  'Control': 'bg-orange-900/40 text-orange-300 border border-orange-700',
  'Prueba': 'bg-orange-900/40 text-orange-300 border border-orange-700',
}

function Badge({ text }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CLF_COLORS[text] || 'bg-slate-700 text-slate-300'}`}>
      {text}
    </span>
  )
}

function TipoBadge({ tipo }) {
  if (!tipo) return <span className="text-slate-600">—</span>
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TIPO_COLORS[tipo] || 'bg-slate-700 text-slate-300'}`}>
      {tipo}
    </span>
  )
}

function getPrioridad(row) {
  return row['PA'] || row['Prioridad'] || row['prioridad'] || row['PRIORIDAD'] ||
    row['Prioridad Academica'] || row['Prioridad Académica'] || null
}

export default function Modulo1Tab({ m1, hasEstado, decisiones = {}, onDecision }) {
  const [filter, setFilter] = useState('Todos')
  const [page, setPage] = useState(0)

  const options = ['Todos', 'Rechazo Sugerido', 'Revisión Manual', 'Sin Clasificar']
  const filtered = filter === 'Todos' ? m1.clasificadas : m1.clasificadas.filter(r => r._clasificacion === filter)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleFilter = (f) => { setFilter(f); setPage(0) }

  // Filas con Estado real vs filas interactivas (Estado vacío)
  const anyEstadoReal = m1.clasificadas.some(r => String(r['Estado'] || '').trim())
  const modoInteractivo = !anyEstadoReal

  const aceptadas = Object.values(decisiones).filter(d => d === 'Aceptada').length
  const rechazadas = Object.values(decisiones).filter(d => d === 'Rechazada').length
  const pendientes = m1.clasificadas.length - aceptadas - rechazadas

  const catAccuracy = hasEstado ? Object.entries(
    m1.clasificadas.reduce((acc, r) => {
      const cat = r['Error Categoría'] || r['Error Categoria'] || 'Sin Categoría'
      const estado = String(r['Estado'] || '').trim()
      if (!acc[cat]) acc[cat] = { total: 0, rechazos: 0, aceptadas: 0 }
      acc[cat].total++
      if (estado.toLowerCase().includes('rechaz')) acc[cat].rechazos++
      if (estado.toLowerCase().includes('acept')) acc[cat].aceptadas++
      return acc
    }, {})
  ).map(([cat, vals]) => ({ cat, ...vals })) : null

  return (
    <div className="space-y-5">
      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Solicitudes', value: m1.total, color: 'text-white' },
          { label: 'Rechazos Sugeridos', value: m1.rechazos.length, color: 'text-red-400', sub: '(Tope / Ligado)' },
          { label: 'Revisión Manual', value: m1.revision.length, color: 'text-amber-400', sub: '(Sección / Créd. / Restricc.)' },
          { label: 'Sin Clasificar', value: m1.sinClasificar.length, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-slate-600">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Contador de decisiones */}
      {modoInteractivo && (
        <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-6 flex-wrap">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Decisiones coordinadora</p>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400 font-bold">{aceptadas} <span className="font-normal text-slate-400">aceptadas</span></span>
            <span className="text-red-400 font-bold">{rechazadas} <span className="font-normal text-slate-400">rechazadas</span></span>
            <span className="text-slate-400 font-bold">{pendientes} <span className="font-normal">pendientes</span></span>
          </div>
          <p className="text-xs text-slate-600 ml-auto">Las decisiones se exportan en el Excel</p>
        </div>
      )}

      {/* KPI 1 detail if Estado */}
      {hasEstado && m1.kpi1 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">KPI 1 — Comparación Sistema vs. Coordinadora</h3>
          <p className="text-xs text-slate-500 mb-3">
            Mide qué porcentaje de las solicitudes marcadas como <strong className="text-slate-400">Tope de Horario</strong> o <strong className="text-slate-400">Curso Ligado</strong> por el sistema coinciden con la decisión real de la coordinadora (estado = Rechazada).
            Un valor ≥ 90% indica alta alineación entre la clasificación automática y el criterio de la coordinadora.
          </p>
          <div className="flex items-center gap-6 mb-4">
            <div>
              <span className="text-3xl font-bold text-blue-400">{m1.kpi1}%</span>
              <span className="ml-2 text-xs text-slate-500">tasa de detección</span>
            </div>
            <div className="text-sm text-slate-400">
              <p>Marcados por sistema: <strong className="text-white">{m1.kpi1Details.M}</strong></p>
              <p>Coinciden con coordinadora: <strong className="text-white">{m1.kpi1Details.C}</strong></p>
            </div>
          </div>
          {catAccuracy && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4">Categoría</th>
                    <th className="text-right py-2 pr-4">Total</th>
                    <th className="text-right py-2 pr-4">Rechazadas</th>
                    <th className="text-right py-2">Aceptadas</th>
                  </tr>
                </thead>
                <tbody>
                  {catAccuracy.map(row => (
                    <tr key={row.cat} className="border-b border-slate-700/50">
                      <td className="py-1.5 pr-4 text-slate-300">{row.cat}</td>
                      <td className="text-right py-1.5 pr-4">{row.total}</td>
                      <td className="text-right py-1.5 pr-4 text-red-400">{row.rechazos}</td>
                      <td className="text-right py-1.5 text-emerald-400">{row.aceptadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-300">Detalle de Solicitudes Clasificadas</h3>
          <div className="flex gap-2 flex-wrap">
            {options.map(o => (
              <button key={o} onClick={() => handleFilter(o)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === o ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                {o} {o === 'Todos' ? `(${m1.total})` : o === 'Rechazo Sugerido' ? `(${m1.rechazos.length})` : o === 'Revisión Manual' ? `(${m1.revision.length})` : `(${m1.sinClasificar.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-3">ID</th>
                <th className="text-left py-2 pr-3">Prioridad</th>
                <th className="text-left py-2 pr-3">Carrera</th>
                <th className="text-left py-2 pr-3">Período</th>
                <th className="text-left py-2 pr-3">NRC</th>
                <th className="text-left py-2 pr-3">Tipo</th>
                <th className="text-left py-2 pr-3">Curso</th>
                <th className="text-left py-2 pr-3">Categoría</th>
                <th className="text-left py-2 pr-3">Clasificación</th>
                <th className="text-left py-2 pr-3">Detalle Tope</th>
                <th className="text-left py-2">{modoInteractivo ? 'Decisión' : 'Estado Real'}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((r, i) => {
                const decision = decisiones[r._origIdx]
                const prioridad = getPrioridad(r)
                return (
                  <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-750">
                    <td className="py-1.5 pr-3">{r._id || '—'}</td>
                    <td className="py-1.5 pr-3">
                      {prioridad !== null
                        ? <span className="font-bold text-white">{prioridad}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-1.5 pr-3">{r['Carrera'] || '—'}</td>
                    <td className="py-1.5 pr-3">{r['Catalogo'] || '—'}</td>
                    <td className="py-1.5 pr-3">{r['NRC'] || '—'}</td>
                    <td className="py-1.5 pr-3"><TipoBadge tipo={r._tipoNrc} /></td>
                    <td className="py-1.5 pr-3 max-w-[140px] truncate" title={r['Nombre del Curso']}>{r['Nombre del Curso'] || '—'}</td>
                    <td className="py-1.5 pr-3">{r['Error Categoría'] || r['Error Categoria'] || '—'}</td>
                    <td className="py-1.5 pr-3"><Badge text={r._clasificacion} /></td>
                    <td className="py-1.5 pr-3 min-w-[220px] text-slate-400 whitespace-normal leading-snug">
                      {r._topeDetalle
                        ? <span>{r._topeDetalle}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    {modoInteractivo ? (
                      <td className="py-1.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => onDecision(r._origIdx, decision === 'Aceptada' ? null : 'Aceptada')}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              decision === 'Aceptada'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-emerald-900 hover:text-emerald-300'
                            }`}
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => onDecision(r._origIdx, decision === 'Rechazada' ? null : 'Rechazada')}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              decision === 'Rechazada'
                                ? 'bg-red-700 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-red-900 hover:text-red-300'
                            }`}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td className={`py-1.5 font-medium ${ESTADO_COLORS[r['Estado']] || 'text-slate-400'}`}>
                        {r['Estado'] || '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                className="px-3 py-1 rounded bg-slate-700 disabled:opacity-40 hover:bg-slate-600">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
