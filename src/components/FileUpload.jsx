import React, { useState, useRef } from 'react'

export default function FileUpload({ onFileLoaded }) {
  const [dragging, setDragging] = useState(false)
  const [draggingCat, setDraggingCat] = useState(false)
  const [draggingHorario, setDraggingHorario] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [catalogoFile, setCatalogoFile] = useState(null)
  const [horarioFile, setHorarioFile] = useState(null)
  const inputRef = useRef()
  const inputCatRef = useRef()
  const inputHorarioRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Solo se aceptan archivos Excel (.xlsx o .xls)')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { parseExcelFile, parseCatalogoFile, parseHorarioFile } = await import('../utils/parseExcel.js')
      const result = await parseExcelFile(file)
      let catalogoRows = []
      if (catalogoFile) catalogoRows = await parseCatalogoFile(catalogoFile)
      let horarioRows = []
      if (horarioFile) horarioRows = await parseHorarioFile(horarioFile)
      onFileLoaded(result, file.name, catalogoRows, horarioRows)
    } catch (e) {
      setError(`Error al leer el archivo: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCatalogoFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('El catálogo debe ser un archivo Excel (.xlsx o .xls)')
      return
    }
    setCatalogoFile(file)
    setError(null)
  }

  const handleHorarioFile = (file) => {
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('El horario debe ser un archivo Excel (.xlsx o .xls)')
      return
    }
    setHorarioFile(file)
    setError(null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const onDropCatalogo = (e) => {
    e.preventDefault()
    setDraggingCat(false)
    handleCatalogoFile(e.dataTransfer.files[0])
  }

  const onDropHorario = (e) => {
    e.preventDefault()
    setDraggingHorario(false)
    handleHorarioFile(e.dataTransfer.files[0])
  }

  const onInputChange = (e) => {
    handleFile(e.target.files[0])
  }

  const onCatInputChange = (e) => {
    handleCatalogoFile(e.target.files[0])
  }

  const onHorarioInputChange = (e) => {
    handleHorarioFile(e.target.files[0])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-8">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-slate-400 text-sm font-medium">IA Aplicada — Grupo 3</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Sistema de Soporte a la Decisión</h1>
        <p className="text-slate-400 text-sm">Gestión Inteligente de Solicitudes Especiales ·</p>
      </div>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
          ${dragging ? 'border-blue-400 bg-blue-950/30' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onInputChange} />

        {loading ? (
          <>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 font-medium">Procesando archivo...</p>
          </>
        ) : (
          <>
            <svg className="w-14 h-14 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Arrastra tu archivo Excel aquí</p>
              <p className="text-slate-400 text-sm mt-1">o haz clic para seleccionar</p>
              <p className="text-slate-500 text-xs mt-2">Acepta .xlsx y .xls — funciona con o sin columna Estado</p>
            </div>
          </>
        )}
      </div>

      {/* Optional: Catálogo PE */}
      <div
        className={`w-full max-w-lg border border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 mt-3
          ${draggingCat ? 'border-violet-400 bg-violet-950/30' : catalogoFile ? 'border-emerald-600 bg-emerald-950/20' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'}`}
        onDragOver={(e) => { e.preventDefault(); setDraggingCat(true) }}
        onDragLeave={() => setDraggingCat(false)}
        onDrop={onDropCatalogo}
        onClick={() => inputCatRef.current?.click()}
      >
        <input ref={inputCatRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onCatInputChange} />
        <svg className="w-6 h-6 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 6h16M4 10h16M4 14h10M4 18h6" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">
            Catálogo PE <span className="text-slate-600">(opcional)</span>
          </p>
          <p className="text-xs text-slate-500 truncate">
            {catalogoFile ? catalogoFile.name : 'Arrastra Catálogo_PE_2026.xlsx para mejorar nombres de NRC'}
          </p>
        </div>
        {catalogoFile && (
          <span className="ml-auto text-emerald-400 text-xs shrink-0">Listo</span>
        )}
      </div>

      {/* Optional: Horario */}
      <div
        className={`w-full max-w-lg border border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 mt-2
          ${draggingHorario ? 'border-sky-400 bg-sky-950/30' : horarioFile ? 'border-emerald-600 bg-emerald-950/20' : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'}`}
        onDragOver={(e) => { e.preventDefault(); setDraggingHorario(true) }}
        onDragLeave={() => setDraggingHorario(false)}
        onDrop={onDropHorario}
        onClick={() => inputHorarioRef.current?.click()}
      >
        <input ref={inputHorarioRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onHorarioInputChange} />
        <svg className="w-6 h-6 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">
            Horario <span className="text-slate-600">(opcional — detalle de topes)</span>
          </p>
          <p className="text-xs text-slate-500 truncate">
            {horarioFile ? horarioFile.name : 'Arrastra HORARIO_ING_202610.xlsx para mostrar tipo de clase en topes'}
          </p>
        </div>
        {horarioFile && (
          <span className="ml-auto text-emerald-400 text-xs shrink-0">Listo</span>
        )}
      </div>

      {error && (
        <div className="mt-4 w-full max-w-lg bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-10 grid grid-cols-3 gap-6 w-full max-w-lg text-center">
        {[
          { label: 'Módulo 1', sub: 'Filtrado Automatizado', color: 'text-blue-400' },
          { label: 'Módulo 2', sub: 'Descubrimiento de Patrones', color: 'text-violet-400' },
          { label: 'Módulo 3', sub: 'Proyección de Sobrecupos', color: 'text-emerald-400' },
        ].map(m => (
          <div key={m.label} className="bg-slate-800 rounded-xl p-4">
            <p className={`text-sm font-bold ${m.color}`}>{m.label}</p>
            <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
