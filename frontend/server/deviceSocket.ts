import { ExtendedWebSocket } from "./types";
import { connectionManager } from "./manager";
import { validateTelemetry, validateStatus } from "./validate";
import { verifyDeviceToken } from "./auth";
import { parse } from "url";

export function handleDeviceConnection(ws: ExtendedWebSocket, req: any) {
  const { query } = parse(req.url || "", true);
  const deviceId = query.device_id as string;
  const token = query.token as string;

  // Validate device token
  if (!verifyDeviceToken(token)) {
    console.log("[Device] Invalid token");
    ws.close(4001, "Invalid token");
    return;
  }

  if (!deviceId) {
    console.log("[Device] Missing device_id");
    ws.close(4002, "Missing device_id");
    return;
  }

  // Get client IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  // Register device
  ws.deviceId = deviceId;
  ws.isAlive = true;
  connectionManager.registerDevice(deviceId, ws, ip);

  // Notify dashboards
  connectionManager.broadcastStatus({
    type: "status",
    state: "IDLE",
    message: `Device ${deviceId} connected`,
  });

  // Handle messages from device
  ws.on("message", (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      // Update heartbeat
      connectionManager.updateDeviceHeartbeat(deviceId);

      // Handle telemetry
      if (message.type === "telemetry") {
        if (validateTelemetry(message)) {
          console.log(`[Device] Telemetry from ${deviceId}`);
          connectionManager.broadcastTelemetry(message);
        } else {
          console.warn(
            "[Device] Invalid telemetry format:",
            JSON.stringify(message)
          );
        }
      }

      // Handle status updates
      else if (message.type === "status") {
        if (validateStatus(message)) {
          console.log(`[Device] Status from ${deviceId}: ${message.state}`);
          connectionManager.broadcastStatus(message);
        }
      }

      // Handle ACK
      else if (message.type === "ack") {
        console.log(`[Device] ACK from ${deviceId}: ${message.message}`);
        connectionManager.broadcastStatus(message);
      }
    } catch (error) {
      console.error("[Device] Message parse error:", error);
    }
  });

  // Handle pong for heartbeat
  ws.on("pong", () => {
    ws.isAlive = true;
    connectionManager.updateDeviceHeartbeat(deviceId);
  });

  // Handle close
  ws.on("close", () => {
    console.log(`[Device] Disconnected: ${deviceId}`);
    connectionManager.removeDevice(deviceId);
    connectionManager.broadcastStatus({
      type: "status",
      state: "IDLE",
      message: `Device ${deviceId} disconnected`,
    });
  });

  // Handle error
  ws.on("error", (error) => {
    console.error(`[Device] Error on ${deviceId}:`, error);
  });

  console.log(`[Device] Connected: ${deviceId} from ${ip}`);
}
