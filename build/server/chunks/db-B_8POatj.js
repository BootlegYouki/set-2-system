import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "set-2-system";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
  tls: true,
  tlsAllowInvalidCertificates: false,
  connectTimeoutMS: 3e4,
  socketTimeoutMS: 3e4
});
let isConnected = false;
async function connectToDatabase() {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", uri ? "URI is set" : "URI is missing");
    console.log("Database name:", dbName);
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      throw new Error("Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://");
    }
    if (!isConnected) {
      await client.connect();
      await client.db(dbName).admin().ping();
      isConnected = true;
      console.log("Connected to MongoDB successfully and verified with ping");
    }
    const db = client.db(dbName);
    console.log("Database object created:", db ? "Success" : "Failed");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    isConnected = false;
    if (error.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR") {
      console.error("SSL/TLS error detected. This might be due to network restrictions or SSL configuration issues.");
      throw new Error("Database connection failed due to SSL/TLS error. Please check network connectivity and SSL settings.");
    }
    throw error;
  }
}

export { connectToDatabase as a, client as c };
//# sourceMappingURL=db-B_8POatj.js.map
