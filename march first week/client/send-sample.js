const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8080/ws/telemetry");

ws.on("open", () => {
  console.log("Connected, sending sample telemetry every second...");

  let steps = 1200;

  const timer = setInterval(() => {
    steps += Math.floor(Math.random() * 4);

    const sample = {
      patientId: "patient-001",
      timestamp: Date.now(),
      heartRate: 65 + Math.floor(Math.random() * 35),
      steps
    };

    ws.send(JSON.stringify(sample));
  }, 1000);

  ws.on("close", () => clearInterval(timer));
});

ws.on("message", (data) => {
  console.log("Server:", data.toString());
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err.message);
});
