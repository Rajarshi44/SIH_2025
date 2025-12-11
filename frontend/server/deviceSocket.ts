import { ExtendedWebSocket } from "./types";
import { connectionManager } from "./manager";
import { validateTelemetry, validateStatus } from "./validate";
import { verifyDeviceToken } from "./auth";
import { parse } from "url";

export function handleDeviceConnection(ws: ExtendedWebSocket, req: any) {
  const { query } = parse(req.url || "", true);
  const deviceId = (query.device_id as string) || "esp32_default";

  // No auth validation required for debugging

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
      // Safely convert buffer to string with error handling
      let messageStr: string;
      try {
        // Validate buffer before converting
        if (!Buffer.isBuffer(data)) {
          console.error(`[Device] Invalid data type from ${deviceId}`);
          return;
        }

        // Check for reasonable message size (max 64KB)
        if (data.length > 65536) {
          console.error(
            `[Device] Message too large from ${deviceId}: ${data.length} bytes`
          );
          return;
        }

        messageStr = data.toString("utf8");

        // Validate that we got a string
        if (typeof messageStr !== "string" || messageStr.length === 0) {
          console.error(`[Device] Empty or invalid message from ${deviceId}`);
          return;
        }
      } catch (e) {
        console.error(`[Device] Buffer decode error for ${deviceId}:`, e);
        return;
      }

      // Parse JSON with validation
      let message;
      try {
        message = JSON.parse(messageStr);
      } catch (e) {
        console.error(
          `[Device] JSON parse error from ${deviceId}:`,
          messageStr.substring(0, 100)
        );
        return;
      }

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
    } catch (error: any) {
      console.error(
        `[Device] Message parse error from ${deviceId}:`,
        error.message
      );
      // Don't close connection on parse errors, just skip the message
    }
  });

  // Handle pong for heartbeat
  ws.on("pong", () => {
    ws.isAlive = true;
    connectionManager.updateDeviceHeartbeat(deviceId);
  });

  // Handle close
  ws.on("close", (code, reason) => {
    console.log(
      `[Device] Disconnected: ${deviceId} (code: ${code}, reason: ${reason.toString()})`
    );
    connectionManager.removeDevice(deviceId);
    connectionManager.broadcastStatus({
      type: "status",
      state: "IDLE",
      message: `Device ${deviceId} disconnected`,
    });
  });

  // Handle error
  ws.on("error", (error) => {
    console.error(`[Device] Error on ${deviceId}:`, error.message);
    // Safely close the connection on error
    try {
      if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
        ws.terminate();
      }
    } catch (e) {
      console.error(`[Device] Failed to terminate connection:`, e);
    }
  });

  console.log(`[Device] Connected: ${deviceId} from ${ip}`);
}
