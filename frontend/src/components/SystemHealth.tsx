"use client";

import {
  Wifi,
  WifiOff,
  Signal,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, Badge } from "./UI";
import useStore from "@/store/useStore";

export const SystemHealth = () => {
  const system = useStore((state) => state.system);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50)
      return { label: "Excellent", color: "text-green-400", bars: 4 };
    if (rssi > -60) return { label: "Good", color: "text-neon", bars: 3 };
    if (rssi > -70) return { label: "Fair", color: "text-yellow-400", bars: 2 };
    return { label: "Poor", color: "text-red-400", bars: 1 };
  };

  const signal = getSignalStrength(system.rssi);

  return (
    <Card className="h-full">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-neon" />
        System Health
      </h2>

      {/* WiFi Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-3">
            {system.wifiConnected ? (
              <Wifi className="text-neon" size={24} />
            ) : (
              <WifiOff className="text-red-400" size={24} />
            )}
            <div>
              <p className="text-sm text-gray-400">WiFi Status</p>
              <p className="text-white font-semibold">
                {system.wifiConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <Badge variant={system.wifiConnected ? "success" : "danger"}>
            {system.wifiConnected ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Signal Strength */}
        {system.wifiConnected && (
          <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Signal className={signal.color} size={24} />
              <div>
                <p className="text-sm text-gray-400">Signal Strength</p>
                <p className={`${signal.color} font-semibold`}>
                  {signal.label} ({system.rssi} dBm)
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full ${
                    i < signal.bars
                      ? signal.color.replace("text-", "bg-")
                      : "bg-dark-600"
                  }`}
                  style={{ height: `${(i + 1) * 6}px` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Uptime */}
        <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-400" size={24} />
            <div>
              <p className="text-sm text-gray-400">System Uptime</p>
              <p className="text-white font-semibold font-mono">
                {formatUptime(system.uptime)}
              </p>
            </div>
          </div>
        </div>

        {/* Packet Loss */}
        <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle
              className={
                system.packetLoss > 5 ? "text-red-400" : "text-green-400"
              }
              size={24}
            />
            <div>
              <p className="text-sm text-gray-400">Packet Loss</p>
              <p className="text-white font-semibold">
                {system.packetLoss.toFixed(1)}%
              </p>
            </div>
          </div>
          <Badge variant={system.packetLoss > 5 ? "danger" : "success"}>
            {system.packetLoss > 5 ? "High" : "Normal"}
          </Badge>
        </div>

        {/* ESP32 Info */}
        <div className="p-3 bg-gradient-to-br from-neon/10 to-transparent rounded-lg border border-neon/20">
          <p className="text-xs text-gray-400 mb-1">Device</p>
          <p className="text-white font-semibold">SohojPaat IoT Controller</p>
          <p className="text-xs text-neon mt-1">Firmware v1.0.0</p>
        </div>
      </div>
    </Card>
  );
};
