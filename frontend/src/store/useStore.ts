import { create } from "zustand";

interface MotorState {
  speed: number;
  rpm: number;
  voltage: number;
  current: number | null;
  status: "stopped" | "running" | "jammed";
  isOn: boolean;
  load?: number; // Power in watts (V × A)
}

interface TelemetryData {
  motorA: MotorState;
  motorB: MotorState;
  isJammed: boolean;
  ledState: boolean;
  timestamp: string;
}

interface SystemState {
  wifiConnected: boolean;
  rssi: number;
  uptime: number;
  packetLoss: number;
}

interface Settings {
  apiEndpoint: string;
  wsEndpoint: string;
  maxCurrentThreshold: number;
  rpmJamThreshold: number;
  theme: string;
}

interface HistoryData {
  voltage: number[];
  current: number[];
  rpm: number[];
  timestamps: Date[];
}

interface Log {
  id: number;
  timestamp: Date;
  motor: string;
  event: string;
  voltage?: number;
  current?: number;
  duration?: string;
}

interface JamAlert {
  id: number;
  timestamp: Date;
  motor: string;
  severity: "warning" | "severe";
  reason?: string;
}

interface StoreState {
  motorA: MotorState;
  motorB: MotorState;
  system: SystemState;
  settings: Settings;
  telemetry: TelemetryData | null;
  history: {
    motorA: HistoryData;
    motorB: HistoryData;
  };
  logs: Log[];
  jamAlerts: JamAlert[];

  setTelemetry: (data: TelemetryData) => void;
  updateMotorA: (data: Partial<MotorState>) => void;
  updateMotorB: (data: Partial<MotorState>) => void;
  updateSystem: (data: Partial<SystemState>) => void;
  updateSettings: (data: Partial<Settings>) => void;
  addHistoryPoint: (
    motor: "motorA" | "motorB",
    data: { voltage: number; current: number; rpm: number }
  ) => void;
  addLog: (log: Omit<Log, "id" | "timestamp">) => void;
  addJamAlert: (alert: Omit<JamAlert, "id" | "timestamp">) => void;
  clearJamAlert: (id: number) => void;
  clearAllJamAlerts: () => void;
  clearLogs: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  motorA: {
    speed: 0,
    rpm: 0,
    voltage: 0,
    current: 0,
    status: "stopped",
    isOn: false,
  },
  motorB: {
    speed: 0,
    rpm: 0,
    voltage: 0,
    current: 0,
    status: "stopped",
    isOn: false,
  },
  telemetry: null,
  system: {
    wifiConnected: false,
    rssi: 0,
    uptime: 0,
    packetLoss: 0,
  },
  settings: {
    apiEndpoint: "http://192.168.1.100",
    wsEndpoint: "ws://192.168.1.100:81",
    maxCurrentThreshold: 500,
    rpmJamThreshold: 50,
    theme: "dark",
  },
  history: {
    motorA: { voltage: [], current: [], rpm: [], timestamps: [] },
    motorB: { voltage: [], current: [], rpm: [], timestamps: [] },
  },
  logs: [],
  jamAlerts: [],

  setTelemetry: (data) => set({ telemetry: data }),
  updateMotorA: (data) =>
    set((state) => ({ motorA: { ...state.motorA, ...data } })),
  updateMotorB: (data) =>
    set((state) => ({ motorB: { ...state.motorB, ...data } })),
  updateSystem: (data) =>
    set((state) => ({ system: { ...state.system, ...data } })),
  updateSettings: (data) =>
    set((state) => ({ settings: { ...state.settings, ...data } })),

  addHistoryPoint: (motor, data) =>
    set((state) => {
      const motorHistory = state.history[motor];
      const maxPoints = 300;

      return {
        history: {
          ...state.history,
          [motor]: {
            voltage: [...motorHistory.voltage, data.voltage].slice(-maxPoints),
            current: [...motorHistory.current, data.current].slice(-maxPoints),
            rpm: [...motorHistory.rpm, data.rpm].slice(-maxPoints),
            timestamps: [...motorHistory.timestamps, new Date()].slice(
              -maxPoints
            ),
          },
        },
      };
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        { ...log, id: Date.now(), timestamp: new Date() },
        ...state.logs,
      ].slice(0, 500),
    })),

  addJamAlert: (alert) =>
    set((state) => {
      const newAlert = { ...alert, id: Date.now(), timestamp: new Date() };
      return { jamAlerts: [newAlert, ...state.jamAlerts].slice(0, 20) };
    }),

  clearJamAlert: (id) =>
    set((state) => ({
      jamAlerts: state.jamAlerts.filter((alert) => alert.id !== id),
    })),

  clearAllJamAlerts: () => set({ jamAlerts: [] }),

  clearLogs: () => set({ logs: [] }),
}));

export default useStore;
