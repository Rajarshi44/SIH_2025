"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert } from "./UI";
import useStore from "@/store/useStore";
import { format } from "date-fns";
import { toast } from "sonner";

export const JamAlert = () => {
  const jamAlerts = useStore((state) => state.jamAlerts);
  const clearJamAlert = useStore((state) => state.clearJamAlert);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [jamDurations, setJamDurations] = useState<Record<string, number>>({});
  const shownAlerts = useRef<Set<number>>(new Set());

  useEffect(() => {
    jamAlerts.forEach((alert) => {
      if (!shownAlerts.current.has(alert.id)) {
        shownAlerts.current.add(alert.id);
        
        // Play audio
        if (audioRef.current) {
          audioRef.current
            .play()
            .catch((e) => console.log("Audio play failed:", e));
        }

        // Show toast notification
        toast.error("JAM DETECTED!", {
          description: `${alert.motor} has jammed`,
          duration: 2000,
        });
      }
    });
  }, [jamAlerts]);

  // Track jam duration
  useEffect(() => {
    const interval = setInterval(() => {
      setJamDurations((prev) => {
        const updated = { ...prev };
        jamAlerts.forEach((alert) => {
          const duration = Math.floor(
            (Date.now() - alert.timestamp.getTime()) / 1000
          );
          updated[alert.id] = duration;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [jamAlerts]);

  if (jamAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <audio ref={audioRef} src="/sounds/alert.mp3" loop />

      {jamAlerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={alert.severity === "severe" ? "danger" : "warning"}
          className="animate-shake shadow-2xl border-2"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={24}
              className={`${
                alert.severity === "severe" ? "text-red-400" : "text-yellow-400"
              } animate-pulse`}
            />
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">JAM DETECTED!</h4>
              <p className="text-sm mb-2">{alert.motor} is jammed</p>
              <div className="text-xs opacity-80 space-y-1">
                <p>Time: {format(alert.timestamp, "HH:mm:ss")}</p>
                <p className="text-red-400 font-bold">
                  Duration: {jamDurations[alert.id] || 0}s
                </p>
                {alert.reason && <p>Reason: {alert.reason}</p>}
              </div>
            </div>
            <button
              onClick={() => clearJamAlert(alert.id)}
              className="text-current hover:opacity-70"
            >
              <X size={20} />
            </button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export const JamDetector = () => {
  const motorA = useStore((state) => state.motorA);
  const motorB = useStore((state) => state.motorB);
  const settings = useStore((state) => state.settings);
  const addJamAlert = useStore((state) => state.addJamAlert);
  const updateMotorA = useStore((state) => state.updateMotorA);
  const updateMotorB = useStore((state) => state.updateMotorB);
  const addLog = useStore((state) => state.addLog);

  useEffect(() => {
    // Check Motor A for jam
    if (motorA.isOn) {
      const isCurrentSpike = motorA.current > settings.maxCurrentThreshold;
      const isRpmZero = motorA.rpm < settings.rpmJamThreshold;

      if ((isCurrentSpike || isRpmZero) && motorA.status !== "jammed") {
        const reason = isCurrentSpike
          ? "Current spike detected"
          : "RPM dropped to zero";
        updateMotorA({ status: "jammed" });
        addJamAlert({
          motor: "Motor A",
          severity: isCurrentSpike ? "severe" : "warning",
          reason,
        });
        addLog({
          motor: "Motor A",
          event: "Jam Detected",
          voltage: motorA.voltage,
          current: motorA.current,
          duration: "N/A",
        });
      }
    }

    // Check Motor B for jam
    if (motorB.isOn) {
      const isCurrentSpike = motorB.current > settings.maxCurrentThreshold;
      const isRpmZero = motorB.rpm < settings.rpmJamThreshold;

      if ((isCurrentSpike || isRpmZero) && motorB.status !== "jammed") {
        const reason = isCurrentSpike
          ? "Current spike detected"
          : "RPM dropped to zero";
        updateMotorB({ status: "jammed" });
        addJamAlert({
          motor: "Motor B",
          severity: isCurrentSpike ? "severe" : "warning",
          reason,
        });
        addLog({
          motor: "Motor B",
          event: "Jam Detected",
          voltage: motorB.voltage,
          current: motorB.current,
          duration: "N/A",
        });
      }
    }
  }, [
    motorA,
    motorB,
    settings,
    addJamAlert,
    updateMotorA,
    updateMotorB,
    addLog,
  ]);

  return <JamAlert />;
};
