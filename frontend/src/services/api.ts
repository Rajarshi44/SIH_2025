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

  async setDirection(motor: string, direction: "forward" | "reverse") {
    const response = await fetch(`${API_BASE}/command/set-direction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor, direction }),
    });
    if (!response.ok) throw new Error("Failed to set direction");
    return response.json();
  },

  async setForward(motor: string) {
    const response = await fetch(`${API_BASE}/command/forward`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor }),
    });
    if (!response.ok) throw new Error("Failed to set forward");
    return response.json();
  },

  async setReverse(motor: string) {
    const response = await fetch(`${API_BASE}/command/reverse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motor }),
    });
    if (!response.ok) throw new Error("Failed to set reverse");
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

    // Determine WebSocket URL (no auth required)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.url = `${protocol}//${host}/ws/dashboard?user_id=dashboard_user`;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected to dashboard");
        useStore.getState().updateSystem({
          wifiConnected: true,
        });
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
        useStore.getState().updateSystem({
          wifiConnected: false,
          deviceConnected: false,
        });
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
      // Mark device as connected when receiving telemetry
      store.updateSystem({
        deviceConnected: true,
        lastTelemetryTime: Date.now(),
      });

      // Store complete telemetry data
      store.setTelemetry(data);

      if (data.motorA) {
        // Calculate load (Power = Voltage × Current in watts)
        const load =
          data.motorA.current !== null
            ? Math.abs(data.motorA.voltage * data.motorA.current)
            : 0;

        store.updateMotorA({
          ...data.motorA,
          load,
          current: data.motorA.current || 0,
        });
        store.addHistoryPoint("motorA", {
          voltage: data.motorA.voltage,
          current: data.motorA.current || 0,
          rpm: data.motorA.rpm,
        });
      }

      if (data.motorB) {
        // Calculate load (Power = Voltage × Current in watts)
        const load =
          data.motorB.current !== null
            ? Math.abs(data.motorB.voltage * data.motorB.current)
            : 0;

        store.updateMotorB({
          ...data.motorB,
          load,
          current: data.motorB.current || 0,
        });
        store.addHistoryPoint("motorB", {
          voltage: data.motorB.voltage,
          current: data.motorB.current || 0,
          rpm: data.motorB.rpm,
        });
      }

      // Check for jam detection
      if (data.isJammed) {
        const motor = (data.motorA.current || 0) > 2 ? "Motor A" : "Motor B";
        store.addJamAlert({
          motor,
          severity:
            (data.motorA.current || 0) > 3 || (data.motorB.current || 0) > 3
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
    console.log("[WebSocket] send() called with data:", data);
    console.log("[WebSocket] readyState:", this.ws?.readyState);
    if (this.ws?.readyState === WebSocket.OPEN) {
      const jsonData = JSON.stringify(data);
      console.log("[WebSocket] Sending:", jsonData);
      this.ws.send(jsonData);
    } else {
      console.warn(
        "[WebSocket] Not connected, cannot send message. ReadyState:",
        this.ws?.readyState
      );
    }
  }

  // Send command via WebSocket
  sendCommand(
    command: string,
    motor: string,
    value?: number,
    direction?: string
  ) {
    this.send({
      type: "command",
      command,
      motor,
      value,
      direction,
      timestamp: new Date().toISOString(),
    });
  }

  // LED Control commands
  turnOnLED() {
    console.log("[WebSocket] turnOnLED() called");
    this.sendCommand("LED_ON", "A");
  }

  turnOffLED() {
    console.log("[WebSocket] turnOffLED() called");
    this.sendCommand("LED_OFF", "A");
  }
}

export const wsService = new WebSocketService();
