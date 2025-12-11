import { CommandMessage, TelemetryMessage, StatusMessage } from "./types";

export function validateCommand(data: any): data is CommandMessage {
  if (!data || typeof data !== "object") return false;
  if (data.type !== "command") return false;
  if (!data.command || typeof data.command !== "string") return false;
  // Accept any command for debugging
  return true;
}

export function validateTelemetry(data: any): data is TelemetryMessage {
  if (!data || typeof data !== "object") return false;
  if (data.type !== "telemetry") return false;

  // Validate motorA
  if (
    !data.motorA ||
    typeof data.motorA.voltage !== "number" ||
    (data.motorA.current !== null && typeof data.motorA.current !== "number") ||
    typeof data.motorA.rpm !== "number"
  )
    return false;

  // Validate motorB (allow null for current if sensor not found)
  if (
    !data.motorB ||
    typeof data.motorB.voltage !== "number" ||
    (data.motorB.current !== null && typeof data.motorB.current !== "number") ||
    typeof data.motorB.rpm !== "number"
  )
    return false;

  return true;
}

export function validateStatus(data: any): data is StatusMessage {
  if (!data || typeof data !== "object") return false;
  if (data.type !== "status") return false;
  if (!["IDLE", "RUNNING", "ERROR"].includes(data.state)) return false;
  return true;
}
