import { query } from './src/database/db.js';
import fs from 'fs';

function parsePostgreSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;
  
  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // Check for dollar-quoted strings
    if (char === '$' && !inDollarQuote) {
      // Find the end of the dollar tag
      let tagEnd = i + 1;
      while (tagEnd < sql.length && sql[tagEnd] !== '$') {
        tagEnd++;
      }
      if (tagEnd < sql.length) {
        dollarTag = sql.substring(i, tagEnd + 1);
        inDollarQuote = true;
        current += sql.substring(i, tagEnd + 1);
        i = tagEnd + 1;
        continue;
      }
    } else if (inDollarQuote && char === '$') {
      // Check if this matches our opening dollar tag
      const possibleTag = sql.substring(i, i + dollarTag.length);
      if (possibleTag === dollarTag) {
        inDollarQuote = false;
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = '';
        continue;
      }
    }
    
    // Handle semicolons (only split if not in dollar-quoted string)
    if (char === ';' && !inDollarQuote) {
      current += char;
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add any remaining content
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }
  
  return statements;
}

async function applySchema() {
  try {
    // Get the SQL file from command line argument or default to database-schema.sql
    const sqlFile = process.argv[2] || './database-schema.sql';
    console.log(`🔄 Applying SQL from ${sqlFile} to your database...`);
    
    // Read the schema file
    const schema = fs.readFileSync(sqlFile, 'utf8');
    
    // Parse statements properly handling PostgreSQL functions
    const statements = parsePostgreSQLStatements(schema);
    
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
            console.log('Statement preview:', statement.substring(0, 100) + '...');
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