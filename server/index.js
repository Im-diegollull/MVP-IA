import express from 'express'
import { databaseEnabled, ensureSchema, pool, withTransaction } from './db.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json({ limit: '2mb' }))

function requireDatabase(req, res, next) {
  if (!databaseEnabled) return res.status(503).json({ error: 'Persistencia deshabilitada: falta DATABASE_URL' })
  next()
}

function validateRun(body) {
  if (!body || typeof body !== 'object') return 'El cuerpo de la solicitud es inválido'
  if (!String(body.fileName || '').trim()) return 'fileName es obligatorio'
  if (!Number.isInteger(body.totalRequests) || body.totalRequests < 0) return 'totalRequests debe ser un entero no negativo'
  if (!Number.isInteger(body.kpi2) || !Number.isInteger(body.kpi3)) return 'kpi2 y kpi3 deben ser enteros'
  if (!body.summaries || typeof body.summaries !== 'object') return 'summaries es obligatorio'
  if (body.decisions && !Array.isArray(body.decisions)) return 'decisions debe ser un arreglo'
  return null
}

app.get('/api/health', async (req, res) => {
  if (!databaseEnabled) return res.json({ ok: true, persistence: false })
  try {
    await ensureSchema()
    await pool.query('SELECT 1')
    res.json({ ok: true, persistence: true })
  } catch (error) {
    res.status(503).json({ ok: false, persistence: false })
  }
})

app.post('/api/runs', requireDatabase, async (req, res, next) => {
  const validationError = validateRun(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const run = await withTransaction(async client => {
      const inserted = await client.query(
        `INSERT INTO analysis_runs (file_name, total_requests, kpi1, kpi2, kpi3, has_estado)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, created_at`,
        [req.body.fileName, req.body.totalRequests, req.body.kpi1, req.body.kpi2, req.body.kpi3, Boolean(req.body.hasEstado)],
      )
      const runId = inserted.rows[0].id
      const summaries = req.body.summaries

      await client.query(
        `INSERT INTO analysis_results (run_id, module1, module2, module3)
         VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)`,
        [runId, JSON.stringify(summaries.module1 || {}), JSON.stringify(summaries.module2 || {}), JSON.stringify(summaries.module3 || {})],
      )

      for (const decision of req.body.decisions || []) {
        if (!decision.module || !decision.subjectId || !decision.decision) continue
        await client.query(
          `INSERT INTO analysis_decisions (run_id, module, subject_id, decision, metadata)
           VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [runId, decision.module, decision.subjectId, decision.decision, JSON.stringify(decision.metadata || {})],
        )
      }

      return inserted.rows[0]
    })
    res.status(201).json(run)
  } catch (error) {
    next(error)
  }
})

app.get('/api/runs', requireDatabase, async (req, res, next) => {
  try {
    await ensureSchema()
    const result = await pool.query(
      `SELECT id, created_at, file_name, total_requests, kpi1, kpi2, kpi3, has_estado
       FROM analysis_runs ORDER BY created_at DESC LIMIT 50`,
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

app.get('/api/runs/:id', requireDatabase, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'ID inválido' })
  try {
    await ensureSchema()
    const result = await pool.query(
      `SELECT r.id, r.created_at, r.file_name, r.total_requests, r.kpi1, r.kpi2, r.kpi3, r.has_estado,
              jsonb_build_object('module1', ar.module1, 'module2', ar.module2, 'module3', ar.module3) AS summaries,
              COALESCE(jsonb_agg(jsonb_build_object(
                'module', d.module, 'subjectId', d.subject_id, 'decision', d.decision, 'metadata', d.metadata
              )) FILTER (WHERE d.id IS NOT NULL), '[]'::jsonb) AS decisions
       FROM analysis_runs r
       JOIN analysis_results ar ON ar.run_id = r.id
       LEFT JOIN analysis_decisions d ON d.run_id = r.id
       WHERE r.id = $1
       GROUP BY r.id, ar.id`,
      [req.params.id],
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Ejecución no encontrada' })
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: 'No fue posible completar la operación' })
})

app.listen(port, () => {
  console.log(`API escuchando en puerto ${port} (${databaseEnabled ? 'con' : 'sin'} persistencia)`)
})
