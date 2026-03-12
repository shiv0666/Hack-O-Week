const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const { port, mongoUri, mongoDbName, mongoCollectionName, encryptionKey } = require("./config");
const { initDb } = require("./db");
const { encryptJson } = require("./crypto");
const { validateTelemetryMessage } = require("./validation");

async function start() {
  const db = await initDb({ mongoUri, mongoDbName, mongoCollectionName });
  const publicDir = path.resolve(process.cwd(), "public");

  function sendFile(res, filePath, contentType) {
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File not found" }));
    }
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/") {
      sendFile(res, path.join(publicDir, "index.html"), "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url.pathname === "/styles.css") {
      sendFile(res, path.join(publicDir, "styles.css"), "text/css; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url.pathname === "/app.js") {
      sendFile(res, path.join(publicDir, "app.js"), "application/javascript; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  const wss = new WebSocket.Server({ noServer: true });

  server.on("error", (err) => {
    console.error("HTTP server error:", err.message);
    process.exit(1);
  });

  wss.on("error", (err) => {
    console.error("WebSocket server error:", err.message);
  });

  server.on("upgrade", (request, socket, head) => {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (requestUrl.pathname !== "/ws/telemetry") {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.send(JSON.stringify({ type: "connection_ack", message: "Connected to telemetry stream" }));

    ws.on("message", async (messageBuffer) => {
      const raw = messageBuffer.toString("utf8");
      console.log("Incoming telemetry message:", raw);

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON payload" }));
        return;
      }

      const validation = validateTelemetryMessage(payload);
      if (!validation.valid) {
        ws.send(JSON.stringify({ type: "error", message: validation.reason }));
        return;
      }

      try {
        const encryptedPayload = encryptJson(payload, encryptionKey);
        const receivedAt = new Date();
        const id = await db.insertEncryptedTelemetry({
          patientId: payload.patientId,
          encryptedPayload,
          receivedAt
        });

        console.log(`Encrypted telemetry stored for ${payload.patientId} with id ${id}`);

        ws.send(
          JSON.stringify({
            type: "ingest_ack",
            status: "stored",
            receivedAt: receivedAt.toISOString()
          })
        );
      } catch (err) {
        console.error("Database insert failed:", err.message);
        ws.send(JSON.stringify({ type: "error", message: "Database insert failed" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      console.error("WebSocket connection error:", err.message);
    });
  });

  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`WebSocket endpoint: ws://localhost:${port}/ws/telemetry`);
    console.log(`MongoDB: ${mongoUri}${mongoDbName}.${mongoCollectionName}`);
  });

  function shutdown() {
    db.close()
      .catch((err) => {
        console.error("MongoDB close error:", err.message);
      })
      .finally(() => {
        server.close(() => process.exit(0));
      });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
