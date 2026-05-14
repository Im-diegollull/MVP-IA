import * as XLSX from 'xlsx'

const RUT_KEYWORDS = ['rut', 'run']
const TITLE_KEYWORDS = ['listado', 'solicitudes', 'especiales', 'reporte', 'informe']

function isHeaderRow(row) {
  if (!row) return false
  const vals = Object.values(row).map(v => String(v ?? '').toLowerCase())
  return RUT_KEYWORDS.some(k => vals.some(v => v.includes(k)))
}

function isTitleRow(row) {
  if (!row) return false
  const vals = Object.values(row).map(v => String(v ?? '').toLowerCase())
  return TITLE_KEYWORDS.some(k => vals.some(v => v.includes(k)))
}

function anonymizeRut(rutMap, rut) {
  const key = String(rut ?? '').trim()
  if (!rutMap.has(key)) {
    rutMap.set(key, rutMap.size + 1)
  }
  return rutMap.get(key)
}

function normalizeHeader(h) {
  return String(h ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Read as array of arrays to detect header row
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        let headerRowIdx = 0
        for (let i = 0; i < Math.min(5, raw.length); i++) {
          const rowObj = {}
          raw[i].forEach((v, j) => { rowObj[j] = v })
          if (isHeaderRow(rowObj)) {
            headerRowIdx = i
            break
          }
          if (isTitleRow(rowObj)) {
            headerRowIdx = i + 1
            break
          }
        }

        const headers = raw[headerRowIdx].map(normalizeHeader)
        const rutMap = new Map()
        const rows = []

        for (let i = headerRowIdx + 1; i < raw.length; i++) {
          const row = raw[i]
          if (row.every(v => v === '' || v == null)) continue
          const obj = {}
          headers.forEach((h, j) => {
            obj[h] = row[j] ?? ''
          })
          // Anonymize RUT
          const rutField = headers.find(h => RUT_KEYWORDS.some(k => h.toLowerCase().includes(k)))
          if (rutField) {
            obj['_id'] = anonymizeRut(rutMap, obj[rutField])
            obj[rutField] = `ANON-${obj['_id']}`
          }
          rows.push(obj)
        }

        const hasEstado = headers.some(h => h.toLowerCase() === 'estado')
        resolve({ rows, headers, hasEstado, sheetName })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
