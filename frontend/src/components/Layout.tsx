"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Settings, Menu, X, BarChart3 } from "lucide-react";
import Image from "next/image";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/logs", icon: FileText, label: "Logs" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg border border-dark-600"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-600 
          transform transition-transform duration-300 z-40
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 relative bg-white rounded-lg p-1">
              <Image
                src="/icon.jpg"
                alt="Sohojpaat Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Sohojpaat</h1>
              <p className="text-xs text-gray-400">IoT Dashboard</p>
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
                      ? "bg-neon text-dark-900 font-semibold"
                      : "text-gray-400 hover:bg-dark-700 hover:text-white"
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
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-dark-600">
          <div className="text-xs text-gray-400">
            <p>SohojPaat IoT Platform</p>
            <p className="text-neon">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">{children}</main>
    </div>
  );
};
