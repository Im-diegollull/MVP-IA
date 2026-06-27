import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const PAGE_SIZE = 20

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 },
  labelStyle: { color: '#94a3b8', fontSize: 11 },
  itemStyle: { color: '#e2e8f0', fontSize: 11 },
}

function truncate(str, max = 30) {
  return str && str.length > max ? str.slice(0, max) + '…' : str
}

function tipoLabel(tipo, curso) {
  if (!tipo) return curso
  return `${tipo}: ${curso}`
}

function buildPairLabel(p) {
  const a = tipoLabel(p.tipo1, p.cursoNrc1 || p.curso1 || `NRC ${p.nrc1}`)
  const b = tipoLabel(p.tipo2, p.cursoNrc2 || p.curso2 || `NRC ${p.nrc2}`)
  return `${a} topa con ${b}`
}

const VALIDATION_STYLE = {
  'Clase verificada': 'bg-emerald-950/40 text-emerald-300 border-emerald-800',
  'Actividad no clase': 'bg-amber-950/40 text-amber-300 border-amber-800',
  'Sin evidencia': 'bg-slate-700/50 text-slate-400 border-slate-600',
}

export default function Modulo2Tab({ m2 }) {
  const [showAll, setShowAll] = useState(false)
  const [page, setPage] = useState(0)
  const [validationFilter, setValidationFilter] = useState('Todos')

  const baseTableData = showAll ? m2.pares : m2.recurrentes
  const tableData = validationFilter === 'Todos'
    ? baseTableData
    : baseTableData.filter(pair => pair.validacionClase === validationFilter)
  const totalPages = Math.ceil(tableData.length / PAGE_SIZE)
  const pageData = tableData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Top 10 recurrentes for bar chart
  const chartData = m2.recurrentes.slice(0, 10).map(p => ({
    name: truncate(buildPairLabel(p), 45),
    Solicitudes: p.solicitudes,
    Períodos: p.numPeriodos,
  }))

  return (
    <div className="space-y-5">
      {/* Summary counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Topes Horario', value: m2.numTopes, color: 'text-white' },
          { label: 'Pares Únicos', value: m2.numPares, color: 'text-blue-400' },
          { label: 'Pares Recurrentes', value: m2.numRecurrentes, color: 'text-violet-400', sub: '(2+ períodos)' },
          { label: 'Recurrentes Clase Verificada', value: m2.numRecurrentesVerificados, color: 'text-sky-400', sub: '(ambos NRC)' },
          { label: 'KPI 2 — Objetivo ≥15', value: m2.kpi2, color: m2.kpi2 >= 15 ? 'text-emerald-400' : 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            {s.sub && <p className="text-xs text-slate-600">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Apriori note */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-xs text-slate-400">
        <span className="font-semibold text-violet-400">Algoritmo Apriori aplicado:</span>
        {' '}Se identificaron <strong className="text-white">{m2.frecuentItemsets.length}</strong> pares frecuentes de cursos
        con soporte ≥2 (co-ocurrencia en transacciones del mismo estudiante y período).
        Los pares recurrentes son aquellos que generan conflictos en <strong className="text-white">2 o más períodos distintos</strong>.
        {' '}La evidencia de clase se valida contra el tipo de reunión del archivo de horario.
      </div>

      {/* Bar chart top 10 */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Top 10 Pares Recurrentes por Solicitudes</h3>
          <p className="text-xs text-slate-500 mb-4">Pares que aparecen en 2+ períodos distintos, ordenados por volumen</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} width={220} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="Solicitudes" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${260 + i * 8}, 70%, ${55 + i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {m2.frecuentItemsets.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Itemsets Frecuentes — Análisis Apriori</h3>
          <p className="text-xs text-slate-500 mb-3">Pares de cursos que co-ocurren en solicitudes del mismo estudiante y período (soporte ≥ 2)</p>
          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-xs text-slate-400">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 pr-4">Curso A</th>
                  <th className="text-left py-2 pr-4">Curso B</th>
                  <th className="text-right py-2">Soporte</th>
                </tr>
              </thead>
              <tbody>
                {m2.frecuentItemsets.slice(0, 20).map((item, i) => (
                  <tr key={i} className="border-b border-slate-700/40">
                    <td className="py-1.5 pr-4 text-slate-300">{item.items[0]}</td>
                    <td className="py-1.5 pr-4 text-slate-300">{item.items[1]}</td>
                    <td className="text-right py-1.5 text-violet-400 font-medium">{item.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-300">Detalle de Pares de Conflicto</h3>
            <p className="text-xs text-slate-500 mt-0.5">{showAll ? `Todos los pares (${m2.numPares})` : `Solo recurrentes (${m2.numRecurrentes})`}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={validationFilter}
              onChange={(event) => { setValidationFilter(event.target.value); setPage(0) }}
              className="h-8 rounded border border-slate-600 bg-slate-700 px-2 text-xs text-slate-200"
              aria-label="Filtrar por evidencia de clase"
            >
              {['Todos', 'Clase verificada', 'Actividad no clase', 'Sin evidencia'].map(option => <option key={option}>{option}</option>)}
            </select>
            <button onClick={() => { setShowAll(v => !v); setPage(0) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
              {showAll ? 'Mostrar solo recurrentes' : 'Mostrar todos los pares'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-3">Par de Ramos</th>
                <th className="text-right py-2 pr-3">Solicitudes</th>
                <th className="text-right py-2 pr-3">N° Períodos</th>
                <th className="text-left py-2 pr-3">Períodos</th>
                <th className="text-left py-2 pr-3">Validación</th>
                <th className="text-left py-2">Carreras</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((p, i) => (
                <tr key={i} className={`border-b border-slate-700/40 ${p.numPeriodos >= 2 ? 'bg-violet-950/20' : ''}`}>
                  <td className="py-2 pr-3 w-[45%]">
                    <div className="text-slate-200 font-medium leading-snug">{buildPairLabel(p)}</div>
                    {p.numPeriodos >= 2 && (
                      <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-violet-900/40 text-violet-300 border border-violet-700">
                        Recurrente
                      </span>
                    )}
                  </td>
                  <td className="text-right py-1.5 pr-3 font-bold text-white">{p.solicitudes}</td>
                  <td className="text-right py-1.5 pr-3 text-violet-400">{p.numPeriodos}</td>
                  <td className="py-1.5 pr-3 text-slate-500">{p.periodos.join(', ')}</td>
                  <td className="py-1.5 pr-3">
                    <span className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded text-xs border ${VALIDATION_STYLE[p.validacionClase] || VALIDATION_STYLE['Sin evidencia']}`}>
                      {p.validacionClase || 'Sin evidencia'}
                    </span>
                  </td>
                  <td className="py-1.5 text-slate-500">{p.carreras.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, tableData.length)} de {tableData.length}</span>
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
