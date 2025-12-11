"use client";

import {
  Gauge,
  ArrowRight,
  ArrowLeft,
  Play,
  Square,
  AlertOctagon,
  Zap,
  Activity,
} from "lucide-react";
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

    if (checked) {
      // When turning on, use current speed or default to 20 if 0
      const speedToUse = motor.speed === 0 ? 20 : motor.speed;
      updateMotor({ isOn: true, status: "running", speed: speedToUse });
      setLastCommand(`Started at ${timestamp} (speed: ${speedToUse})`);
      addLog({
        motor: motorName,
        event: "Started",
        voltage: motor.voltage,
        current: motor.current ?? undefined,
      });

      // Send speed command first, then start
      try {
        await motorService.setSpeed(motorLetter, speedToUse);
        await motorService.start(motorLetter);
      } catch (error) {
        console.error(`Failed to start ${motorName}:`, error);
      }
    } else {
      // Turn off motor
      updateMotor({ isOn: false, status: "stopped" });
      setLastCommand(`Stopped at ${timestamp}`);
      addLog({
        motor: motorName,
        event: "Stopped",
        voltage: motor.voltage,
        current: motor.current ?? undefined,
      });

      try {
        await motorService.stop(motorLetter);
      } catch (error) {
        console.error(`Failed to stop ${motorName}:`, error);
      }
    }
  };

  const handleSpeedChange = async (value: number) => {
    // Update UI immediately (works even when motor is off)
    updateMotor({ speed: value });
    const timestamp = new Date().toLocaleTimeString();
    setLastCommand(`Speed set to ${value} at ${timestamp}`);
    addLog({
      motor: motorName,
      event: "Speed Changed",
      voltage: motor.voltage,
      current: motor.current ?? undefined,
    });

    // Only send to ESP32 if motor is running
    if (motor.isOn) {
      try {
        await motorService.setSpeed(motorLetter, value);
      } catch (error) {
        console.error(`Failed to set speed for ${motorName}:`, error);
      }
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
  const currentAmps = currentValue; // Current is already in Amps from telemetry
  const loadPercentage = ((Math.abs(currentAmps) / 2) * 100).toFixed(1);
  const pwmPercentage = motor.speed.toFixed(0);

  // Calculate power in watts (V × A)
  const powerWatts = (motor.voltage * Math.abs(currentAmps)).toFixed(3);

  return (
    <Card
      className={
        motor.status === "jammed" ? "border-red-500 animate-pulse" : ""
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg relative ${
              motor.status === "jammed"
                ? "bg-red-100 animate-pulse"
                : motor.isOn
                ? "bg-primary/20"
                : "bg-light-200"
            }`}
          >
            {motor.status === "jammed" ? (
              <AlertOctagon className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
            ) : motor.isOn ? (
              <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-pulse" />
            ) : (
              <Square className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {motorName}
              </h3>
              {motor.isOn && (
                <Zap className="w-4 h-4 text-primary animate-pulse" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">Sohojpaat Roller</p>
            {lastCommand && (
              <p className="text-xs text-primary mt-1">{lastCommand}</p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Direction Control */}
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-sm text-gray-600">Direction:</span>
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
        <span className="text-xs text-gray-500 sm:ml-auto">
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
          max={100}
          label="Speed / PWM"
        />

        {/* Signal Bar Visualization */}
        <div className="flex items-end justify-center gap-1 mt-4 h-12">
          {[...Array(10)].map((_, index) => {
            const threshold = ((index + 1) / 10) * 100;
            const isActive = motor.speed >= threshold;
            const barHeight = ((index + 1) / 10) * 100;

            return (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ${
                  isActive
                    ? motor.speed > 75
                      ? "bg-red-500"
                      : motor.speed > 50
                      ? "bg-yellow-500"
                      : "bg-primary"
                    : "bg-gray-200"
                }`}
                style={{ height: `${barHeight}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="bg-light-100 p-3 sm:p-4 rounded-lg border border-light-300">
          <div className="flex items-center gap-2 mb-1">
            <Gauge size={16} className="text-primary" />
            <span className="text-xs text-gray-600">RPM</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {motor.rpm}
          </p>
        </div>

        <div className="bg-light-100 p-3 sm:p-4 rounded-lg border border-light-300">
          <span className="text-xs text-gray-600">Voltage</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {motor.voltage.toFixed(2)}{" "}
            <span className="text-sm text-gray-600">V</span>
          </p>
        </div>

        <div className="bg-light-100 p-3 sm:p-4 rounded-lg border border-light-300">
          <span className="text-xs text-gray-600">Current</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {Math.abs(currentAmps).toFixed(3)}{" "}
            <span className="text-sm text-gray-600">A</span>
          </p>
        </div>

        <div className="bg-light-100 p-3 sm:p-4 rounded-lg border border-light-300">
          <span className="text-xs text-gray-600">Power</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {powerWatts} <span className="text-sm text-gray-600">W</span>
          </p>
        </div>
      </div>

      {/* Load Bar */}
      <div className="w-full bg-light-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            parseFloat(loadPercentage) > 80
              ? "bg-red-500"
              : parseFloat(loadPercentage) > 50
              ? "bg-yellow-500"
              : "bg-primary"
          }`}
          style={{ width: `${Math.min(parseFloat(loadPercentage), 100)}%` }}
        />
      </div>
    </Card>
  );
};
