"use client";

import { useState } from "react";
import {
  Download,
  Filter,
  Search,
  Play,
  Square,
  AlertOctagon,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Card, Button, Badge } from "@/components/UI";
import { Layout } from "@/components/Layout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import useStore from "@/store/useStore";
import { format } from "date-fns";

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvent, setFilterEvent] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.motor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.event.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterEvent === "all" || log.event === filterEvent;

    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const headers = [
      "Timestamp",
      "Motor",
      "Event",
      "Voltage",
      "Current",
      "Duration",
    ];
    const csvData = filteredLogs.map((log) => [
      format(log.timestamp, "yyyy-MM-dd HH:mm:ss"),
      log.motor,
      log.event,
      log.voltage,
      log.current,
      log.duration || "N/A",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `motor-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const eventTypes = [
    "all",
    "Started",
    "Stopped",
    "Speed Changed",
    "Jam Detected",
  ];

  const getEventBadge = (event: string) => {
    switch (event) {
      case "Started":
        return (
          <Badge variant="success">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" fill="currentColor" />
              {event}
            </span>
          </Badge>
        );
      case "Stopped":
        return (
          <Badge variant="default">
            <span className="flex items-center gap-1">
              <Square className="w-3 h-3" fill="currentColor" />
              {event}
            </span>
          </Badge>
        );
      case "Jam Detected":
        return (
          <Badge variant="danger">
            <span className="flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              {event}
            </span>
          </Badge>
        );
      case "Speed Changed":
        return (
          <Badge variant="neon">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {event}
            </span>
          </Badge>
        );
      default:
        return (
          <Badge>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {event}
            </span>
          </Badge>
        );
    }
  };

  return (
    <WebSocketProvider>
      <Layout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Event Logs
            </h1>
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <Download size={16} />
              <span className="hidden sm:inline">Export to CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>

          <Card>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-light-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                <Filter className="text-gray-500 my-auto" size={20} />
                {eventTypes.map((event) => (
                  <Button
                    key={event}
                    variant={filterEvent === event ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setFilterEvent(event)}
                  >
                    {event}
                  </Button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-light-300">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Motor
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Event
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Voltage
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Current
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-600">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        No logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-light-200 hover:bg-light-100 transition-colors"
                      >
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 font-mono">
                          {format(log.timestamp, "MMM dd, HH:mm:ss")}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 font-semibold">
                          {log.motor}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          {getEventBadge(log.event)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-gray-900">
                          {log.voltage?.toFixed(2) || "N/A"} V
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-gray-900">
                          {log.current?.toFixed(0) || "N/A"} mA
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-gray-700">
                          {log.duration || "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex-1 bg-light-100 p-3 rounded-lg border border-light-300">
                <p className="text-xs text-gray-600">Total Logs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {logs.length}
                </p>
              </div>
              <div className="flex-1 bg-light-100 p-3 rounded-lg border border-light-300">
                <p className="text-xs text-gray-600">Showing</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {filteredLogs.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    </WebSocketProvider>
  );
}
