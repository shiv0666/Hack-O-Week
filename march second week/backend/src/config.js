import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["MONGODB_URI", "MONGODB_DB_NAME", "TELEMETRY_AES_KEY_BASE64"];

for (const envKey of requiredEnv) {
  if (!process.env[envKey]) {
    throw new Error(`Missing required environment variable: ${envKey}`);
  }
}

const encryptionKey = Buffer.from(process.env.TELEMETRY_AES_KEY_BASE64, "base64");
if (encryptionKey.length !== 32) {
  throw new Error("TELEMETRY_AES_KEY_BASE64 must decode to exactly 32 bytes for AES-256-GCM");
}

export const config = {
  port: Number(process.env.PORT || 8080),
  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB_NAME,
  mongoCollectionName: process.env.MONGODB_COLLECTION_NAME || "telemetry",
  encryptionKey
};
