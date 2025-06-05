import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Configure connection options
const connectionOptions: any = {};

// Add SSL configuration if we're not in development mode or explicitly required
if (process.env.NODE_ENV !== 'development' || process.env.POSTGRES_SSL === 'true') {
  try {
    const certPath = path.join(__dirname, '../../root.crt');
    if (fs.existsSync(certPath)) {
      connectionOptions.ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString()
      };
    } else {
      // Use default SSL settings without specific certificate
      connectionOptions.ssl = true;
    }
  } catch (error) {
    console.warn('SSL certificate not found, using default SSL configuration');
    connectionOptions.ssl = true;
  }
}

export const client = postgres(process.env.POSTGRES_URL, connectionOptions);
export const db = drizzle(client, { schema });

// Add a function to test the database connection
export async function testDatabaseConnection() {
  try {
    // Run a simple query to check the connection
    await client`SELECT 1`;
    console.log('✅ Successfully connected to the PostgreSQL database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    return false;
  }
}

// Call the function immediately if this file is being executed directly
if (require.main === module) {
  testDatabaseConnection();
}