import { WebSocket } from "ws";

export interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  deviceId?: string;
  userId?: string;
  lastHeartbeat?: Date;
}

export interface DeviceMetadata {
  id: string;
  socket: ExtendedWebSocket;
  ip: string;
  lastHeartbeat: Date;
  connectedAt: Date;
}

export interface DashboardMetadata {
  userId: string;
  socket: ExtendedWebSocket;
  connectedAt: Date;
}

export interface CommandMessage {
  type: "command";
  command: "START" | "STOP" | "SET_SPEED" | "RESET";
  motor?: "A" | "B";
  value?: number | null;
  timestamp: string;
}

export interface TelemetryMessage {
  type: "telemetry";
  motorA: {
    voltage: number;
    current: number | null;
    rpm: number;
    status: "idle" | "running" | "error";
    speed?: number;
  };
  motorB: {
    voltage: number;
    current: number | null;
    rpm: number;
    status: "idle" | "running" | "error";
    speed?: number;
  };
  temperature?: number;
  vibration?: number;
  isJammed?: boolean;
  ledState?: boolean;
  timestamp: string;
}

export interface StatusMessage {
  type: "status";
  state: "IDLE" | "RUNNING" | "ERROR";
  message?: string;
}

export interface AckMessage {
  type: "ack";
  message: string;
  success: boolean;
}
