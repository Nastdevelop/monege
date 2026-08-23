"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Coins,
  PiggyBank,
  BarChart3,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/dashboard/debts", label: "Utang", icon: Coins },
  { href: "/dashboard/savings", label: "Tabungan", icon: PiggyBank },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/15 text-accent"
                : "text-secondary hover:bg-surface-hover hover:text-primary"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-6">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                active ? "text-accent" : "text-secondary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
