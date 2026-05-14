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

function Badge({ text }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CLF_COLORS[text] || 'bg-slate-700 text-slate-300'}`}>
      {text}
    </span>
  )
}

export default function Modulo1Tab({ m1, hasEstado }) {
  const [filter, setFilter] = useState('Todos')
  const [page, setPage] = useState(0)

  const options = ['Todos', 'Rechazo Sugerido', 'Revisión Manual', 'Sin Clasificar']
  const filtered = filter === 'Todos' ? m1.clasificadas : m1.clasificadas.filter(r => r._clasificacion === filter)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleFilter = (f) => { setFilter(f); setPage(0) }

  // Category accuracy if Estado available
  const catAccuracy = hasEstado ? Object.entries(
    m1.clasificadas.reduce((acc, r) => {
      const cat = r['Error Categoría'] || r['Error Categoria'] || 'Sin Categoría'
      const clf = r._clasificacion
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

      {/* KPI 1 detail if Estado */}
      {hasEstado && m1.kpi1 && (
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">KPI 1 — Comparación Sistema vs. Coordinadora</h3>
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
                <th className="text-left py-2 pr-3">Carrera</th>
                <th className="text-left py-2 pr-3">Período</th>
                <th className="text-left py-2 pr-3">NRC</th>
                <th className="text-left py-2 pr-3">Curso</th>
                <th className="text-left py-2 pr-3">Categoría</th>
                <th className="text-left py-2 pr-3">Clasificación</th>
                {hasEstado && <th className="text-left py-2">Estado Real</th>}
              </tr>
            </thead>
            <tbody>
              {pageData.map((r, i) => (
                <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-750">
                  <td className="py-1.5 pr-3">{r._id || '—'}</td>
                  <td className="py-1.5 pr-3">{r['Carrera'] || '—'}</td>
                  <td className="py-1.5 pr-3">{r['Catalogo'] || '—'}</td>
                  <td className="py-1.5 pr-3">{r['NRC'] || '—'}</td>
                  <td className="py-1.5 pr-3 max-w-[160px] truncate" title={r['Nombre del Curso']}>{r['Nombre del Curso'] || '—'}</td>
                  <td className="py-1.5 pr-3">{r['Error Categoría'] || r['Error Categoria'] || '—'}</td>
                  <td className="py-1.5 pr-3"><Badge text={r._clasificacion} /></td>
                  {hasEstado && (
                    <td className={`py-1.5 font-medium ${ESTADO_COLORS[r['Estado']] || 'text-slate-400'}`}>
                      {r['Estado'] || '—'}
                    </td>
                  )}
                </tr>
              ))}
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
