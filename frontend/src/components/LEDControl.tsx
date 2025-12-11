"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  Power,
  CircleDot,
  Circle,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import useStore from "@/store/useStore";
import { wsService } from "@/services/api";
import { motorService } from "@/services/api";

export default function LEDControl() {
  const telemetry = useStore((state) => state.telemetry);
  const system = useStore((state) => state.system);
  const [ledOn, setLedOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");

  // Log connection status on mount and changes
  useEffect(() => {
    console.log("[LED] Component mounted");
    console.log("[LED] Initial WiFi connected:", system.wifiConnected);
    console.log("[LED] Initial Device connected:", system.deviceConnected);

    // Check if auth token exists
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      console.log("[LED] Auth token exists:", !!token);
      if (token) {
        console.log("[LED] Token preview:", token.substring(0, 20) + "...");
      }
    }
  }, []);

  useEffect(() => {
    console.log("[LED] WiFi connection changed:", system.wifiConnected);
  }, [system.wifiConnected]);

  useEffect(() => {
    console.log("[LED] Device connection changed:", system.deviceConnected);
  }, [system.deviceConnected]);

  // Update LED state from telemetry
  useEffect(() => {
    if (telemetry?.ledState !== undefined) {
      setLedOn(telemetry.ledState);
    }
  }, [telemetry?.ledState]);

  // Check for stale telemetry (no updates for 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastTelemetry = Date.now() - system.lastTelemetryTime;
      if (timeSinceLastTelemetry > 5000 && system.deviceConnected) {
        useStore.getState().updateSystem({ deviceConnected: false });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [system.lastTelemetryTime, system.deviceConnected]);

  const turnOnLED = async () => {
    console.log("[LED] Turn ON clicked");
    console.log("[LED] WiFi connected:", system.wifiConnected);
    console.log("[LED] Device connected:", system.deviceConnected);

    if (!system.wifiConnected) {
      setLastCommand("❌ WebSocket not connected");
      return;
    }
    setLoading(true);
    setLastCommand("Sending ON command...");
    try {
      console.log("[LED] Calling wsService.turnOnLED()");
      wsService.turnOnLED();
      console.log("[LED] Command sent");
      setTimeout(() => setLastCommand(""), 3000);
    } catch (error) {
      console.error("Failed to turn on LED:", error);
      setLastCommand("❌ Command failed");
    } finally {
      setLoading(false);
    }
  };

  const turnOffLED = async () => {
    console.log("[LED] Turn OFF clicked");
    console.log("[LED] WiFi connected:", system.wifiConnected);
    console.log("[LED] Device connected:", system.deviceConnected);

    if (!system.wifiConnected) {
      setLastCommand("❌ WebSocket not connected");
      return;
    }
    setLoading(true);
    setLastCommand("Sending OFF command...");
    try {
      console.log("[LED] Calling wsService.turnOffLED()");
      wsService.turnOffLED();
      console.log("[LED] Command sent");
      setTimeout(() => setLastCommand(""), 3000);
    } catch (error) {
      console.error("Failed to turn off LED:", error);
      setLastCommand("❌ Command failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-light-100 rounded-2xl p-4 sm:p-6 border border-light-300 shadow-lg">
      {/* ESP32 Connection Status Banner - Enhanced */}
      <div
        className={`mb-4 p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
          system.deviceConnected
            ? "bg-green-50 border-green-300 shadow-md"
            : "bg-red-50 border-red-300 animate-pulse"
        }`}
      >
        <div className="flex-shrink-0">
          {system.deviceConnected ? (
            <div className="relative">
              <Wifi className="text-green-600" size={28} />
              <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
            </div>
          ) : (
            <div className="relative">
              <WifiOff className="text-red-600" size={28} />
              <XCircle className="w-4 h-4 text-red-600 absolute -top-1 -right-1 bg-white rounded-full" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p
            className={`text-base font-bold mb-1 ${
              system.deviceConnected ? "text-green-900" : "text-red-900"
            }`}
          >
            {system.deviceConnected
              ? "✓ Machine Connected"
              : "✗ Machine Disconnected"}
          </p>
          <p className="text-xs text-gray-600">
            {system.deviceConnected
              ? "ESP32 is online and ready to control"
              : "Waiting for ESP32 connection..."}
          </p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            system.wifiConnected
              ? "bg-blue-100 text-blue-700 border border-blue-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
        >
          {system.wifiConnected ? "WebSocket ✓" : "WebSocket ✗"}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          {ledOn ? (
            <Lightbulb
              className="text-yellow-500 animate-pulse"
              size={24}
              fill="currentColor"
            />
          ) : (
            <Lightbulb className="text-gray-400" size={24} />
          )}
          <span className="hidden sm:inline">ESP32 LED Test</span>
          <span className="sm:hidden">LED Test</span>
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
            ledOn
              ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
        >
          {ledOn ? (
            <CircleDot className="w-3 h-3" />
          ) : (
            <Circle className="w-3 h-3" />
          )}
          {ledOn ? "ON" : "OFF"}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* LED Visualization */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <div
            className={`absolute inset-0 rounded-full transition-all duration-300 ${
              ledOn
                ? "bg-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.8)] scale-110"
                : "bg-gray-300 shadow-none scale-100"
            }`}
          />
          <div
            className={`absolute inset-4 rounded-full transition-all duration-300 ${
              ledOn
                ? "bg-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.6)]"
                : "bg-gray-400"
            }`}
          />
          <div
            className={`absolute inset-8 rounded-full transition-all duration-300 ${
              ledOn
                ? "bg-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                : "bg-gray-500"
            }`}
          />
        </div>

        {/* Separate ON/OFF Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={turnOnLED}
            disabled={loading}
            className="py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/20"
          >
            <span className="flex items-center justify-center gap-2">
              <Power size={18} className="sm:hidden" />
              <Power size={20} className="hidden sm:block" />
              <span className="hidden sm:inline">
                {loading && !ledOn ? "..." : "Turn ON"}
              </span>
              <span className="sm:hidden">ON</span>
            </span>
          </button>

          <button
            onClick={turnOffLED}
            disabled={loading}
            className="py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/20"
          >
            <span className="flex items-center justify-center gap-2">
              <Power size={18} className="sm:hidden" />
              <Power size={20} className="hidden sm:block" />
              <span className="hidden sm:inline">
                {loading && ledOn ? "..." : "Turn OFF"}
              </span>
              <span className="sm:hidden">OFF</span>
            </span>
          </button>
        </div>

        <p className="text-gray-600 text-xs sm:text-sm text-center">
          {ledOn
            ? "🟡 Built-in LED is currently ON (GPIO 2)"
            : "⚫ Built-in LED is currently OFF"}
        </p>
        {lastCommand && (
          <p className="text-xs text-primary font-medium mt-2 text-center">
            {lastCommand}
          </p>
        )}
      </div>
    </div>
  );
}
