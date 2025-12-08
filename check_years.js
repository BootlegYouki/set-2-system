
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Navigate up to root (from src/scripts to root) - assuming we run from root?
// Let's just assume .env is in root.
dotenv.config({ path: path.resolve('./.env') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'set-2-system';

async function checkYears() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const sections = db.collection('sections');

    const pipeline = [
      {
        $group: {
          _id: "$school_year",
          count: { $sum: 1 }
        }
      }
    ];

    const results = await sections.aggregate(pipeline).toArray();
    console.log("School Year Counts in Sections:");
    console.table(results);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkYears();
