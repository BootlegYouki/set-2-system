import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('SSL:', process.env.DB_SSL);
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Current database time:', result.rows[0].current_time);
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Error detail:', err.detail);
    console.error('Full error:', err);
    return false;
  }
};

// Query function with error handling
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Get a client from the pool (for transactions)
export const getClient = async () => {
  return await pool.connect();
};

// Close the pool
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

export default pool;