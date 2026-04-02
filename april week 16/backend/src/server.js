require('dotenv').config()

const http = require('http')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { WebSocketServer } = require('ws')
const Telemetry = require('./models/Telemetry')
const Alert = require('./models/Alert')

const PORT = Number(process.env.PORT || 8080)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/health_alert_system'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const SIMULATION_ENABLED = String(process.env.SIMULATION_ENABLED || 'true') === 'true'
const SIMULATION_INTERVAL_MS = Number(process.env.SIMULATION_INTERVAL_MS || 2000)
const ALERT_THRESHOLD = 120

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ noServer: true })

app.use(cors({ origin: FRONTEND_ORIGIN }))
app.use(express.json())

const wsClients = new Set()

const formatTimestamp = (input) => {
  const date = input ? new Date(input) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const toTelemetryPayload = (payload = {}) => {
  return {
    heartRate: Number(payload.heartRate || 0),
    steps: Number(payload.steps || 0),
    timestamp: formatTimestamp(payload.timestamp),
  }
}

const broadcast = (payload) => {
  const encoded = JSON.stringify(payload)
  for (const client of wsClients) {
    if (client.readyState === client.OPEN) {
      client.send(encoded)
    }
  }
}

const persistAlert = async (message, value, timestamp) => {
  const alert = await Alert.create({ message, value, timestamp })
  const output = {
    type: 'alert',
    message: alert.message,
    value: alert.value,
    timestamp: alert.timestamp.toISOString(),
  }

  broadcast(output)
  return output
}

const handleTelemetryPacket = async (rawPacket) => {
  const packet = toTelemetryPayload(rawPacket)

  const telemetryDoc = await Telemetry.create({
    heartRate: packet.heartRate,
    steps: packet.steps,
    timestamp: packet.timestamp,
  })

  const telemetryPayload = {
    heartRate: telemetryDoc.heartRate,
    steps: telemetryDoc.steps,
    timestamp: telemetryDoc.timestamp.toISOString(),
  }

  broadcast(telemetryPayload)

  if (telemetryPayload.heartRate > ALERT_THRESHOLD) {
    await persistAlert('High Heart Rate Detected', `${telemetryPayload.heartRate} BPM`, telemetryPayload.timestamp)
  }

  return telemetryPayload
}

app.get('/api/health', async (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1
  res.json({
    status: 'ok',
    dbConnected,
    wsClients: wsClients.size,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/telemetry/recent', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 30), 200)
  const records = await Telemetry.find().sort({ timestamp: -1 }).limit(limit).lean()
  res.json(records)
})

app.get('/api/alerts/recent', async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200)
  const records = await Alert.find().sort({ timestamp: -1 }).limit(limit).lean()
  res.json(records)
})

app.post('/api/telemetry', async (req, res) => {
  const payload = await handleTelemetryPacket(req.body)
  res.status(201).json(payload)
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

wss.on('connection', async (socket) => {
  wsClients.add(socket)

  socket.send(
    JSON.stringify({
      type: 'system',
      message: 'WebSocket connected',
      timestamp: new Date().toISOString(),
    })
  )

  socket.on('message', async (raw) => {
    try {
      const incoming = JSON.parse(raw.toString())

      if (incoming.type === 'alert') {
        await persistAlert(
          incoming.message || 'Custom Alert',
          incoming.value || 'N/A',
          incoming.timestamp
        )
        return
      }

      await handleTelemetryPacket(incoming)
    } catch (error) {
      socket.send(
        JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString(),
        })
      )
      console.error('WebSocket message error:', error.message)
    }
  })

  socket.on('close', () => {
    wsClients.delete(socket)
  })

  socket.on('error', () => {
    wsClients.delete(socket)
  })
})

server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/ws/telemetry') {
    socket.destroy()
    return
  }

  wss.handleUpgrade(request, socket, head, (client) => {
    wss.emit('connection', client, request)
  })
})

const createSimulator = () => {
  if (!SIMULATION_ENABLED) {
    return { start: () => {}, stop: () => {} }
  }

  let timer = null
  let simulatedSteps = 500

  const run = async () => {
    const baseline = 76 + Math.floor(Math.random() * 18)
    const spike = Math.random() > 0.85 ? 35 : 0
    const heartRate = baseline + spike
    simulatedSteps += 4 + Math.floor(Math.random() * 22)

    try {
      await handleTelemetryPacket({ heartRate, steps: simulatedSteps, timestamp: new Date().toISOString() })
    } catch (error) {
      console.error('Simulation packet failed:', error.message)
    }
  }

  return {
    start: () => {
      timer = setInterval(run, SIMULATION_INTERVAL_MS)
    },
    stop: () => {
      if (timer) {
        clearInterval(timer)
      }
    },
  }
}

const start = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected')

    server.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`)
      console.log(`WebSocket endpoint ws://localhost:${PORT}/ws/telemetry`)
    })

    createSimulator().start()
  } catch (error) {
    console.error('Failed to start backend:', error.message)
    process.exit(1)
  }
}

start()
