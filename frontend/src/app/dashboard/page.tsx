"use client";

import { MotorControl } from "@/components/MotorControl";
import { SystemHealth } from "@/components/SystemHealth";
import { JamDetector } from "@/components/JamDetector";
import { Layout } from "@/components/Layout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { RealtimeCharts } from "@/components/RealtimeCharts";
import { EmergencyStop } from "@/components/EmergencyStop";
import { Toaster } from "sonner";

export default function DashboardPage() {
  return (
    <WebSocketProvider>
      <Layout>
        <Toaster position="top-right" theme="dark" />
        <JamDetector />
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Sohojpaat Machine Dashboard
              </h1>
              <p className="text-gray-400">
                Experience effortless jute ribboning with intelligent automation
              </p>
            </div>
            <EmergencyStop />
          </div>

          {/* Motor Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MotorControl motorId="motorA" />
            <MotorControl motorId="motorB" />
          </div>

          {/* Real-time Charts */}
          <RealtimeCharts />

          {/* System Health */}
          <div>
            <SystemHealth />
          </div>
        </div>
      </Layout>
    </WebSocketProvider>
  );
}
