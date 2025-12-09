"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./UI";
import { motorService } from "@/services/api";
import useStore from "@/store/useStore";
import { toast } from "sonner";
import { useState } from "react";

export const EmergencyStop = () => {
  const [isStopping, setIsStopping] = useState(false);
  const updateMotorA = useStore((state) => state.updateMotorA);
  const updateMotorB = useStore((state) => state.updateMotorB);
  const addLog = useStore((state) => state.addLog);

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

      toast.error("EMERGENCY STOP ACTIVATED", {
        description: "All motors have been stopped",
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
    <Button
      variant="danger"
      size="lg"
      onClick={handleEmergencyStop}
      disabled={isStopping}
      className="flex items-center gap-2 animate-pulse"
    >
      <AlertTriangle size={24} />
      {isStopping ? "STOPPING..." : "EMERGENCY STOP"}
    </Button>
  );
};
