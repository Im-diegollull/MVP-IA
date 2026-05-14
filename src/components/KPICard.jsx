import React from 'react'

export default function KPICard({ title, value, objective, cumple, description, responsible }) {
  const isNA = value === null || value === undefined || value === 'N/A'

  const borderColor = isNA
    ? 'border-slate-600'
    : cumple
    ? 'border-emerald-500'
    : 'border-red-500'

  const badgeBg = isNA
    ? 'bg-slate-700 text-slate-300'
    : cumple
    ? 'bg-emerald-900 text-emerald-300'
    : 'bg-red-900 text-red-300'

  const valueColor = isNA
    ? 'text-slate-400'
    : cumple
    ? 'text-emerald-400'
    : 'text-red-400'

  return (
    <div className={`bg-slate-800 rounded-xl p-5 border-l-4 ${borderColor} flex flex-col gap-2`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg}`}>
          {isNA ? 'N/A' : cumple ? 'CUMPLE' : 'NO CUMPLE'}
        </span>
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>
        {isNA ? 'N/A' : value}
      </p>
      <p className="text-xs text-slate-500">Objetivo: {objective}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      {isNA && (
        <p className="text-xs text-slate-500 italic">Modo operativo — sin columna Estado</p>
      )}
      {responsible && (
        <p className="text-xs text-slate-600 mt-auto pt-1 border-t border-slate-700">
          Responsable: {responsible}
        </p>
      )}
    </div>
  )
}
