"use client";

import { useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Trash2,
  Moon,
  Sun,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, Button, Toggle, Slider } from "@/components/UI";
import { Layout } from "@/components/Layout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import useStore from "@/store/useStore";
import { toast } from "sonner";

export default function SettingsPage() {
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const clearLogs = useStore((state) => state.clearLogs);
  const logs = useStore((state) => state.logs);

  const [localSettings, setLocalSettings] = useState({
    ...settings,
    refreshRate: 1000, // Default 1 second
    chartUpdateRate: 500, // Default 0.5 seconds
  });
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    toast.success("Settings saved successfully!", {
      icon: <CheckCircle className="w-5 h-5" />,
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaultSettings = {
      apiEndpoint: "http://192.168.1.100",
      wsEndpoint: "ws://192.168.1.100:81",
      maxCurrentThreshold: 1800,
      rpmJamThreshold: 50,
      theme: "dark",
      refreshRate: 1000,
      chartUpdateRate: 500,
    };
    setLocalSettings(defaultSettings);
    toast.info("Settings reset to defaults", {
      icon: <RefreshCw className="w-5 h-5" />,
    });
  };

  const handleClearLogs = () => {
    if (
      confirm(`Are you sure you want to delete all ${logs.length} log entries?`)
    ) {
      clearLogs();
      toast.success("All logs cleared", {
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setLocalSettings({ ...localSettings, theme: newTheme });
    toast.info(`Theme switched to ${newTheme} mode`, {
      icon:
        newTheme === "light" ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        ),
    });
  };

  return (
    <WebSocketProvider>
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="text-primary" size={28} />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Settings
            </h1>
          </div>

          {/* API Configuration */}
          <Card>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              API Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  REST API Endpoint
                </label>
                <input
                  type="text"
                  value={localSettings.apiEndpoint}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiEndpoint: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-light-300 rounded-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="http://192.168.1.100"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Base URL for REST API calls
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WebSocket Endpoint
                </label>
                <input
                  type="text"
                  value={localSettings.wsEndpoint}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      wsEndpoint: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-light-300 rounded-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="ws://192.168.1.100:81"
                />
                <p className="text-xs text-gray-600 mt-1">
                  WebSocket URL for real-time data streaming
                </p>
              </div>
            </div>
          </Card>

          {/* Jam Detection Settings */}
          <Card>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Jam Detection
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Current Threshold (mA)
                </label>
                <input
                  type="number"
                  value={localSettings.maxCurrentThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      maxCurrentThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-light-300 rounded-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="500"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Trigger jam alert when current exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RPM Jam Threshold
                </label>
                <input
                  type="number"
                  value={localSettings.rpmJamThreshold}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      rpmJamThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-light-300 rounded-lg text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="50"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Trigger jam alert when RPM falls below this value while motor
                  is running
                </p>
              </div>
            </div>
          </Card>

          {/* Theme Settings */}
          <Card>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="text-primary" size={24} />
              ) : (
                <Sun className="text-yellow-500" size={24} />
              )}
              Appearance
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900 font-medium">Theme Mode</p>
                  <p className="text-xs text-gray-600">
                    Switch between dark and light theme
                  </p>
                </div>
                <Button
                  onClick={toggleTheme}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Performance Settings */}
          <Card>
            <h2 className="text-xl font-bold text-white mb-4">Performance</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Data Refresh Rate: {localSettings.refreshRate}ms
                </label>
                <Slider
                  value={localSettings.refreshRate}
                  onChange={(value) =>
                    setLocalSettings({ ...localSettings, refreshRate: value })
                  }
                  min={100}
                  max={5000}
                  label=""
                />
                <p className="text-xs text-gray-400 mt-2">
                  How often to fetch new data from ESP32 (100ms - 5000ms)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Chart Update Rate: {localSettings.chartUpdateRate}ms
                </label>
                <Slider
                  value={localSettings.chartUpdateRate}
                  onChange={(value) =>
                    setLocalSettings({
                      ...localSettings,
                      chartUpdateRate: value,
                    })
                  }
                  min={100}
                  max={2000}
                  label=""
                />
                <p className="text-xs text-gray-400 mt-2">
                  How often to redraw charts (100ms - 2000ms)
                </p>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/30 bg-red-500/5">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Clear All Logs</p>
                  <p className="text-xs text-gray-400">
                    Delete all {logs.length} log entries permanently
                  </p>
                </div>
                <Button
                  onClick={handleClearLogs}
                  variant="danger"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Clear Logs
                </Button>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 flex-1"
            >
              <Save size={16} />
              {saved ? "Saved!" : "Save Settings"}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Reset to Default
            </Button>
          </div>

          {/* Info Box */}
          <Card className="bg-neon/5 border-neon/20">
            <p className="text-sm text-gray-300">
              <strong className="text-neon">Note:</strong> Changes to API
              endpoints will take effect after reconnecting. WebSocket will
              automatically reconnect with new settings.
            </p>
          </Card>
        </div>
      </Layout>
    </WebSocketProvider>
  );
}
