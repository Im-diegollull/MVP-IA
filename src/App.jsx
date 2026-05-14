import React, { useState } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Dashboard from './components/Dashboard.jsx'
import { runModulo1 } from './utils/modulo1.js'
import { runModulo2 } from './utils/modulo2.js'
import { runModulo3 } from './utils/modulo3.js'

export default function App() {
  const [data, setData] = useState(null)

  const handleFileLoaded = ({ rows, headers, hasEstado }, fileName, catalogoRows = []) => {
    const m1 = runModulo1(rows, hasEstado)
    const m2 = runModulo2(rows, catalogoRows)
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
