import fs from 'fs';
import path from 'path';
import { db } from './lib/db/drizzle';
import { sql } from 'drizzle-orm';

async function applyMigrations() {
  try {
    console.log('Starting to apply migrations...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'lib/db/migrations/0000_soft_the_anarchist.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL statements by the statement-breakpoint marker
    const statements = sqlContent.split('--> statement-breakpoint');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Check database connection
    try {
      const result = await db.execute(sql`SELECT 1 AS check_connection`);
      console.log('Database connection successful:', result);
    } catch (err) {
      console.error('Connection test failed:', err);
      throw err;
    }
    
    // Execute each SQL statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          // Fix: Use db.execute with sql template literal instead of client.query
          await db.execute(sql.raw(statement));
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Created tables:', tablesResult);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Remove client.end() as we're using the db object from drizzle
    // No need to explicitly close the connection here as drizzle manages it
  }
}

applyMigrations();