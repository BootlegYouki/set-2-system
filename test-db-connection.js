import { testConnection, closePool } from './src/database/db.js';

console.log('🚀 Starting database connection test...\n');

async function runTest() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('\n🎉 Database connection test PASSED!');
    } else {
      console.log('\n💥 Database connection test FAILED!');
      console.log('\n🔧 Troubleshooting tips:');
      console.log('1. Check if PostgreSQL server is running');
      console.log('2. Verify your credentials in .env file');
      console.log('3. Check if SSL is required (AWS RDS usually requires SSL)');
      console.log('4. Verify network connectivity to the database host');
      console.log('5. Check if your IP is whitelisted (for cloud databases)');
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error during test:', error);
  } finally {
    // Close the connection pool
    await closePool();
    console.log('\n👋 Test completed. Connection pool closed.');
    process.exit(0);
  }
}

runTest();