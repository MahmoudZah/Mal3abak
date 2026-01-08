"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
} from "lucide-react";
import { useState } from "react";

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
  const router = useRouter();
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Don't navigate if already on this tab
    if (pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href))) {
      return;
    }
    
    // Set loading state immediately
    setClickedTab(href);
    
    // Navigate after a tiny delay to ensure loading state is shown
    setTimeout(() => {
      router.push(href);
      // Reset clicked state after navigation starts
      setTimeout(() => setClickedTab(null), 100);
    }, 50);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex gap-1 overflow-x-auto" dir="rtl">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== "/admin/dashboard" && pathname.startsWith(tab.href));
            const isLoading = clickedTab === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive && !isLoading
                    ? "text-emerald-500 border-emerald-500"
                    : "text-slate-400 border-transparent hover:text-white hover:border-slate-600",
                  isLoading && "text-emerald-400 border-emerald-400"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isLoading && "animate-pulse")} />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

