import React, { useState } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Dashboard from './components/Dashboard.jsx'
import { runModulo1 } from './utils/modulo1.js'
import { runModulo2 } from './utils/modulo2.js'
import { runModulo3 } from './utils/modulo3.js'
import { buildNrcInfoMap } from './utils/schedule.js'
import { buildCuposMap } from './utils/capacity.js'

export default function App() {
  const [data, setData] = useState(null)

  const handleFileLoaded = ({ rows, headers, hasEstado }, fileName, catalogoRows = [], horarioRows = [], cuposRows = []) => {
    const nrcInfoMap = buildNrcInfoMap(horarioRows)
    const cuposMap = buildCuposMap(cuposRows)
    const m1 = runModulo1(rows, hasEstado, nrcInfoMap, cuposMap)
    const m2 = runModulo2(rows, catalogoRows, nrcInfoMap)
    const m3 = runModulo3(rows)
    setData({ m1, m2, m3, hasEstado, fileName, hasHorario: horarioRows.length > 0, hasCupos: cuposRows.length > 0 })
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
      hasHorario={data.hasHorario}
      hasCupos={data.hasCupos}
      onReset={handleReset}
    />
  )
}
