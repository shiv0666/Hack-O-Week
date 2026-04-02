const mongoose = require('mongoose')

const telemetrySchema = new mongoose.Schema(
  {
    heartRate: {
      type: Number,
      required: true,
      min: 0,
    },
    steps: {
      type: Number,
      required: true,
      min: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
)

module.exports = mongoose.model('Telemetry', telemetrySchema)
