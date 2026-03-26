import { MongoClient } from "mongodb";
import { config } from "./config.js";
import { logger } from "./logger.js";

let client;

export async function getTelemetryCollection() {
  if (!client) {
    client = new MongoClient(config.mongoUri, {
      maxPoolSize: 15
    });
    await client.connect();
    logger.info("MongoDB client connected", { database: config.mongoDbName });
  }

  return client.db(config.mongoDbName).collection(config.mongoCollectionName);
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
    client = undefined;
    logger.info("MongoDB client disconnected");
  }
}
