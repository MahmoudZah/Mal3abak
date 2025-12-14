'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ShieldCheck, User, LogOut, LayoutDashboard, Menu, X, ChevronDown, Settings } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setDropdownOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-emerald-500">
            ملعبك
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link href="/map" className="hover:text-emerald-400 transition-colors">
              تصفح الملاعب
            </Link>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 bg-slate-800 animate-pulse rounded-lg" />
          ) : user ? (
            <>
              {user.role === 'OWNER' ? (
                <Link href="/owner/dashboard">
                  <Button variant="ghost" size="sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>لوحة التحكم</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/player/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>حجوزاتي</span>
                  </Button>
                </Link>
              )}
              
              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-slate-200 text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-white font-medium text-sm truncate">{user.name}</p>
                      <p className="text-slate-500 text-xs truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>الملف الشخصي</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  <User className="w-4 h-4" />
                  <span>إنشاء حساب</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 p-4 space-y-3">
          <Link href="/map" className="block py-2 text-slate-300 hover:text-emerald-400">
            تصفح الملاعب
          </Link>
          {user ? (
            <>
              <div className="py-2 text-slate-400 text-sm border-t border-slate-800 mt-2 pt-4">
                مرحباً، {user.name}
              </div>
              {user.role === 'OWNER' ? (
                <Link href="/owner/dashboard" className="block py-2 text-slate-300 hover:text-emerald-400">
                  لوحة التحكم
                </Link>
              ) : (
                <Link href="/player/dashboard" className="block py-2 text-slate-300 hover:text-emerald-400">
                  حجوزاتي
                </Link>
              )}
              <Link href="/profile" className="block py-2 text-slate-300 hover:text-emerald-400">
                الملف الشخصي
              </Link>
              <button onClick={handleLogout} className="block py-2 text-red-400 hover:text-red-300">
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 text-slate-300 hover:text-emerald-400">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="block py-2 text-emerald-400 hover:text-emerald-300">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
