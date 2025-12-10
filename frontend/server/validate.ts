import {
  CommandMessage,
  TelemetryMessage,
  StatusMessage,
} from "./types";

export function validateCommand(data: any): data is CommandMessage {
  if (!data || typeof data !== "object") return false;
  if (data.type !== "command") return false;
  if (!["START", "STOP", "SET_SPEED", "RESET", "LED_ON", "LED_OFF"].includes(data.command))
    return false;
  if (data.motor && !["A", "B"].includes(data.motor)) return false;
  if (data.command === "SET_SPEED" && typeof data.value !== "number")
    return false;
  return true;
}

export function validateTelemetry(data: any): data is TelemetryMessage {
  if (!data || typeof data !== "object") return false;
  if (data.type !== "telemetry") return false;

  // Validate motorA
  if (
    !data.motorA ||
    typeof data.motorA.voltage !== "number" ||
    typeof data.motorA.current !== "number" ||
    typeof data.motorA.rpm !== "number"
  )
    return false;

  // Validate motorB
  if (
    !data.motorB ||
    typeof data.motorB.voltage !== "number" ||
    typeof data.motorB.current !== "number" ||
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
