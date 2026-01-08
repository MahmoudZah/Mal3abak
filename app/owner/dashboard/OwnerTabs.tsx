'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, Calendar, Settings, PlusCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const tabs = [
  { href: '/owner/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/owner/dashboard/courts', label: 'الملاعب', icon: Building2 },
  { href: '/owner/dashboard/reservations', label: 'الحجوزات', icon: Calendar },
  { href: '/owner/dashboard/statistics', label: 'الإحصائيات', icon: BarChart3 },
  { href: '/owner/dashboard/book', label: 'حجز يدوي', icon: PlusCircle },
  { href: '/owner/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

export function OwnerTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Don't navigate if already on this tab
    if (pathname === href || (href !== '/owner/dashboard' && pathname.startsWith(href))) {
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
    <div className="border-b border-slate-800 bg-slate-900 sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <nav className="flex gap-1 overflow-x-auto py-3">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/owner/dashboard' && pathname.startsWith(tab.href));
            const isLoading = clickedTab === tab.href;
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={(e) => handleTabClick(e, tab.href)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive && !isLoading
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  isLoading && 'bg-emerald-600 text-white'
                )}
              >
                <tab.icon className={cn('w-4 h-4', isLoading && 'animate-pulse')} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
