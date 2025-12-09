"use client";

import { useState } from "react";
import { Card } from "./UI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Pause, Play, Download } from "lucide-react";
import { Button } from "./UI";
import useStore from "@/store/useStore";

export const RealtimeCharts = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [timeWindow, setTimeWindow] = useState<"30s" | "1m" | "5m" | "15m">(
    "1m"
  );

  const motorA = useStore((state) => state.motorA);
  const motorB = useStore((state) => state.motorB);
  const historyA = useStore((state) => state.history.motorA);
  const historyB = useStore((state) => state.history.motorB);

  const getTimeWindowData = (history: typeof historyA) => {
    const windows = { "30s": 30, "1m": 60, "5m": 300, "15m": 900 };
    const points = windows[timeWindow];
    const length = history.voltage.length;
    const start = Math.max(0, length - points);

    return Array.from({ length: Math.min(points, length) }, (_, i) => ({
      time: i,
      voltage: history.voltage[start + i] || 0,
      current: (history.current[start + i] || 0) / 1000, // Convert to A
      rpm: history.rpm[start + i] || 0,
      pwm: i === length - 1 ? motorA.speed || motorB.speed : 0,
    }));
  };

  const exportToPNG = (chartId: string) => {
    // TODO: Implement chart export to PNG
    console.log(`Exporting ${chartId} to PNG`);
  };

  const dataA = getTimeWindowData(historyA);
  const dataB = getTimeWindowData(historyB);

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Real-time Monitoring</h2>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {(["30s", "1m", "5m", "15m"] as const).map((window) => (
              <button
                key={window}
                onClick={() => setTimeWindow(window)}
                className={`px-3 py-1 rounded text-sm ${
                  timeWindow === window
                    ? "bg-neon text-dark-900"
                    : "bg-dark-700 text-gray-400 hover:bg-dark-600"
                }`}
              >
                {window}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motor A Charts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neon">Motor A</h3>

          <div className="bg-dark-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Voltage & Current</span>
              <button
                onClick={() => exportToPNG("motorA-vc")}
                className="text-gray-400 hover:text-neon"
              >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232e3f" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #232e3f",
                  }}
                  labelStyle={{ color: "#B6FF00" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="#B6FF00"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">RPM</span>
              <button
                onClick={() => exportToPNG("motorA-rpm")}
                className="text-gray-400 hover:text-neon"
              >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232e3f" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #232e3f",
                  }}
                  labelStyle={{ color: "#B6FF00" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Motor B Charts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neon">Motor B</h3>

          <div className="bg-dark-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Voltage & Current</span>
              <button
                onClick={() => exportToPNG("motorB-vc")}
                className="text-gray-400 hover:text-neon"
              >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataB}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232e3f" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #232e3f",
                  }}
                  labelStyle={{ color: "#B6FF00" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="voltage"
                  stroke="#B6FF00"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">RPM</span>
              <button
                onClick={() => exportToPNG("motorB-rpm")}
                className="text-gray-400 hover:text-neon"
              >
                <Download size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataB}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232e3f" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0e1a",
                    border: "1px solid #232e3f",
                  }}
                  labelStyle={{ color: "#B6FF00" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
};
