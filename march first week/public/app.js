const wsUrlInput = document.getElementById("wsUrl");
const patientIdInput = document.getElementById("patientId");
const sendEveryInput = document.getElementById("sendEvery");

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const startStreamBtn = document.getElementById("startStreamBtn");
const stopStreamBtn = document.getElementById("stopStreamBtn");
const sendOneBtn = document.getElementById("sendOneBtn");
const clearLogBtn = document.getElementById("clearLogBtn");

const connectionStatus = document.getElementById("connectionStatus");
const logEl = document.getElementById("log");

let socket = null;
let streamTimer = null;
let steps = 1000;

function nowIso() {
  return new Date().toISOString();
}

function log(kind, message) {
  logEl.textContent += `[${nowIso()}] ${kind}: ${message}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(text, isConnected) {
  connectionStatus.textContent = text;
  connectionStatus.classList.toggle("connected", isConnected);
  connectionStatus.classList.toggle("disconnected", !isConnected);
}

function setControlState(connected) {
  connectBtn.disabled = connected;
  disconnectBtn.disabled = !connected;
  startStreamBtn.disabled = !connected;
  stopStreamBtn.disabled = !connected;
  sendOneBtn.disabled = !connected;
}

function buildPayload() {
  steps += Math.floor(Math.random() * 5);

  return {
    patientId: patientIdInput.value.trim() || "patient-001",
    timestamp: Date.now(),
    heartRate: 64 + Math.floor(Math.random() * 38),
    steps
  };
}

function sendOne() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    log("WARN", "Cannot send payload because socket is not open");
    return;
  }

  const payload = buildPayload();
  socket.send(JSON.stringify(payload));
  log("SEND", JSON.stringify(payload));
}

function stopStream() {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
    log("INFO", "Auto stream stopped");
  }
}

connectBtn.addEventListener("click", () => {
  const url = wsUrlInput.value.trim();
  if (!url) {
    log("ERROR", "WebSocket URL is required");
    return;
  }

  socket = new WebSocket(url);
  setStatus("Connecting...", false);
  log("INFO", `Connecting to ${url}`);

  socket.addEventListener("open", () => {
    setStatus("Connected", true);
    setControlState(true);
    log("INFO", "WebSocket connected");
  });

  socket.addEventListener("message", (event) => {
    log("RECV", event.data);
  });

  socket.addEventListener("close", () => {
    stopStream();
    setStatus("Disconnected", false);
    setControlState(false);
    log("INFO", "WebSocket disconnected");
  });

  socket.addEventListener("error", () => {
    log("ERROR", "WebSocket error occurred");
  });
});

disconnectBtn.addEventListener("click", () => {
  stopStream();
  if (socket) {
    socket.close();
  }
});

startStreamBtn.addEventListener("click", () => {
  stopStream();

  const every = Number(sendEveryInput.value);
  if (!Number.isInteger(every) || every < 300) {
    log("ERROR", "Send interval must be an integer >= 300ms");
    return;
  }

  sendOne();
  streamTimer = setInterval(sendOne, every);
  log("INFO", `Auto stream started (${every}ms)`);
});

stopStreamBtn.addEventListener("click", stopStream);
sendOneBtn.addEventListener("click", sendOne);

clearLogBtn.addEventListener("click", () => {
  logEl.textContent = "";
});

setStatus("Disconnected", false);
setControlState(false);
log("INFO", "Open connection to begin telemetry stream");
