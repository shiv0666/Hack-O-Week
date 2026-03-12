const { MongoClient } = require("mongodb");

async function initDb({ mongoUri, mongoDbName, mongoCollectionName }) {
  const client = new MongoClient(mongoUri);
  await client.connect();

  const database = client.db(mongoDbName);
  const collection = database.collection(mongoCollectionName);

  return {
    async insertEncryptedTelemetry(record) {
      const result = await collection.insertOne({
        patientId: record.patientId,
        encryptedPayload: record.encryptedPayload,
        receivedAt: record.receivedAt
      });

      return result.insertedId;
    },
    async close() {
      await client.close();
    }
  };
}

module.exports = {
  initDb
};
