import React, { useState } from 'react'
import ResumenTab from './tabs/ResumenTab.jsx'
import Modulo1Tab from './tabs/Modulo1Tab.jsx'
import Modulo2Tab from './tabs/Modulo2Tab.jsx'
import Modulo3Tab from './tabs/Modulo3Tab.jsx'
import { exportToExcel } from '../utils/exportExcel.js'

const TABS = [
  { id: 'resumen', label: 'Resumen', },
  { id: 'modulo1', label: 'Módulo 1 — Filtrado',  },
  { id: 'modulo2', label: 'Módulo 2 — Patrones',  },
  { id: 'modulo3', label: 'Módulo 3 — Sobrecupos',  },
]

export default function Dashboard({ m1, m2, m3, hasEstado, fileName, onReset }) {
  const [activeTab, setActiveTab] = useState('resumen')
  const [exporting, setExporting] = useState(false)
  const [decisiones, setDecisiones] = useState({})
  const [m3Decisiones, setM3Decisiones] = useState({})

  const handleDecision = (origIdx, decision) => {
    setDecisiones(prev => ({ ...prev, [origIdx]: decision }))
  }

  const handleM3Decision = (curso, decision) => {
    setM3Decisiones(prev => {
      const next = { ...prev }
      if (decision === null) delete next[curso]
      else next[curso] = decision
      return next
    })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      exportToExcel(m1, m2, m3, m1.kpi1, m2.kpi2, m3.kpi3, decisiones, hasEstado, m3Decisiones)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Sistema de Soporte a la Decisión</h1>
              <p className="text-slate-400 text-xs">IA Aplicada — Grupo 3 ·</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 border border-slate-700 rounded-lg px-3 py-1.5 truncate max-w-[180px]" title={fileName}>
              {fileName}
            </span>
            {!hasEstado && (
              <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700 rounded-lg px-3 py-1.5">
                Modo Operativo
              </span>
            )}
            {hasEstado && (
              <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-700 rounded-lg px-3 py-1.5">
                Con Estado
              </span>
            )}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Nuevo Archivo
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-slate-800/50 border-b border-slate-700 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'resumen' && <ResumenTab m1={m1} m2={m2} m3={m3} hasEstado={hasEstado} />}
          {activeTab === 'modulo1' && <Modulo1Tab m1={m1} hasEstado={hasEstado} decisiones={decisiones} onDecision={handleDecision} />}
          {activeTab === 'modulo2' && <Modulo2Tab m2={m2} />}
          {activeTab === 'modulo3' && <Modulo3Tab m3={m3} m3Decisiones={m3Decisiones} onM3Decision={handleM3Decision} />}
        </div>
      </main>

      <footer className="bg-slate-800/30 border-t border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <span>Renato Aguirre · Cristóbal Gazitúa · Diego Llull</span>
          <span>Entregable 4 · Mayo 2026</span>
        </div>
      </footer>
    </div>
  )
}
