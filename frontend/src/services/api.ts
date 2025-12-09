import useStore from "@/store/useStore";

const API_BASE = () =>
  typeof window !== "undefined" ? useStore.getState().settings.apiEndpoint : "";

export const motorService = {
  async start(motor: string) {
    const response = await fetch(`${API_BASE()}/motor/${motor}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to start motor");
    return response.json();
  },

  async stop(motor: string) {
    const response = await fetch(`${API_BASE()}/motor/${motor}/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to stop motor");
    return response.json();
  },

  async setSpeed(motor: string, speed: number) {
    const response = await fetch(`${API_BASE()}/motor/${motor}/speed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: speed }),
    });
    if (!response.ok) throw new Error("Failed to set speed");
    return response.json();
  },
};

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect(url: string) {
    if (typeof window === "undefined") return;
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
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
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        useStore.getState().updateSystem({ wifiConnected: false });
        this.scheduleReconnect(url);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.connect(url);
      }, this.reconnectInterval);
    }
  }

  private handleMessage(data: any) {
    const store = useStore.getState();

    if (data.motorA) {
      store.updateMotorA(data.motorA);
      store.addHistoryPoint("motorA", data.motorA);
    }

    if (data.motorB) {
      store.updateMotorB(data.motorB);
      store.addHistoryPoint("motorB", data.motorB);
    }

    if (data.system) {
      store.updateSystem({
        wifiConnected: true,
        rssi: data.system.wifi_rssi || 0,
        uptime: data.system.uptime || 0,
      });
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
    }
  }
}

export const wsService = new WebSocketService();
