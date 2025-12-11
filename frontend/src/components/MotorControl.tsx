"use client";

import { Gauge, ArrowRight, ArrowLeft } from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Card, Badge, Toggle, Slider, Button } from "./UI";
import { motorService } from "@/services/api";
import useStore from "@/store/useStore";
import { useState } from "react";

interface MotorControlProps {
  motorId: "motorA" | "motorB";
}

export const MotorControl = ({ motorId }: MotorControlProps) => {
  const motor = useStore((state) => state[motorId]);
  const updateMotor = useStore((state) =>
    motorId === "motorA" ? state.updateMotorA : state.updateMotorB
  );
  const addLog = useStore((state) => state.addLog);
  const [direction, setDirection] = useState<"forward" | "reverse">("forward");
  const [lastCommand, setLastCommand] = useState<string>("");

  const motorName = motorId === "motorA" ? "Motor A" : "Motor B";
  const motorLetter = motorId === "motorA" ? "a" : "b";

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const timestamp = new Date().toLocaleTimeString();

    // Update UI immediately
    updateMotor({ isOn: checked, status: checked ? "running" : "stopped" });
    setLastCommand(`${checked ? "Started" : "Stopped"} at ${timestamp}`);
    addLog({
      motor: motorName,
      event: checked ? "Started" : "Stopped",
      voltage: motor.voltage,
      current: motor.current ?? undefined,
    });

    // Try API call in background
    try {
      if (checked) {
        await motorService.start(motorLetter);
      } else {
        await motorService.stop(motorLetter);
      }
    } catch (error) {
      console.error(`Failed to toggle ${motorName}:`, error);
      // Keep UI updated even if API fails (for demo/testing)
    }
  };

  const handleSpeedChange = async (value: number) => {
    // Update UI immediately
    updateMotor({ speed: value });
    const timestamp = new Date().toLocaleTimeString();
    setLastCommand(`Speed changed to ${value} at ${timestamp}`);
    addLog({
      motor: motorName,
      event: "Speed Changed",
      voltage: motor.voltage,
      current: motor.current ?? undefined,
    });

    // Try API call in background
    try {
      await motorService.setSpeed(motorLetter, value);
    } catch (error) {
      console.error(`Failed to set speed for ${motorName}:`, error);
      // Keep UI updated even if API fails
    }
  };

  const handleDirectionToggle = async () => {
    const newDirection = direction === "forward" ? "reverse" : "forward";
    setDirection(newDirection);
    const timestamp = new Date().toLocaleTimeString();
    setLastCommand(`Direction: ${newDirection} at ${timestamp}`);
    addLog({
      motor: motorName,
      event: `Direction: ${newDirection}`,
      voltage: motor.voltage,
      current: motor.current ?? undefined,
    });

    // Send direction command to ESP32
    try {
      await motorService.setDirection(motorLetter, newDirection);
    } catch (error) {
      console.error("Failed to set direction:", error);
    }
  };

  const getStatusBadge = () => {
    switch (motor.status) {
      case "running":
        return <Badge variant="success">Running</Badge>;
      case "jammed":
        return <Badge variant="danger">Jammed</Badge>;
      default:
        return <Badge variant="default">Stopped</Badge>;
    }
  };

  // Calculate load percentage based on max current threshold (2A = 2000mA)
  const currentValue = motor.current || 0;
  const loadPercentage = ((Math.abs(currentValue) / 2000) * 100).toFixed(1);
  const pwmPercentage = ((motor.speed / 255) * 100).toFixed(0);

  // Calculate power in watts (V × A)
  const powerWatts = motor.load ? motor.load.toFixed(3) : "0.000";

  return (
    <Card
      className={
        motor.status === "jammed" ? "border-red-500 animate-pulse" : ""
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              motor.isOn ? "bg-neon/20" : "bg-dark-700"
            }`}
          >
            <DotLottieReact
              src="/animations/Gears Animation.lottie"
              loop
              autoplay={motor.isOn}
              className="w-12 h-12"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{motorName}</h3>
            <p className="text-sm text-gray-400">Sohojpaat Roller</p>
            {lastCommand && (
              <p className="text-xs text-neon mt-1">{lastCommand}</p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Direction Control */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-gray-400">Direction:</span>
        <Button
          variant={direction === "forward" ? "primary" : "ghost"}
          size="sm"
          onClick={handleDirectionToggle}
          disabled={motor.isOn}
          className="flex items-center gap-2"
        >
          {direction === "forward" ? (
            <ArrowRight size={16} />
          ) : (
            <ArrowLeft size={16} />
          )}
          {direction === "forward" ? "Forward" : "Reverse"}
        </Button>
        <span className="text-xs text-gray-500 ml-auto">
          PWM: {pwmPercentage}%
        </span>
      </div>

      <div className="mb-6">
        <Toggle
          checked={motor.isOn}
          onChange={handleToggle}
          label={motor.isOn ? "Motor Running" : "Motor Stopped"}
        />
      </div>

      <div className="mb-6">
        <Slider
          value={motor.speed}
          onChange={handleSpeedChange}
          min={0}
          max={255}
          label="Speed / PWM"
          disabled={!motor.isOn}
        />
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-dark-700 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={16} className="text-neon" />
            <span className="text-xs text-gray-400">RPM</span>
          </div>
          <p className="text-2xl font-bold text-white">{motor.rpm}</p>
        </div>

        <div className="bg-dark-700 p-4 rounded-lg">
          <span className="text-xs text-gray-400">Voltage</span>
          <p className="text-2xl font-bold text-white">
            {motor.voltage.toFixed(2)}{" "}
            <span className="text-sm text-gray-400">V</span>
          </p>
        </div>

        <div className="bg-dark-700 p-4 rounded-lg">
          <span className="text-xs text-gray-400">Current</span>
          <p className="text-2xl font-bold text-white">
            {currentValue.toFixed(1)}{" "}
            <span className="text-sm text-gray-400">mA</span>
          </p>
        </div>

        <div className="bg-dark-700 p-4 rounded-lg">
          <span className="text-xs text-gray-400">Power</span>
          <p className="text-2xl font-bold text-white">
            {powerWatts} <span className="text-sm text-gray-400">W</span>
          </p>
        </div>
      </div>

      {/* Load Bar */}
      <div className="w-full bg-dark-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            parseFloat(loadPercentage) > 80
              ? "bg-red-500"
              : parseFloat(loadPercentage) > 50
              ? "bg-yellow-500"
              : "bg-neon"
          }`}
          style={{ width: `${Math.min(parseFloat(loadPercentage), 100)}%` }}
        />
      </div>
    </Card>
  );
};
