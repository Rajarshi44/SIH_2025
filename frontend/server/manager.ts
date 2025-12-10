import { DeviceMetadata, DashboardMetadata, ExtendedWebSocket } from "./types";

class ConnectionManager {
  private devices: Map<string, DeviceMetadata> = new Map();
  private dashboards: Map<string, DashboardMetadata> = new Map();

  // Device management
  registerDevice(deviceId: string, socket: ExtendedWebSocket, ip: string) {
    const metadata: DeviceMetadata = {
      id: deviceId,
      socket,
      ip,
      lastHeartbeat: new Date(),
      connectedAt: new Date(),
    };
    this.devices.set(deviceId, metadata);
    console.log(`[Device] Registered: ${deviceId} from ${ip}`);
    return metadata;
  }

  removeDevice(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      console.log(`[Device] Removed: ${deviceId}`);
    }
    return device;
  }

  getDevice(deviceId: string): DeviceMetadata | undefined {
    return this.devices.get(deviceId);
  }

  getAllDevices(): DeviceMetadata[] {
    return Array.from(this.devices.values());
  }

  updateDeviceHeartbeat(deviceId: string) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastHeartbeat = new Date();
    }
  }

  // Dashboard management
  registerDashboard(userId: string, socket: ExtendedWebSocket) {
    const metadata: DashboardMetadata = {
      userId,
      socket,
      connectedAt: new Date(),
    };
    this.dashboards.set(userId, metadata);
    console.log(`[Dashboard] Registered: ${userId}`);
    return metadata;
  }

  removeDashboard(userId: string) {
    const dashboard = this.dashboards.get(userId);
    if (dashboard) {
      this.dashboards.delete(userId);
      console.log(`[Dashboard] Removed: ${userId}`);
    }
    return dashboard;
  }

  getAllDashboards(): DashboardMetadata[] {
    return Array.from(this.dashboards.values());
  }

  // Message routing
  forwardCommand(command: any) {
    let sent = 0;
    this.devices.forEach((device) => {
      if (device.socket.readyState === 1) {
        // OPEN
        device.socket.send(JSON.stringify(command));
        sent++;
      }
    });
    console.log(`[Command] Forwarded to ${sent} device(s)`);
    return sent > 0;
  }

  broadcastTelemetry(telemetry: any) {
    let sent = 0;
    this.dashboards.forEach((dashboard) => {
      if (dashboard.socket.readyState === 1) {
        // OPEN
        dashboard.socket.send(JSON.stringify(telemetry));
        sent++;
      }
    });
    console.log(`[Telemetry] Broadcast to ${sent} dashboard(s)`);
    return sent;
  }

  broadcastStatus(status: any) {
    this.dashboards.forEach((dashboard) => {
      if (dashboard.socket.readyState === 1) {
        dashboard.socket.send(JSON.stringify(status));
      }
    });
  }

  getStats() {
    return {
      devices: this.devices.size,
      dashboards: this.dashboards.size,
      deviceList: Array.from(this.devices.keys()),
    };
  }
}

export const connectionManager = new ConnectionManager();
