import express from "express";
import { getTelemetryCollection } from "../db.js";
import { decryptTelemetryRecord } from "../cryptoUtils.js";
import { logger } from "../logger.js";
import { ensureSyntheticTelemetryData } from "../services/syntheticTelemetry.js";

const router = express.Router();

function formatDateKey(inputTimestamp) {
  const date = new Date(inputTimestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseDateBound(input, type) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return { error: `${type} must be a valid date` };
  }
  return { value: date };
}

function recordMatchesFilters(record, filters) {
  if (filters.patientId && String(record.patientId) !== filters.patientId) {
    return false;
  }

  const recordDate = new Date(record.timestamp);
  if (Number.isNaN(recordDate.getTime())) {
    return false;
  }

  if (filters.startDate && recordDate < filters.startDate) {
    return false;
  }

  if (filters.endDate && recordDate > filters.endDate) {
    return false;
  }

  return true;
}

async function aggregateDailyTelemetry(collection, filters) {
  let processedCount = 0;
  let matchedCount = 0;
  let decryptedCount = 0;
  let skippedCount = 0;
  const dailyMap = new Map();

  const cursor = collection.find(
    {},
    {
      projection: {
        payload: 1,
        iv: 1,
        authTag: 1,
        ciphertext: 1,
        encryptedData: 1,
        nonce: 1,
        tag: 1,
        data: 1
      }
    }
  );

  for await (const encryptedDoc of cursor) {
    processedCount += 1;

    try {
      const record = decryptTelemetryRecord(encryptedDoc);
      decryptedCount += 1;

      if (!recordMatchesFilters(record, filters)) {
        continue;
      }

      matchedCount += 1;
      const dayKey = formatDateKey(record.timestamp);

      if (!dayKey || Number.isNaN(record.heartRate) || Number.isNaN(record.steps)) {
        skippedCount += 1;
        continue;
      }

      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          heartRateSum: 0,
          heartRateCount: 0,
          totalSteps: 0
        });
      }

      const dayStats = dailyMap.get(dayKey);
      dayStats.heartRateSum += record.heartRate;
      dayStats.heartRateCount += 1;
      dayStats.totalSteps += record.steps;
    } catch (decryptError) {
      skippedCount += 1;
      logger.warn("Skipped one telemetry document due to decrypt/parse failure", {
        reason: decryptError.message
      });
    }
  }

  const data = [...dailyMap.entries()]
    .map(([date, stats]) => ({
      date,
      avgHeartRate: Math.round(stats.heartRateSum / stats.heartRateCount),
      totalSteps: stats.totalSteps
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    data,
    processedCount,
    matchedCount,
    decryptedCount,
    skippedCount
  };
}

router.get("/daily", async (req, res) => {
  const startedAt = Date.now();
  let processedCount = 0;
  let matchedCount = 0;
  let decryptedCount = 0;
  let skippedCount = 0;

  const patientId = req.query.patientId ? String(req.query.patientId).trim() : "";
  const startDateParse = parseDateBound(req.query.startDate, "startDate");
  const endDateParse = parseDateBound(req.query.endDate, "endDate");

  if (startDateParse?.error || endDateParse?.error) {
    return res.status(400).json({
      error: startDateParse?.error || endDateParse?.error
    });
  }

  const startDate = startDateParse?.value || null;
  const endDate = endDateParse?.value || null;

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({
      error: "startDate cannot be after endDate"
    });
  }

  try {
    const collection = await getTelemetryCollection();
    await ensureSyntheticTelemetryData(collection);
    let result = await aggregateDailyTelemetry(collection, { patientId, startDate, endDate });

    if (result.data.length === 0 && (!patientId || patientId === "patient-001")) {
      logger.info("No matching telemetry data found, forcing synthetic seed", {
        patientIdFilter: patientId || null
      });
      await ensureSyntheticTelemetryData(collection, { force: true });
      result = await aggregateDailyTelemetry(collection, { patientId, startDate, endDate });
    }

    processedCount = result.processedCount;
    matchedCount = result.matchedCount;
    decryptedCount = result.decryptedCount;
    skippedCount = result.skippedCount;

    logger.info("Telemetry documents fetched", {
      fetchedCount: processedCount
    });

    logger.info("Telemetry decryption pass completed", {
      decryptedCount,
      decryptFailures: skippedCount
    });

    logger.info("Computed daily telemetry aggregation", {
      processedCount,
      decryptedCount,
      matchedCount,
      skippedCount,
      days: result.data.length,
      hasPatientFilter: Boolean(patientId),
      hasStartDateFilter: Boolean(startDate),
      hasEndDateFilter: Boolean(endDate),
      durationMs: Date.now() - startedAt
    });

    return res.status(200).json({ data: result.data });
  } catch (error) {
    logger.error("Failed to aggregate telemetry daily data", {
      message: error.message,
      processedCount,
      decryptedCount,
      matchedCount,
      skippedCount
    });
    return res.status(500).json({ error: "Failed to fetch daily telemetry data" });
  }
});

export default router;
