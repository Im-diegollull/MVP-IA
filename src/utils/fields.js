export function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function getRawField(row, ...aliases) {
  const normalizedAliases = new Set(aliases.map(normalizeKey))
  const key = Object.keys(row ?? {}).find(candidate => normalizedAliases.has(normalizeKey(candidate)))
  return key === undefined ? undefined : row[key]
}

export function getField(row, ...aliases) {
  const value = getRawField(row, ...aliases)
  return value === undefined || value === null ? '' : String(value).trim()
}

export function parseNumeric(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  let normalized = String(value ?? '').trim().replace(/\s/g, '').replace(/%/g, '')
  if (!normalized) return null

  if (normalized.includes(',') && normalized.includes('.')) {
    const decimalSeparator = normalized.lastIndexOf(',') > normalized.lastIndexOf('.') ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    normalized = normalized.split(thousandsSeparator).join('').replace(decimalSeparator, '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }

  normalized = normalized.replace(/[^0-9.+-]/g, '')
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

export function getAcademicPriority(row) {
  const aliases = new Set(['Prioridad Académica', 'Prioridad Academica', 'Prioridad'].map(normalizeKey))
  const values = Object.entries(row ?? {})
    .filter(([key]) => aliases.has(normalizeKey(key)))
    .map(([, value]) => parseNumeric(value))
    .filter(value => value !== null)
  return values.length ? Math.max(...values) : null
}
