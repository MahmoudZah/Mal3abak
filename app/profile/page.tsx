'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { User, Phone, Lock, Mail, Save, ArrowRight, LogOut } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setName(data.user.name);
        setPhone(data.user.phone || '');
        setLoading(false);
      })
      .catch(() => {
        router.push('/login?redirect=/profile');
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password change
    if (newPassword && newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ');
      }

      setUser(data.user);
      setSuccess('تم تحديث البيانات بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href={user?.role === 'OWNER' ? '/owner/dashboard' : '/player/dashboard'} className="text-slate-400 hover:text-white flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Link>
            <h1 className="text-3xl font-bold text-white">الملف الشخصي</h1>
            <p className="text-slate-400 mt-2">قم بتعديل بياناتك الشخصية</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">البيانات الأساسية</h2>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-slate-400 cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">الاسم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="اسمك الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="01012345678"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">تغيير كلمة المرور</h2>
              <p className="text-slate-400 text-sm mb-4">اتركها فارغة إذا لم تريد تغيير كلمة المرور</p>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">كلمة المرور الحالية</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 h-12" isLoading={saving}>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </Button>
              <Button type="button" variant="danger" className="h-12" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}

