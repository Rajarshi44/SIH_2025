import { ExtendedWebSocket } from "./types";
import { connectionManager } from "./manager";
import { validateCommand } from "./validate";
import { verifyToken } from "./auth";
import { parse } from "url";

export function handleDashboardConnection(ws: ExtendedWebSocket, req: any) {
  const { query } = parse(req.url || "", true);
  const userId = (query.user_id as string) || "dashboard_user";

  // Register dashboard (no auth required)
  ws.userId = userId;
  ws.isAlive = true;
  connectionManager.registerDashboard(userId, ws);

  // Send current connection stats
  ws.send(
    JSON.stringify({
      type: "connection",
      message: "Connected to server",
      stats: connectionManager.getStats(),
    })
  );

  // Handle messages from dashboard
  ws.on("message", (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle commands
      if (message.type === "command") {
        if (validateCommand(message)) {
          console.log(`[Dashboard] Command from ${userId}: ${message.command}`);
          const sent = connectionManager.forwardCommand(message);

          // Send ACK to dashboard
          ws.send(
            JSON.stringify({
              type: "ack",
              success: sent,
              message: sent ? "Command sent to device" : "No devices connected",
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid command format",
            })
          );
        }
      }

      // Handle status request
      else if (message.type === "status_request") {
        ws.send(
          JSON.stringify({
            type: "status_response",
            stats: connectionManager.getStats(),
          })
        );
      }
    } catch (error) {
      console.error("[Dashboard] Message parse error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  // Handle pong for heartbeat
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Handle close
  ws.on("close", () => {
    console.log(`[Dashboard] Disconnected: ${userId}`);
    connectionManager.removeDashboard(userId);
  });

  // Handle error
  ws.on("error", (error) => {
    console.error(`[Dashboard] Error on ${userId}:`, error);
  });

  console.log(`[Dashboard] Connected: ${userId}`);
}
