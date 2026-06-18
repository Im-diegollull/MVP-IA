import * as XLSX from 'xlsx'

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }))
}

function freezeHeader(ws) {
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' }
}

export function exportToExcel(modulo1Result, modulo2Result, modulo3Result, kpi1, kpi2, kpi3, decisiones = {}, hasEstado = false, m3Decisiones = {}) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Solicitudes Clasificadas
  const sheet1Data = modulo1Result.clasificadas.map(r => {
    const estadoReal = String(r['Estado'] || '').trim()
    // Use decision buttons when no real Estado value exists for this row
    const decisionCoord = estadoReal
      ? estadoReal
      : (decisiones[r._origIdx] != null ? decisiones[r._origIdx] : 'Pendiente')

    return {
      'ID Anónimo': r._id || '',
      'Carrera': r['Carrera'] || '',
      'Período': r['Catalogo'] || '',
      'NRC': r['NRC'] || '',
      'Nombre del Curso': r['Nombre del Curso'] || '',
      'Error Categoría': r['Error Categoría'] || r['Error Categoria'] || '',
      'Clasificación Sistema': r._clasificacion || '',
      'Detalle Tope': r._topeDetalle || '',
      'Decisión Coordinadora': decisionCoord,
    }
  })
  const ws1 = XLSX.utils.json_to_sheet(sheet1Data)
  setColWidths(ws1, [10, 12, 10, 8, 30, 20, 18, 55, 20])
  freezeHeader(ws1)
  XLSX.utils.book_append_sheet(wb, ws1, 'Solicitudes Clasificadas')

  // Sheet 2: Pares Recurrentes
  const sheet2Data = modulo2Result.recurrentes.map(p => ({
    'Par de Ramos': p.displayKey,
    'NRC 1': p.nrc1,
    'NRC 2': p.nrc2,
    'Total Solicitudes': p.solicitudes,
    'N° Períodos': p.numPeriodos,
    'Períodos': p.periodos.join(', '),
    'Carreras': p.carreras.join(', '),
  }))
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data)
  setColWidths(ws2, [60, 10, 10, 16, 12, 30, 30])
  freezeHeader(ws2)
  XLSX.utils.book_append_sheet(wb, ws2, 'Pares Recurrentes')

  // Sheet 3: Sugerencias Sobrecupo
  const decisionLabel = { confirmar: 'Confirmado', descartar: 'Descartado' }
  const sheet3Data = modulo3Result.sugeridos.map(c => ({
    'Nombre del Curso': c.curso,
    'NRC(s)': (c.nrcs || []).join(', '),
    'N° Períodos': c.numPeriodos,
    'Decisión Coordinadora': decisionLabel[m3Decisiones[c.curso]] || 'Pendiente',
  }))
  const ws3 = XLSX.utils.json_to_sheet(sheet3Data)
  setColWidths(ws3, [35, 20, 12, 18])
  freezeHeader(ws3)
  XLSX.utils.book_append_sheet(wb, ws3, 'Sugerencias Sobrecupo')

  // Sheet 4: Resumen KPIs
  const sheet4Data = [
    {
      'KPI': 'KPI 1 - Tasa Detección Correcta Rechazos',
      'Responsable': 'Renato Aguirre',
      'Valor': kpi1 !== null ? `${kpi1}%` : 'N/A - Modo Operativo',
      'Objetivo': '≥ 90%',
      'Cumple': kpi1 !== null ? (parseFloat(kpi1) >= 90 ? 'Sí' : 'No') : 'N/A',
    },
    {
      'KPI': 'KPI 2 - Pares de Ramos con Conflictos Recurrentes',
      'Responsable': 'Cristóbal Gazitúa',
      'Valor': kpi2,
      'Objetivo': '≥ 15 pares',
      'Cumple': kpi2 >= 15 ? 'Sí' : 'No',
    },
    {
      'KPI': 'KPI 3 - Ramos Sugeridos para Sobrecupo',
      'Responsable': 'Diego Llull',
      'Valor': kpi3,
      'Objetivo': '≥ 6 ramos',
      'Cumple': kpi3 >= 6 ? 'Sí' : 'No',
    },
  ]
  const ws4 = XLSX.utils.json_to_sheet(sheet4Data)
  setColWidths(ws4, [45, 20, 22, 12, 8])
  XLSX.utils.book_append_sheet(wb, ws4, 'Resumen KPIs')

  XLSX.writeFile(wb, 'Resultados_Sistema_Solicitudes.xlsx')
}
