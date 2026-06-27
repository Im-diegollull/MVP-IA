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

  const CARRERA_NAMES = {
    'INGI': 'Ing. Industrial',
    'INGE': 'Ing. Eléctrica',
    'INGC': 'Ing. Computación',
    'INGO': 'Obras Civiles',
    'INGQ': 'Ing. Química',
    'INGA': 'Ing. Ambiental',
    'ING':  'Ing. Civil',
  }

  // Carrera bar chart
  const carreraData = Object.entries(m1.byCarrera)
    .sort(([, a], [, b]) => b - a)
    .map(([carrera, total]) => ({
      carrera,
      nombre: CARRERA_NAMES[carrera] || carrera,
      total,
    }))

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
        {/* Pie: distribution by category — donut style */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Distribución por Categoría de Error</h3>
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Solicitudes']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white tabular-nums">{m1.total}</span>
              <span className="text-xs text-slate-500">solicitudes</span>
            </div>
          </div>
          {/* Custom legend */}
          <div className="mt-3 space-y-1.5">
            {catData
              .sort((a, b) => b.value - a.value)
              .map((entry, i) => {
                const idx = catData.indexOf(entry)
                const pct = m1.total > 0 ? ((entry.value / m1.total) * 100).toFixed(1) : '0.0'
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 truncate flex-1">{entry.name}</span>
                    <span className="text-slate-400 shrink-0 tabular-nums">{entry.value}</span>
                    <span className="text-slate-600 shrink-0 w-10 text-right tabular-nums">{pct}%</span>
                  </div>
                )
              })}
            <div className="flex items-center justify-between border-t border-slate-700 pt-2 text-xs font-semibold">
              <span className="text-slate-300">Total</span>
              <span className="text-white tabular-nums">{m1.total}</span>
            </div>
          </div>
        </div>

        {/* Bar: by carrera — horizontal for readability */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Solicitudes por Carrera</h3>
          <p className="text-xs text-slate-500 mb-3">Hover sobre cada barra para ver el código completo</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={carreraData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 500 }}
                width={110}
              />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(value, name, props) => [value, props.payload.nombre]}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 10 }}>
                {carreraData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
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
