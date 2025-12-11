"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert } from "./UI";
import useStore from "@/store/useStore";
import { format } from "date-fns";

export const JamAlert = () => {
  // Alert notifications are now disabled
  return null;
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
      const currentValue = motorA.current || 0;
      const isCurrentSpike = currentValue > settings.maxCurrentThreshold;
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
          current: currentValue,
          duration: "N/A",
        });
      }
    }

    // Check Motor B for jam
    if (motorB.isOn) {
      const currentValue = motorB.current || 0;
      const isCurrentSpike = currentValue > settings.maxCurrentThreshold;
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
          current: currentValue,
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
