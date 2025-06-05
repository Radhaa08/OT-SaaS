import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  driver: 'pg',  // Change from 'postgres' to 'pg'
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL || '',
  },
} satisfies Config;