import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { ExtendedWebSocket } from "./types";
import { handleDeviceConnection } from "./deviceSocket";
import { handleDashboardConnection } from "./dashboardSocket";
import { connectionManager } from "./manager";

let wss: WebSocketServer | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

export function initializeWebSocketServer(server: HTTPServer) {
  // Prevent multiple initializations in dev mode
  if (wss) {
    console.log("[WebSocket] Server already initialized");
    return wss;
  }

  wss = new WebSocketServer({ server });

  console.log("[WebSocket] Server initialized");

  // Handle new connections
  wss.on("connection", (ws: WebSocket, req) => {
    const extWs = ws as ExtendedWebSocket;
    const url = req.url || "";

    console.log(`[WebSocket] New connection: ${url}`);

    // Route based on path
    if (url.includes("/ws/device")) {
      handleDeviceConnection(extWs, req);
    } else if (url.includes("/ws/dashboard")) {
      handleDashboardConnection(extWs, req);
    } else {
      console.log("[WebSocket] Unknown path, closing");
      ws.close(4000, "Unknown WebSocket path");
    }
  });

  // Heartbeat mechanism (ping every 25 seconds)
  heartbeatInterval = setInterval(() => {
    const devices = connectionManager.getAllDevices();
    const dashboards = connectionManager.getAllDashboards();

    devices.forEach((device) => {
      if (!device.socket.isAlive) {
        console.log(`[Heartbeat] Device ${device.id} timeout`);
        device.socket.terminate();
        connectionManager.removeDevice(device.id);
        return;
      }
      device.socket.isAlive = false;
      device.socket.ping();
    });

    dashboards.forEach((dashboard) => {
      if (!dashboard.socket.isAlive) {
        console.log(`[Heartbeat] Dashboard ${dashboard.userId} timeout`);
        dashboard.socket.terminate();
        connectionManager.removeDashboard(dashboard.userId);
        return;
      }
      dashboard.socket.isAlive = false;
      dashboard.socket.ping();
    });
  }, 25000);

  wss.on("error", (error) => {
    console.error("[WebSocket] Server error:", error);
  });

  return wss;
}

export function closeWebSocketServer() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (wss) {
    wss.close(() => {
      console.log("[WebSocket] Server closed");
    });
    wss = null;
  }
}

// Export helpers for API routes
export function sendToAllDashboards(message: any) {
  return connectionManager.broadcastTelemetry(message);
}

export function sendToAllDevices(message: any) {
  return connectionManager.forwardCommand(message);
}

export function getConnectionStats() {
  return connectionManager.getStats();
}
