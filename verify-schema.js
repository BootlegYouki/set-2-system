import { query } from './src/database/db.js';

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');
    
    // Check if activity_logs table exists
    const tableCheck = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'activity_logs%'
      ORDER BY table_name
    `);
    
    console.log('📋 Activity logs tables:');
    if (tableCheck.rows.length === 0) {
      console.log('  ❌ No activity_logs tables found');
    } else {
      tableCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name} (${row.table_type})`);
      });
    }
    
    // Check if functions exist
    const functionCheck = await query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('log_activity', 'create_monthly_partition')
    `);
    
    console.log('\n🔧 Functions:');
    if (functionCheck.rows.length === 0) {
      console.log('  ❌ No activity logging functions found');
    } else {
      functionCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.routine_name}() (${row.routine_type})`);
      });
    }
    
    // Check indexes
    const indexCheck = await query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'activity_logs%'
    `);
    
    console.log('\n📊 Indexes:');
    if (indexCheck.rows.length === 0) {
      console.log('  ❌ No activity_logs indexes found');
    } else {
      indexCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.indexname} on ${row.tablename}`);
      });
    }
    
    // Test the log_activity function
    console.log('\n🧪 Testing log_activity function...');
    try {
      await query('SELECT create_monthly_partition($1)', ['2025-01']);
      console.log('  ✅ Monthly partition function works');
      
      const testResult = await query(
        'SELECT log_activity($1, $2, $3, $4, $5, $6)',
        [
          'test_activity',
          null,
          null,
          JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
          '127.0.0.1',
          'Test Browser'
        ]
      );
      console.log('  ✅ Activity logging function works');
      
      // Check if the test activity was logged
      const logCheck = await query(`
        SELECT activity_type, data, created_at 
        FROM activity_logs 
        WHERE activity_type = 'test_activity' 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (logCheck.rows.length > 0) {
        console.log('  ✅ Test activity successfully logged');
        console.log(`    Data: ${JSON.stringify(logCheck.rows[0].data)}`);
      }
      
    } catch (funcError) {
      console.log('  ❌ Function test failed:', funcError.message);
    }
    
    console.log('\n🎉 Database schema verification completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

verifySchema();