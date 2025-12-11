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

  // Create WebSocket server without attaching to HTTP server yet
  wss = new WebSocketServer({ noServer: true });

  console.log("[WebSocket] Server initialized");

  // Manually handle upgrade requests to filter paths
  server.on("upgrade", (request, socket, head) => {
    const url = request.url || "";

    // Only handle our custom WebSocket paths - ignore everything else (including Next.js HMR)
    if (url.includes("/ws/device") || url.includes("/ws/dashboard")) {
      console.log(`[WebSocket] Handling upgrade for: ${url}`);
      wss!.handleUpgrade(request, socket, head, (ws) => {
        wss!.emit("connection", ws, request);
      });
    }
    // For all other paths (including /_next/webpack-hmr), do nothing and let Next.js handle them
  });

  // Handle new connections
  wss.on("connection", (ws: WebSocket, req) => {
    const extWs = ws as ExtendedWebSocket;
    const url = req.url || "";

    console.log(`[WebSocket] New connection established: ${url}`);

    // Add error handler immediately to catch any connection issues
    ws.on("error", (error: any) => {
      console.error("[WebSocket] Connection error:", error.message);
      try {
        if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
          ws.terminate();
        }
      } catch (e) {
        // Silently handle termination errors
      }
    });

    // Add close frame handler to catch invalid close codes
    ws.on("close", (code, reason) => {
      // Validate close code is in valid range
      if (code < 1000 || code > 4999) {
        console.warn(`[WebSocket] Invalid close code: ${code}`);
      }
    });

    // Route based on path
    if (url.includes("/ws/device")) {
      handleDeviceConnection(extWs, req);
    } else if (url.includes("/ws/dashboard")) {
      handleDashboardConnection(extWs, req);
    } else {
      console.log("[WebSocket] Unknown path, closing");
      ws.close(1008, "Unknown WebSocket path");
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

  // Handle uncaught WebSocket errors at process level
  process.removeAllListeners("uncaughtException"); // Remove old listeners
  process.on("uncaughtException", (error: any) => {
    if (
      error.code === "WS_ERR_INVALID_CLOSE_CODE" ||
      error.message?.includes("Invalid WebSocket frame") ||
      error.message?.includes("invalid status code")
    ) {
      console.error("[WebSocket] Caught invalid frame error:", error.message);
      // Don't crash the server, just log it
      // This happens when ESP32 sends malformed close frames
      return;
    }
    // Log other exceptions but don't crash in dev mode
    console.error("❌ Uncaught Exception:", error.message);
    console.error("Stack:", error.stack);
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
