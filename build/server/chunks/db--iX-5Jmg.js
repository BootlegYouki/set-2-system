import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 3e4,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 1e4,
  acquireTimeoutMillis: 6e4,
  createTimeoutMillis: 3e4,
  destroyTimeoutMillis: 5e3,
  reapIntervalMillis: 1e3,
  createRetryIntervalMillis: 200,
  // SSL configuration for production (Heroku requires SSL)
  ssl: process.env.NODE_ENV === "production" || process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
};
const pool = new Pool(dbConfig);
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  console.error("Database config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl
  });
  process.exit(-1);
});
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("Query error:", err);
    console.error("Database connection details:", {
      host: dbConfig.host,
      database: dbConfig.database,
      ssl: dbConfig.ssl,
      nodeEnv: process.env.NODE_ENV
    });
    throw err;
  }
};
const getClient = async () => {
  return await pool.connect();
};

export { getClient as g, query as q };
//# sourceMappingURL=db--iX-5Jmg.js.map
