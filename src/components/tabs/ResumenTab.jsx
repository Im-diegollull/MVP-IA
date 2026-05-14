import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import KPICard from '../KPICard.jsx'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
}

export default function ResumenTab({ m1, m2, m3, hasEstado }) {
  const kpi1Val = m1.kpi1 !== null ? `${m1.kpi1}%` : null
  const kpi1Cumple = m1.kpi1 !== null ? parseFloat(m1.kpi1) >= 90 : null

  const kpi2Cumple = m2.kpi2 >= 15
  const kpi3Cumple = m3.kpi3 >= 6

  // Category distribution for Pie
  const catData = Object.entries(m1.byCategory).map(([name, value]) => ({ name, value }))

  // Period evolution for Line
  const periodoData = Object.entries(m1.byPeriodo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, vals]) => ({
      periodo,
      Total: vals.total,
      'Rechazo Sugerido': vals.rechazos,
      'Revisión Manual': vals.revision,
    }))

  // Carrera bar chart
  const carreraData = Object.entries(m1.byCarrera)
    .sort(([, a], [, b]) => b - a)
    .map(([carrera, total]) => ({ carrera, total }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="KPI 1 — Tasa Detección Rechazos"
          value={kpi1Val}
          objective="≥ 90%"
          cumple={kpi1Cumple}
          description={m1.kpi1Details ? `${m1.kpi1Details.C} de ${m1.kpi1Details.M} marcados como rechazo coinciden con coordinadora` : null}
          
        />
        <KPICard
          title="KPI 2 — Pares de Ramos Recurrentes"
          value={m2.kpi2}
          objective="≥ 15 pares"
          cumple={kpi2Cumple}
          description={`${m2.numPares} pares únicos identificados, ${m2.kpi2} aparecen en 2+ períodos`}
          
        />
        <KPICard
          title="KPI 3 — Sobrecupos Anticipados"
          value={m3.kpi3}
          objective="≥ 6 ramos"
          cumple={kpi3Cumple}
          description={`${m3.numSugeridos} ramos sugeridos, ${m3.kpi3} confirmaron alta demanda en ${m3.latestPeriod}`}
          
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie: distribution by category */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribución por Categoría de Error</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={90} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: by carrera */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Solicitudes por Carrera</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={carreraData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="carrera" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line: period evolution */}
      <div className="bg-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Evolución de Solicitudes por Período</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={periodoData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="periodo" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Rechazo Sugerido" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Revisión Manual" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Solicitudes', value: m1.total, color: 'text-white' },
          { label: 'Rechazos Sugeridos', value: m1.rechazos.length, color: 'text-red-400' },
          { label: 'En Revisión Manual', value: m1.revision.length, color: 'text-amber-400' },
          { label: 'Pares Recurrentes', value: m2.numRecurrentes, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
