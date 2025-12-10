import useStore from "@/store/useStore";

// Get JWT token from localStorage
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

// API base URL
const API_BASE = "/api";

export const authService = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
    }
    return data;
  },

  logout() {
    localStorage.removeItem("auth_token");
  },

  getToken() {
    return getAuthToken();
  },
};

export const motorService = {
  async start(motor: string) {
    const response = await fetch(`${API_BASE}/command/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor }),
    });
    if (!response.ok) throw new Error("Failed to start motor");
    return response.json();
  },

  async stop(motor: string) {
    const response = await fetch(`${API_BASE}/command/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor }),
    });
    if (!response.ok) throw new Error("Failed to stop motor");
    return response.json();
  },

  async setSpeed(motor: string, speed: number) {
    const response = await fetch(`${API_BASE}/command/set-speed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor, speed }),
    });
    if (!response.ok) throw new Error("Failed to set speed");
    return response.json();
  },

  async sendCommand(command: string, motor: string) {
    const response = await fetch(`${API_BASE}/command/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ command, motor }),
    });
    if (!response.ok) throw new Error("Failed to send command");
    return response.json();
  },
};

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private url: string = "";

  connect() {
    if (typeof window === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const token = getAuthToken();
    if (!token) {
      console.warn("No auth token, cannot connect to WebSocket");
      return;
    }

    // Determine WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/dashboard?token=${token}`;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected to dashboard");
        useStore.getState().updateSystem({ wifiConnected: true });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        useStore.getState().updateSystem({ wifiConnected: false });
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        console.log("[WebSocket] Attempting to reconnect...");
        this.connect();
      }, this.reconnectInterval);
    }
  }

  private handleMessage(data: any) {
    const store = useStore.getState();

    // Handle telemetry from ESP32
    if (data.type === "telemetry") {
      // Store complete telemetry data
      store.setTelemetry(data);

      if (data.motorA) {
        store.updateMotorA(data.motorA);
        store.addHistoryPoint("motorA", data.motorA);
      }

      if (data.motorB) {
        store.updateMotorB(data.motorB);
        store.addHistoryPoint("motorB", data.motorB);
      }

      // Check for jam detection
      if (data.isJammed) {
        const motor = data.motorA.current > 2 ? "Motor A" : "Motor B";
        store.addJamAlert({
          motor,
          severity:
            data.motorA.current > 3 || data.motorB.current > 3
              ? "severe"
              : "warning",
          reason: "High current detected",
        });
      }
    }

    // Handle status updates
    else if (data.type === "status") {
      console.log("[WebSocket] Status:", data.message);
      store.addLog({
        motor: "System",
        event: data.message || data.state,
        voltage: 0,
        current: 0,
      });
    }

    // Handle connection confirmation
    else if (data.type === "connection") {
      console.log("[WebSocket] Connection established:", data.stats);
    }

    // Handle ACK from commands
    else if (data.type === "ack") {
      console.log("[WebSocket] ACK:", data.message);
    }

    // Handle errors
    else if (data.type === "error") {
      console.error("[WebSocket] Error:", data.message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Not connected, cannot send message");
    }
  }

  // Send command via WebSocket
  sendCommand(command: string, motor: string, value?: number) {
    this.send({
      type: "command",
      command,
      motor,
      value,
      timestamp: new Date().toISOString(),
    });
  }
}

export const wsService = new WebSocketService();
