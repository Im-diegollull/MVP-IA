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

export default function Modulo3Tab({ m3 }) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(m3.sugeridos.length / PAGE_SIZE)
  const pageData = m3.sugeridos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const chartData = m3.top10.map(c => ({
    name: truncate(c.curso, 25),
    Total: c.total,
  }))

  return (
    <div className="space-y-5">
      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Secc. Cerradas Analizadas', value: m3.secCerrada.length, color: 'text-white' },
          { label: 'Ramos Sugeridos', value: m3.numSugeridos, color: 'text-blue-400', sub: '(≥5 total, ≥2 períodos)' },
          { label: 'Alta Demanda Confirmada', value: m3.numConfirmados, color: 'text-emerald-400', sub: `en ${m3.latestPeriod}` },
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
        <span className="font-semibold text-emerald-400">Criterio de sugerencia:</span>
        {' '}Ramos con ≥5 solicitudes de "Sección Cerrada" en ≥2 períodos distintos.
        Período analizado: <strong className="text-white">{m3.latestPeriod || 'N/A'}</strong>.
      </div>

      {/* Bar chart top 10 */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Top 10 Ramos Candidatos a Sobrecupo</h3>
          <p className="text-xs text-slate-500 mb-4">Total de solicitudes de sección cerrada por ramo</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="Total" name="Total Solicitudes" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#10b981" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-1">Ramos Sugeridos para Sobrecupo</h3>
        <p className="text-xs text-slate-500 mb-4">Criterio: ≥5 solicitudes totales Y ≥2 períodos de demanda</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-4">Ramo</th>
                <th className="text-left py-2 pr-4">NRC(s)</th>
                <th className="text-right py-2 pr-4">N° Períodos</th>
                <th className="text-left py-2">¿Sobrecupo?</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((c, i) => (
                <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-750">
                  <td className="py-2 pr-4 text-slate-200 font-medium max-w-[200px] truncate" title={c.curso}>{c.curso}</td>
                  <td className="py-2 pr-4 text-slate-400 max-w-[140px] truncate" title={(c.nrcs || []).join(', ')}>
                    {(c.nrcs || []).join(', ') || '—'}
                  </td>
                  <td className="text-right py-2 pr-4">{c.numPeriodos}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-300 border border-emerald-700">
                      Si
                    </span>
                  </td>
                </tr>
              ))}
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
