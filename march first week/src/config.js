const dotenv = require("dotenv");

dotenv.config();

function readPort() {
  const raw = process.env.PORT || "8080";
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("Invalid PORT in environment");
  }
  return port;
}

function readMongoUri() {
  return process.env.MONGO_URI || "mongodb://localhost:27017/";
}

function readMongoDbName() {
  return process.env.MONGO_DB_NAME || "healthTelemetry";
}

function readMongoCollectionName() {
  return process.env.MONGO_COLLECTION_NAME || "telemetry";
}

function readEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY is required in environment");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string");
  }

  return Buffer.from(keyHex, "hex");
}

module.exports = {
  port: readPort(),
  mongoUri: readMongoUri(),
  mongoDbName: readMongoDbName(),
  mongoCollectionName: readMongoCollectionName(),
  encryptionKey: readEncryptionKey()
};
