import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

export const databaseEnabled = Boolean(connectionString)

export const pool = databaseEnabled
  ? new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    })
  : null

let schemaPromise

export function ensureSchema() {
  if (!databaseEnabled) return Promise.resolve()
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS analysis_runs (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        file_name TEXT NOT NULL,
        total_requests INTEGER NOT NULL,
        kpi1 NUMERIC(5, 2),
        kpi2 INTEGER NOT NULL,
        kpi3 INTEGER NOT NULL,
        has_estado BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS analysis_results (
        id BIGSERIAL PRIMARY KEY,
        run_id BIGINT NOT NULL UNIQUE REFERENCES analysis_runs(id) ON DELETE CASCADE,
        module1 JSONB NOT NULL DEFAULT '{}'::jsonb,
        module2 JSONB NOT NULL DEFAULT '{}'::jsonb,
        module3 JSONB NOT NULL DEFAULT '{}'::jsonb
      );

      CREATE TABLE IF NOT EXISTS analysis_decisions (
        id BIGSERIAL PRIMARY KEY,
        run_id BIGINT NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
        module TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        decision TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_analysis_decisions_run_id ON analysis_decisions(run_id);
    `)
  }
  return schemaPromise
}

export async function withTransaction(callback) {
  await ensureSchema()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
