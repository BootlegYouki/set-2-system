import { query } from './src/database/db.js';
import fs from 'fs';

async function applySchema() {
  try {
    console.log('🔄 Applying activity logs schema to your database...');
    
    // Read the schema file
    const schema = fs.readFileSync('./database-schema.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed successfully`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} - Object already exists (skipping)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }
    
    console.log('\n🎉 Schema application completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply schema:', error.message);
    process.exit(1);
  }
}

applySchema();