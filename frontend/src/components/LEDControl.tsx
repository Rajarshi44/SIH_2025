"use client";

import { useState, useEffect } from "react";
import { Lightbulb, Power } from "lucide-react";
import useStore from "@/store/useStore";
import { motorService } from "@/services/api";

export default function LEDControl() {
  const telemetry = useStore((state) => state.telemetry);
  const [ledOn, setLedOn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update LED state from telemetry
  useEffect(() => {
    if (telemetry?.ledState !== undefined) {
      setLedOn(telemetry.ledState);
    }
  }, [telemetry?.ledState]);

  const toggleLED = async () => {
    setLoading(true);
    try {
      const command = ledOn ? "LED_OFF" : "LED_ON";
      await motorService.sendCommand(command, "A"); // Motor param not used for LED
      // State will be updated by telemetry
    } catch (error) {
      console.error("Failed to toggle LED:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Lightbulb className={ledOn ? "text-yellow-400" : "text-gray-400"} size={24} />
          ESP32 LED Test
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          ledOn 
            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
        }`}>
          {ledOn ? "ON" : "OFF"}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {/* LED Visualization */}
        <div className="relative w-32 h-32">
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
            ledOn 
              ? "bg-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.8)] scale-110" 
              : "bg-gray-600 shadow-none scale-100"
          }`} />
          <div className={`absolute inset-4 rounded-full transition-all duration-300 ${
            ledOn 
              ? "bg-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.6)]" 
              : "bg-gray-700"
          }`} />
          <div className={`absolute inset-8 rounded-full transition-all duration-300 ${
            ledOn 
              ? "bg-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.4)]" 
              : "bg-gray-800"
          }`} />
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleLED}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
            ledOn
              ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30"
              : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30"
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Power size={20} />
            {loading ? "Processing..." : ledOn ? "Turn OFF" : "Turn ON"}
          </span>
        </button>

        <p className="text-gray-400 text-sm text-center">
          {ledOn 
            ? "🟡 Built-in LED is currently ON (GPIO 2)" 
            : "⚫ Built-in LED is currently OFF"
          }
        </p>
      </div>
    </div>
  );
}
