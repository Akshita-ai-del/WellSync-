/**
 * PostgreSQL + TimescaleDB Database Configuration
 */
export const DB_CONFIG = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: Number(import.meta.env.VITE_DB_PORT) || 5432,
  database: import.meta.env.VITE_DB_NAME || 'wellsync_db',
  user: import.meta.env.VITE_DB_USER || 'postgres',
};
