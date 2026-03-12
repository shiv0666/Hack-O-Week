function validateTelemetryMessage(raw) {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, reason: "Payload must be a JSON object" };
  }

  const { patientId, timestamp, heartRate, steps } = raw;

  if (typeof patientId !== "string" || patientId.trim().length === 0) {
    return { valid: false, reason: "patientId must be a non-empty string" };
  }

  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return { valid: false, reason: "timestamp must be a unix epoch number (ms)" };
  }

  if (!Number.isInteger(heartRate) || heartRate <= 0 || heartRate > 300) {
    return { valid: false, reason: "heartRate must be an integer between 1 and 300" };
  }

  if (!Number.isInteger(steps) || steps < 0) {
    return { valid: false, reason: "steps must be an integer >= 0" };
  }

  return { valid: true };
}

module.exports = {
  validateTelemetryMessage
};
