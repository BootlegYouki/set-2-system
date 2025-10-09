import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'set-2-system';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: false,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
});

let isConnected = false;

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', uri ? 'URI is set' : 'URI is missing');
    console.log('Database name:', dbName);
    
    // Validate MongoDB URI format
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
    }
    
    if (!isConnected) {
      await client.connect();
      // Ping the database to verify connection
      await client.db(dbName).admin().ping();
      isConnected = true;
      console.log('Connected to MongoDB successfully and verified with ping');
    }
    
    const db = client.db(dbName);
    console.log('Database object created:', db ? 'Success' : 'Failed');
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnected = false;
    
    // Handle specific SSL errors
    if (error.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') {
      console.error('SSL/TLS error detected. This might be due to network restrictions or SSL configuration issues.');
      throw new Error('Database connection failed due to SSL/TLS error. Please check network connectivity and SSL settings.');
    }
    
    throw error;
  }
}

// Export the client for direct access if needed
export { client };