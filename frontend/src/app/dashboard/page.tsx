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
        <Toaster position="top-right" theme="light" />

        <JamDetector />
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Sohojpaat Machine Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Experience effortless jute ribboning with intelligent automation
              </p>
            </div>
            <EmergencyStop />
          </div>
          <div>
            <SystemHealth />
          </div>

          {/* Motor Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <MotorControl motorId="motorA" />
            <MotorControl motorId="motorB" />
          </div>

          {/* Real-time Charts */}
          <RealtimeCharts />

          {/* System Health with LED Control */}
        </div>
      </Layout>
    </WebSocketProvider>
  );
}
