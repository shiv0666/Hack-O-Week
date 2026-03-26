import cors from "cors";
import express from "express";
import { config } from "./config.js";
import telemetryRouter from "./routes/telemetry.js";
import { closeMongoConnection } from "./db.js";
import { logger } from "./logger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/telemetry", telemetryRouter);

app.use((err, _req, res, _next) => {
  logger.error("Unhandled express error", { message: err.message });
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(config.port, () => {
  logger.info("Telemetry API server started", { port: config.port });
});

async function shutdown() {
  logger.info("Shutting down server");
  server.close(async () => {
    await closeMongoConnection();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
