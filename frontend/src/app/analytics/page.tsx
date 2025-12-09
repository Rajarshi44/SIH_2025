"use client";

import { Layout } from "@/components/Layout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { Card, Badge } from "@/components/UI";
import useStore from "@/store/useStore";
import { Activity, Zap, AlertTriangle, TrendingUp, Wrench } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const motorA = useStore((state) => state.motorA);
  const motorB = useStore((state) => state.motorB);
  const logs = useStore((state) => state.logs);
  const system = useStore((state) => state.system);

  // Calculate statistics
  const jamCount = logs.filter((log) => log.event.includes("Jam")).length;
  const totalRuntime = system.uptime;
  const motorARuntime =
    logs.filter((log) => log.motor === "Motor A" && log.event === "Started")
      .length * 60; // Estimate
  const motorBRuntime =
    logs.filter((log) => log.motor === "Motor B" && log.event === "Started")
      .length * 60;

  const energyEstimate = (
    (((motorA.current + motorB.current) * (motorA.voltage + motorB.voltage)) /
      2000) *
    (totalRuntime / 3600)
  ).toFixed(2);

  // Motor health score (0-100)
  const calculateHealthScore = (motor: typeof motorA) => {
    let score = 100;
    if (motor.current > 1500) score -= 20;
    if (motor.status === "jammed") score -= 30;
    if (motor.rpm < 100 && motor.isOn) score -= 15;
    return Math.max(score, 0);
  };

  const healthA = calculateHealthScore(motorA);
  const healthB = calculateHealthScore(motorB);

  const usageData = [
    { name: "Motor A", value: motorARuntime, fill: "#B6FF00" },
    { name: "Motor B", value: motorBRuntime, fill: "#3b82f6" },
  ];

  const loadTrendData = logs.slice(-20).map((log, i) => ({
    time: i,
    current: log.current,
  }));

  return (
    <WebSocketProvider>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Performance metrics and system insights
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-neon/20 rounded-lg">
                  <Activity className="text-neon" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Runtime</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.floor(totalRuntime / 60)}m
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Jams Today</p>
                  <p className="text-2xl font-bold text-white">{jamCount}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Zap className="text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Energy Used</p>
                  <p className="text-2xl font-bold text-white">
                    {energyEstimate} Wh
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-dark-800 to-dark-900">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg Load</p>
                  <p className="text-2xl font-bold text-white">
                    {((motorA.current + motorB.current) / 40).toFixed(0)}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Motor Health Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">
                Motor A Health
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#232e3f"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        healthA > 70
                          ? "#B6FF00"
                          : healthA > 40
                          ? "#fbbf24"
                          : "#ef4444"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${healthA * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {healthA}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        Current Status
                      </span>
                      <Badge
                        variant={
                          motorA.status === "running" ? "success" : "default"
                        }
                      >
                        {motorA.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Avg Current</span>
                      <span className="text-white">
                        {motorA.current.toFixed(0)} mA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Peak Load</span>
                      <span className="text-white">
                        {((motorA.current / 2000) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-white mb-4">
                Motor B Health
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#232e3f"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        healthB > 70
                          ? "#B6FF00"
                          : healthB > 40
                          ? "#fbbf24"
                          : "#ef4444"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${healthB * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {healthB}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        Current Status
                      </span>
                      <Badge
                        variant={
                          motorB.status === "running" ? "success" : "default"
                        }
                      >
                        {motorB.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Avg Current</span>
                      <span className="text-white">
                        {motorB.current.toFixed(0)} mA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Peak Load</span>
                      <span className="text-white">
                        {((motorB.current / 2000) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-xl font-bold text-white mb-4">
                Motor Usage Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {usageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-xl font-bold text-white mb-4">Load Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={loadTrendData}>
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
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="#B6FF00"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Maintenance Prediction */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="text-neon" size={24} />
              <h3 className="text-xl font-bold text-white">
                Maintenance Predictions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Lubrication Due</p>
                <Badge variant={totalRuntime > 86400 ? "warning" : "success"}>
                  {totalRuntime > 86400 ? "Soon" : "OK"}
                </Badge>
              </div>
              <div className="bg-dark-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Abnormal Current</p>
                <Badge
                  variant={
                    motorA.current > 1500 || motorB.current > 1500
                      ? "danger"
                      : "success"
                  }
                >
                  {motorA.current > 1500 || motorB.current > 1500
                    ? "Detected"
                    : "Normal"}
                </Badge>
              </div>
              <div className="bg-dark-700 p-4 rounded-lg">
                <p className="text-gray-400 text-sm mb-2">Repeated Jams</p>
                <Badge
                  variant={
                    jamCount > 5
                      ? "danger"
                      : jamCount > 2
                      ? "warning"
                      : "success"
                  }
                >
                  {jamCount > 5
                    ? "Critical"
                    : jamCount > 2
                    ? "Warning"
                    : "Normal"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    </WebSocketProvider>
  );
}
