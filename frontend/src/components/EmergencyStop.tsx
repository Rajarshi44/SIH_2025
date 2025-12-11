"use client";

import {
  AlertTriangle,
  Zap,
  ShieldAlert,
  Octagon,
  ShieldX,
  Power,
} from "lucide-react";
import { motorService } from "@/services/api";
import useStore from "@/store/useStore";
import { toast } from "sonner";
import { useState } from "react";

export const EmergencyStop = () => {
  const [isStopping, setIsStopping] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const updateMotorA = useStore((state) => state.updateMotorA);
  const updateMotorB = useStore((state) => state.updateMotorB);
  const addLog = useStore((state) => state.addLog);
  const motorA = useStore((state) => state.motorA);
  const motorB = useStore((state) => state.motorB);

  const isAnyMotorRunning = motorA.isOn || motorB.isOn;

  const handleEmergencyStop = async () => {
    setIsStopping(true);
    try {
      // Stop both motors
      await Promise.all([motorService.stop("a"), motorService.stop("b")]);

      updateMotorA({ isOn: false, status: "stopped", speed: 0 });
      updateMotorB({ isOn: false, status: "stopped", speed: 0 });

      addLog({
        motor: "SYSTEM",
        event: "EMERGENCY STOP",
        voltage: 0,
        current: 0,
      });

      toast.error("🚨 EMERGENCY STOP ACTIVATED", {
        description: "All motors have been immediately stopped",
        duration: 5000,
      });
    } catch (error) {
      console.error("Emergency stop failed:", error);
      toast.error("Emergency stop failed", {
        description: "Please check connection and try again",
      });
    } finally {
      setTimeout(() => setIsStopping(false), 2000);
    }
  };

  return (
    <div className="relative group">
      {/* Glow effect when motors are running */}
      {isAnyMotorRunning && (
        <div className="absolute -inset-1 bg-red-500/20 rounded-2xl blur-xl animate-pulse" />
      )}

      <button
        onClick={handleEmergencyStop}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        disabled={isStopping}
        className={`
          relative w-full min-w-[240px] sm:min-w-[280px] h-20 sm:h-24 rounded-2xl
          font-bold text-lg sm:text-xl tracking-wider
          transition-all duration-200 transform
          disabled:opacity-70 disabled:cursor-not-allowed
          ${
            isPressed
              ? "scale-95 shadow-inner"
              : "scale-100 shadow-2xl hover:scale-105"
          }
          ${
            isStopping
              ? "bg-gradient-to-br from-gray-400 to-gray-500"
              : isAnyMotorRunning
              ? "bg-gradient-to-br from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:via-red-600 hover:to-red-700 animate-pulse"
              : "bg-gradient-to-br from-red-400/60 via-red-500/60 to-red-600/60 hover:from-red-400/80 hover:via-red-500/80 hover:to-red-600/80"
          }
          border-4 border-red-300
          group-hover:border-red-500
        `}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-white/5 to-white/10" />

        {/* Striped warning pattern */}
        <div className="absolute inset-0 rounded-2xl opacity-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,rgba(0,0,0,0.3)_20px,rgba(0,0,0,0.3)_40px)]" />
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center gap-4 h-full">
          {isStopping ? (
            <>
              <Zap className="w-8 h-8 text-white animate-spin" />
              <span className="text-white drop-shadow-lg">STOPPING...</span>
            </>
          ) : (
            <>
              <div className="relative">
                <ShieldAlert className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                {isAnyMotorRunning && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-white text-2xl font-black drop-shadow-lg tracking-wide">
                  EMERGENCY
                </span>
                <span className="text-white text-lg font-black drop-shadow-lg -mt-1">
                  STOP
                </span>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_10px_rgba(255,255,0,0.6)] animate-pulse" />
            </>
          )}
        </div>

        {/* Bottom indicator */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="px-3 py-1 bg-black/40 rounded-full">
            <span className="text-xs text-white/80 font-semibold">
              {isAnyMotorRunning ? "⚡ MOTORS ACTIVE" : "⏸ System Ready"}
            </span>
          </div>
        </div>
      </button>

      {/* Helper text */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
          {isAnyMotorRunning ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-red-600 font-semibold animate-pulse">
                Click to immediately stop all motors
              </span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-gray-500" />
              <span>Emergency stop ready - stops all motors instantly</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
