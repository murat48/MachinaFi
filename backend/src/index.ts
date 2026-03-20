import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config";
import apiRoutes from "./routes/api";
import serviceRoutes from "./routes/services";
import paymentRoutes from "./routes/payments";
import { onActivity } from "./services/store";
import { refreshPendingPayments } from "./services/payment";

const app = express();
const server = http.createServer(app);

// WebSocket server for live activity feed
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", apiRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/payments", paymentRoutes);

// Broadcast activity events to all connected WebSocket clients
onActivity((activity) => {
  const message = JSON.stringify({ type: "activity", data: activity });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "connected", message: "Connected to MachineNet live feed" }));
});

server.listen(config.port, () => {
  // Poll pending payments every 30 seconds and promote to verified/failed
  setInterval(() => { refreshPendingPayments().catch(() => {}); }, 30_000);

  console.log(`
╔══════════════════════════════════════════════════╗
║     MachineNet - IoT Machine Economy Server      ║
║══════════════════════════════════════════════════║
║  API:        http://localhost:${config.port}              ║
║  WebSocket:  ws://localhost:${config.port}/ws              ║
║  Network:    ${config.stacks.network.padEnd(35)}║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
