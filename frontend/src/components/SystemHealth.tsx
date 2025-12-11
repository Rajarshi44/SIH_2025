"use client";

import { useState } from "react";
import {
  Wifi,
  WifiOff,
  Signal,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  CircleDot,
  Circle,
  Lightbulb,
  Power,
} from "lucide-react";
import { Card, Badge } from "./UI";
import useStore from "@/store/useStore";
import { wsService } from "@/services/api";

export const SystemHealth = () => {
  const system = useStore((state) => state.system);
  const telemetry = useStore((state) => state.telemetry);
  const [loading, setLoading] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");

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

  const turnOnLED = async () => {
    if (!system.wifiConnected) {
      setLastCommand("❌ WebSocket not connected");
      return;
    }
    setLoading(true);
    setLastCommand("Sending ON command...");
    try {
      wsService.turnOnLED();
      setTimeout(() => setLastCommand(""), 3000);
    } catch (error) {
      console.error("Failed to turn on LED:", error);
      setLastCommand("❌ Command failed");
    } finally {
      setLoading(false);
    }
  };

  const turnOffLED = async () => {
    if (!system.wifiConnected) {
      setLastCommand("❌ WebSocket not connected");
      return;
    }
    setLoading(true);
    setLastCommand("Sending OFF command...");
    try {
      wsService.turnOffLED();
      setTimeout(() => setLastCommand(""), 3000);
    } catch (error) {
      console.error("Failed to turn off LED:", error);
      setLastCommand("❌ Command failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-primary" />
        System Health & Control
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {/* LED Control Section - Refined Design */}
        <div className="relative overflow-hidden rounded-xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {telemetry?.ledState ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse" />
                    <Lightbulb
                      className="relative text-yellow-500 drop-shadow-lg"
                      size={32}
                      fill="currentColor"
                      strokeWidth={2}
                    />
                  </div>
                ) : (
                  <Lightbulb
                    className="text-gray-400"
                    size={32}
                    strokeWidth={2}
                  />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  LED Control
                </h3>
                <p className="text-xs text-gray-600">ESP32 GPIO 2</p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                telemetry?.ledState
                  ? "bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-500/50 animate-pulse"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {telemetry?.ledState ? "● ON" : "○ OFF"}
            </div>
          </div>

          {/* Visual LED Indicator */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-full transition-all duration-500 ${
                  telemetry?.ledState
                    ? "bg-gradient-to-br from-yellow-300 to-orange-400 shadow-2xl shadow-yellow-500/80 scale-110"
                    : "bg-gradient-to-br from-gray-300 to-gray-400 shadow-md"
                }`}
              >
                <div
                  className={`absolute inset-2 rounded-full transition-all duration-500 ${
                    telemetry?.ledState
                      ? "bg-gradient-to-br from-yellow-200 to-yellow-300"
                      : "bg-gray-400"
                  }`}
                >
                  <div
                    className={`absolute inset-2 rounded-full transition-all duration-500 ${
                      telemetry?.ledState
                        ? "bg-yellow-100 shadow-inner"
                        : "bg-gray-500"
                    }`}
                  />
                </div>
              </div>
              {telemetry?.ledState && (
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-40 animate-pulse" />
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={turnOnLED}
              disabled={loading || !system.wifiConnected}
              className="group relative py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl shadow-green-500/30 hover:shadow-green-500/50"
            >
              <span className="flex items-center justify-center gap-2">
                <Power
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-200"
                />
                <span>Turn ON</span>
              </span>
            </button>

            <button
              onClick={turnOffLED}
              disabled={loading || !system.wifiConnected}
              className="group relative py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-xl shadow-red-500/30 hover:shadow-red-500/50"
            >
              <span className="flex items-center justify-center gap-2">
                <Power
                  size={18}
                  className="group-hover:rotate-90 transition-transform duration-200"
                />
                <span>Turn OFF</span>
              </span>
            </button>
          </div>

          {lastCommand && (
            <div className="mt-3 p-2 bg-white/50 backdrop-blur-sm rounded-lg border border-yellow-200">
              <p className="text-xs text-gray-700 text-center font-medium">
                {lastCommand}
              </p>
            </div>
          )}
        </div>

        {/* WiFi Status */}
        <div className="flex items-center justify-between p-3 bg-light-100 rounded-lg border border-light-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              {system.wifiConnected ? (
                <>
                  <Wifi className="text-primary" size={24} />
                  <CheckCircle className="w-3 h-3 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
                </>
              ) : (
                <>
                  <WifiOff className="text-red-500" size={24} />
                  <XCircle className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full" />
                </>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">WiFi Status</p>
              <p className="text-gray-900 font-semibold text-sm sm:text-base flex items-center gap-1">
                {system.wifiConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <Badge variant={system.wifiConnected ? "success" : "danger"}>
            {system.wifiConnected ? (
              <span className="flex items-center gap-1">
                <CircleDot className="w-3 h-3" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Circle className="w-3 h-3" />
                Offline
              </span>
            )}
          </Badge>
        </div>

        {/* Signal Strength */}
        {/* {system.wifiConnected && (
          <div className="flex items-center justify-between p-3 bg-light-100 rounded-lg border border-light-300">
            <div className="flex items-center gap-3">
              <Signal className={signal.color} size={24} />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Signal Strength
                </p>
                <p
                  className={`${signal.color} font-semibold text-sm sm:text-base`}
                >
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
                      : "bg-light-300"
                  }`}
                  style={{ height: `${(i + 1) * 6}px` }}
                />
              ))}
            </div>
          </div>
        )} */}

        {/* Uptime */}
        <div className="flex items-center justify-between p-3 bg-light-100 rounded-lg border border-light-300">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-500" size={24} />
            <div>
              <p className="text-xs sm:text-sm text-gray-600">System Uptime</p>
              <p className="text-gray-900 font-semibold font-mono text-sm sm:text-base">
                {formatUptime(system.uptime)}
              </p>
            </div>
          </div>
        </div>

        {/* Packet Loss */}
        <div className="flex items-center justify-between p-3 bg-light-100 rounded-lg border border-light-300">
          <div className="flex items-center gap-3">
            <div className="relative">
              {system.packetLoss > 5 ? (
                <>
                  <AlertCircle
                    className="text-red-500 animate-pulse"
                    size={24}
                  />
                  <XCircle className="w-3 h-3 text-red-600 absolute -top-1 -right-1 bg-white rounded-full" />
                </>
              ) : (
                <>
                  <CheckCircle className="text-green-500" size={24} />
                  <CircleDot className="w-3 h-3 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                </>
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Packet Loss</p>
              <p className="text-gray-900 font-semibold text-sm sm:text-base">
                {system.packetLoss.toFixed(1)}%
              </p>
            </div>
          </div>
          <Badge variant={system.packetLoss > 5 ? "danger" : "success"}>
            <span className="flex items-center gap-1">
              {system.packetLoss > 5 ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  High
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Normal
                </>
              )}
            </span>
          </Badge>
        </div>

        {/* ESP32 Info */}
        <div className="p-3 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border border-primary/20">
          <p className="text-xs text-gray-600 mb-1">Device</p>
          <p className="text-gray-900 font-semibold text-sm sm:text-base">
            SohojPaat IoT Controller
          </p>
          <p className="text-xs text-primary mt-1 font-medium">
            Firmware v1.0.0
          </p>
        </div>
      </div>
    </Card>
  );
};
