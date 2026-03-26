import { encryptTelemetryRecord } from "../cryptoUtils.js";
import { logger } from "../logger.js";

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSyntheticTelemetryRecords() {
  const records = [];
  const now = new Date();
  const days = randomInt(7, 10);

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const recordsPerDay = randomInt(3, 5);

    for (let recIndex = 0; recIndex < recordsPerDay; recIndex += 1) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - dayIndex);
      dayDate.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59), 0);

      const telemetry = {
        patientId: "patient-001",
        heartRate: randomInt(60, 100),
        steps: randomInt(100, 1000),
        timestamp: dayDate.toISOString()
      };

      const encrypted = encryptTelemetryRecord(telemetry);
      records.push({
        ...encrypted,
        synthetic: true,
        createdAt: new Date().toISOString()
      });
    }
  }

  return records;
}

export async function ensureSyntheticTelemetryData(collection, options = {}) {
  const force = Boolean(options.force);
  const existingCount = await collection.estimatedDocumentCount();
  const existingSyntheticCount = await collection.countDocuments({ synthetic: true });

  if (!force && existingCount > 0) {
    logger.info("Telemetry collection already has records", { existingCount });
    return { insertedCount: 0, existingCount, existingSyntheticCount };
  }

  if (force && existingSyntheticCount > 0) {
    logger.info("Synthetic telemetry already exists, skipping forced seed", {
      existingSyntheticCount
    });
    return { insertedCount: 0, existingCount, existingSyntheticCount };
  }

  const syntheticRecords = buildSyntheticTelemetryRecords();
  const insertResult = await collection.insertMany(syntheticRecords);

  logger.info("Inserted encrypted synthetic telemetry records", {
    insertedCount: insertResult.insertedCount,
    patientId: "patient-001"
  });

  return {
    insertedCount: insertResult.insertedCount,
    existingCount,
    existingSyntheticCount
  };
}
