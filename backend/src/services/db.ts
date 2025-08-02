import { MongoClient, Db } from "mongodb";
import { Env } from "../config/env";

interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: DatabaseConnection | null = null;

export async function connectToDatabase(env: Env): Promise<DatabaseConnection> {
  if (cachedConnection) return cachedConnection;

  const client = new MongoClient(env.DB_URI);

  try {
    await client.connect();
    console.log("MongoDB client connected successfully.");

    const db = client.db(env.DB_NAME);

    cachedConnection = { client, db };
    return cachedConnection;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    // rethrow error so the calling func knows smth went wrong
    throw new Error("Could not connect to the database.");
  }
}
