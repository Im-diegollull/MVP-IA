import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
}

const PAGE_SIZE = 20

function truncate(str, max = 28) {
  return str && str.length > max ? str.slice(0, max) + '…' : str
}

const TENDENCIA_CONFIG = {
  creciente:   { label: '↑ Creciente',  className: 'bg-red-900/40 text-red-300 border-red-700' },
  estable:     { label: '→ Estable',    className: 'bg-amber-900/40 text-amber-300 border-amber-700' },
  decreciente: { label: '↓ Decreciente',className: 'bg-slate-700/60 text-slate-400 border-slate-600' },
}

export default function Modulo3Tab({ m3, m3Decisiones = {}, onM3Decision }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(m3.sugeridos.length / PAGE_SIZE)
  const pageData = m3.sugeridos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Chart: top 10 by projected demand for next semester
  const chartData = m3.top10.map(c => ({
    name: truncate(c.curso, 25),
    Proyección: c.proyeccionProxPeriodo,
    Histórico: c.ultimaDemanda,
  }))

  // Effective decision for each course: model recommendation or manual override
  function getDecision(curso, recomendaSobrecupo) {
    const manual = m3Decisiones[curso]
    if (manual !== undefined) return manual
    return recomendaSobrecupo ? 'confirmar' : null
  }

  return (
    <div className="space-y-5">
      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Secc. Cerradas Analizadas', value: m3.secCerrada.length, color: 'text-white' },
          { label: 'Ramos Candidatos', value: m3.numSugeridos, color: 'text-blue-400', sub: `(≥3 sol., ≥2 períodos)` },
          { label: 'Sobrecupo Recomendado', value: m3.numConfirmados, color: 'text-emerald-400', sub: 'proyección ≥3 sol.' },
          { label: 'KPI 3 — Objetivo ≥6', value: m3.kpi3, color: m3.kpi3 >= 6 ? 'text-emerald-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-slate-600">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Method explanation */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-400 space-y-1">
        <p>
          <span className="font-semibold text-emerald-400">Método:</span>
          {' '}Regresión lineal sobre la demanda histórica por ramo para estimar solicitudes en el próximo semestre.
          La recomendación de sobrecupo se activa cuando la proyección es ≥ 3 solicitudes.
        </p>
        <p>
          <span className="font-semibold text-slate-300">Período más reciente analizado:</span>
          {' '}<strong className="text-white">{m3.latestPeriod || 'N/A'}</strong>.
          {' '}Puedes confirmar o descartar manualmente cada sugerencia.
        </p>
      </div>

      {/* Bar chart — projected vs latest demand */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Top 10 — Proyección vs Demanda Actual</h3>
          <p className="text-xs text-slate-500 mb-4">
            Barras verdes = solicitudes proyectadas próximo semestre · Barras grises = último período conocido
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="Proyección" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#10b981" />)}
              </Bar>
              <Bar dataKey="Histórico" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#475569" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table with manual override */}
      <div className="bg-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Ramos Candidatos a Sobrecupo</h3>
        <p className="text-xs text-slate-500 mb-4">
          Tendencia calculada por regresión lineal · Puedes confirmar o descartar la recomendación del modelo
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-3">Ramo</th>
                <th className="text-left py-2 pr-3">NRC(s)</th>
                <th className="text-right py-2 pr-3">Períodos</th>
                <th className="text-left py-2 pr-3">Tendencia</th>
                <th className="text-right py-2 pr-3">Proyección</th>
                <th className="text-left py-2">Decisión</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c, i) => {
                const decision = getDecision(c.curso, c.recomendaSobrecupo)
                const isConfirmado = decision === 'confirmar'
                const isDescartado = decision === 'descartar'
                const tConfig = TENDENCIA_CONFIG[c.tendencia] || TENDENCIA_CONFIG.estable

                return (
                  <tr
                    key={i}
                    className={`border-b border-slate-700/40 transition-colors ${
                      isDescartado ? 'opacity-50' : 'hover:bg-slate-750'
                    }`}
                  >
                    <td className="py-2 pr-3 text-slate-200 font-medium max-w-[180px] truncate" title={c.curso}>
                      {c.curso}
                    </td>
                    <td className="py-2 pr-3 text-slate-400 max-w-[120px] truncate" title={(c.nrcs || []).join(', ')}>
                      {(c.nrcs || []).join(', ') || '—'}
                    </td>
                    <td className="text-right py-2 pr-3">{c.numPeriodos}</td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${tConfig.className}`}>
                        {tConfig.label}
                      </span>
                    </td>
                    <td className="text-right py-2 pr-3 font-semibold text-white">
                      {c.proyeccionProxPeriodo}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onM3Decision?.(c.curso, isConfirmado ? null : 'confirmar')}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                            isConfirmado
                              ? 'bg-emerald-700 border-emerald-600 text-white'
                              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-emerald-600 hover:text-emerald-300'
                          }`}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => onM3Decision?.(c.curso, isDescartado ? null : 'descartar')}
                          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                            isDescartado
                              ? 'bg-red-900/60 border-red-700 text-red-300'
                              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-red-700 hover:text-red-300'
                          }`}
                        >
                          Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, m3.sugeridos.length)} de {m3.sugeridos.length}</span>
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
