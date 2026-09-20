"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/portfolio", label: "Portfolio", icon: "📁" },
  { href: "/dashboard", label: "Dashboard", icon: "📈" },
  { href: "/risk", label: "Risk", icon: "⚠️" },
  { href: "/alerts", label: "Alerts", icon: "🚨" },
  { href: "/forecast", label: "Forecast", icon: "🤖" },
  { href: "/trace", label: "Trace", icon: "🔍" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-lg mb-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            📊 Portfolio Monitor
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
