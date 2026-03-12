# Real-Time Health Telemetry API (WebSocket + MongoDB)

This project provides a Node.js backend that accepts real-time health telemetry over WebSocket, encrypts the full payload with Node.js crypto, and stores the encrypted result in MongoDB.

## Stack

- ws for WebSocket transport
- mongodb for database access
- crypto for AES-256-GCM payload encryption
- dotenv for environment configuration

## Endpoint

- Dashboard: `GET /`
- Health check: `GET /health`
- WebSocket ingest: `ws://localhost:8080/ws/telemetry`

## Telemetry Payload

```json
{
  "patientId": "patient-001",
  "heartRate": 78,
  "steps": 2345,
  "timestamp": 1741750000000
}
```

## MongoDB Target

- Connection string: `mongodb://localhost:27017/`
- Database: `healthTelemetry`
- Collection: `telemetry`

Stored document shape:

```json
{
  "patientId": "patient-001",
  "encryptedPayload": "<base64 encoded encrypted payload>",
  "receivedAt": "2026-03-12T05:00:00.000Z"
}
```

## How Encryption Works

The full JSON payload is encrypted before insert using AES-256-GCM. The stored `encryptedPayload` field is a base64-encoded string containing:

- IV
- authentication tag
- ciphertext
- algorithm metadata

## Run Instructions

1. Start MongoDB locally on `mongodb://localhost:27017/`

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
copy .env.example .env
```

4. Start the backend server:

```bash
npm start
```

5. Open the dashboard:

```text
http://localhost:8080
```

6. Optional sample client:

```bash
npm run client
```

## Server Behavior

- Validates telemetry JSON before encryption
- Logs incoming messages
- Encrypts the full payload before persistence
- Inserts encrypted documents into MongoDB
- Sends an acknowledgment after successful storage
- Returns structured errors for invalid JSON, invalid payload, database failures, and WebSocket errors

## Acknowledgment Message

```json
{
  "type": "ingest_ack",
  "status": "stored",
  "receivedAt": "2026-03-12T05:00:00.000Z"
}
```
