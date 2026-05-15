import React, { useState } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Dashboard from './components/Dashboard.jsx'
import { runModulo1 } from './utils/modulo1.js'
import { runModulo2 } from './utils/modulo2.js'
import { runModulo3 } from './utils/modulo3.js'

const TIPO_MAP = {
  'CLAS': 'Clase', 'OLIN': 'Clase Online',
  'AYUD': 'Ayudantía', 'AYON': 'Ayudantía Online',
  'LABT': 'Laboratorio',
}

function buildNrcInfoMap(horarioRows) {
  const map = new Map()
  horarioRows.forEach(row => {
    const nrc = String(row['NRC'] ?? '').trim()
    if (!nrc) return
    const tipoRaw = String(row['TIPO DE REUNION'] ?? '').trim()
    const tipo = TIPO_MAP[tipoRaw] || tipoRaw
    const titulo = String(row['TITULO'] ?? '').trim()
    const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']
    const horario = dias.map(d => row[d] ? `${d} ${row[d]}` : null).filter(Boolean).join(', ')
    if (!map.has(nrc)) map.set(nrc, { tipo, titulo, horario })
  })
  return map
}

export default function App() {
  const [data, setData] = useState(null)

  const handleFileLoaded = ({ rows, headers, hasEstado }, fileName, catalogoRows = [], horarioRows = []) => {
    const nrcInfoMap = buildNrcInfoMap(horarioRows)
    const m1 = runModulo1(rows, hasEstado, nrcInfoMap)
    const m2 = runModulo2(rows, catalogoRows, nrcInfoMap)
    const m3 = runModulo3(rows)
    setData({ m1, m2, m3, hasEstado, fileName })
  }

  const handleReset = () => setData(null)

  if (!data) {
    return <FileUpload onFileLoaded={handleFileLoaded} />
  }

  return (
    <Dashboard
      m1={data.m1}
      m2={data.m2}
      m3={data.m3}
      hasEstado={data.hasEstado}
      fileName={data.fileName}
      onReset={handleReset}
    />
  )
}
