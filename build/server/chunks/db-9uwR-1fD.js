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
  }
});
let isConnected = false;
async function connectToDatabase() {
  try {
    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", uri ? "URI is set" : "URI is missing");
    console.log("Database name:", dbName);
    if (!isConnected) {
      await client.connect();
      isConnected = true;
      console.log("Connected to MongoDB successfully");
    }
    const db = client.db(dbName);
    console.log("Database object created:", db ? "Success" : "Failed");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}

export { connectToDatabase as a, client as c };
//# sourceMappingURL=db-9uwR-1fD.js.map
