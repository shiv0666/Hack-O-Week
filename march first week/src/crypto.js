const crypto = require("crypto");

const ALGO = "aes-256-gcm";
const IV_SIZE = 12;

function encryptJson(payload, key) {
  const iv = crypto.randomBytes(IV_SIZE);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.from(
    JSON.stringify({
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      content: encrypted.toString("base64"),
      algorithm: ALGO
    }),
    "utf8"
  ).toString("base64");
}

module.exports = {
  encryptJson
};
