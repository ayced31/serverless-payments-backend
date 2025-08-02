import { MongoClient, Db } from "mongodb";
import { Env } from "../config/env";

// variable = null, that can be Db or null
let cachedDb: Db | null = null;

export async function connectToDatabase(env: Env): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(env.DB_URI);

  try {
    await client.connect();
    console.log("MongoDB client connected successfully.");

    const db = client.db(env.DB_NAME);

    cachedDb = db;
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    // rethrow error so the calling func knows smth went wrong
    throw new Error("Could not connect to the database.");
  }
}
