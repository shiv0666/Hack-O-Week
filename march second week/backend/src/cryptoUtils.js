import crypto from "crypto";
import { config } from "./config.js";

function parseBuffer(value, encoding = "base64") {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === "string") return Buffer.from(value, encoding);
  return null;
}

function resolveEncryptedFields(record) {
  // Supports common storage layouts for AES-256-GCM payloads.
  const payloadContainer = record.payload && typeof record.payload === "object" ? record.payload : record;

  const iv =
    parseBuffer(payloadContainer.iv, "base64") ||
    parseBuffer(payloadContainer.nonce, "base64") ||
    parseBuffer(record.iv, "base64");

  const authTag =
    parseBuffer(payloadContainer.authTag, "base64") ||
    parseBuffer(payloadContainer.tag, "base64") ||
    parseBuffer(record.authTag, "base64");

  const ciphertext =
    parseBuffer(payloadContainer.ciphertext, "base64") ||
    parseBuffer(payloadContainer.encryptedData, "base64") ||
    parseBuffer(payloadContainer.data, "base64") ||
    parseBuffer(record.ciphertext, "base64") ||
    parseBuffer(record.encryptedData, "base64");

  if (!iv || !authTag || !ciphertext) {
    throw new Error("Encrypted payload missing iv/authTag/ciphertext");
  }

  return { iv, authTag, ciphertext };
}

export function decryptTelemetryRecord(record) {
  const { iv, authTag, ciphertext } = resolveEncryptedFields(record);
  const decipher = crypto.createDecipheriv("aes-256-gcm", config.encryptionKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  const parsed = JSON.parse(decrypted);

  return {
    patientId: parsed.patientId,
    heartRate: Number(parsed.heartRate),
    steps: Number(parsed.steps),
    timestamp: parsed.timestamp
  };
}

export function encryptTelemetryRecord(record) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", config.encryptionKey, iv);
  const plaintext = JSON.stringify(record);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    payload: {
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: ciphertext.toString("base64")
    }
  };
}
