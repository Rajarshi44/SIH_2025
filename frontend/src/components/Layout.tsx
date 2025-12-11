"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Settings,
  Menu,
  X,
  BarChart3,
  Gauge,
  ScrollText,
  Sliders,
} from "lucide-react";
import Image from "next/image";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { path: "/dashboard", icon: Gauge, label: "Dashboard" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/logs", icon: ScrollText, label: "Logs" },
    { path: "/settings", icon: Sliders, label: "Settings" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-light-100 text-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-light-300 shadow-md"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-light-300 shadow-lg
          transform transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 relative bg-primary rounded-lg p-1">
              <Image
                src="/icon.jpg"
                alt="Sohojpaat Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Sohojpaat</h1>
              <p className="text-xs text-gray-500">IoT Dashboard</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${
                    isActive(item.path)
                      ? "bg-primary text-white font-semibold shadow-md"
                      : "text-gray-600 hover:bg-light-200 hover:text-gray-900"
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-light-300">
          <div className="text-xs text-gray-500">
            <p>SohojPaat IoT Platform</p>
            <p className="text-primary font-semibold">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
};
