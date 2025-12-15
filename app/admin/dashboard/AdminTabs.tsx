"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
} from "lucide-react";

const tabs = [
  {
    name: "لوحة التحكم",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "المستخدمين",
    href: "/admin/dashboard/users",
    icon: Users,
  },
  {
    name: "الملاعب",
    href: "/admin/dashboard/courts",
    icon: Building2,
  },
  {
    name: "الحجوزات",
    href: "/admin/dashboard/reservations",
    icon: CalendarCheck,
  },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-1 overflow-x-auto" dir="rtl">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/admin/dashboard" && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "text-emerald-500 border-emerald-500"
                    : "text-slate-400 border-transparent hover:text-white hover:border-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

