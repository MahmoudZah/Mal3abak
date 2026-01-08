import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Wallet, Calendar, BarChart3, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Format time in 12-hour format
function formatTime12h(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? 'م' : 'ص';
  const hour12 = hours % 12 || 12;
  return `${hour12}:00 ${period}`;
}

export default async function OwnerDashboardOverview() {
  const user = await getCurrentUser();
  if (!user) return null;

  const owner = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      courts: {
        include: {
          fields: {
            include: {
              reservations: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      }
    }
  });

  if (!owner) return null;

  // Calculate date ranges
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Start and end of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Calculate Stats
  let monthlyRevenue = 0;
  let monthlyReservations = 0;
  let totalFields = 0;
  const recentReservations: Array<{
    id: string;
    courtName: string;
    fieldName: string;
    userName: string | null;
    visitorName: string | null;
    startTime: Date;
    endTime: Date;
    totalPrice: number;
    status: string;
  }> = [];

  owner.courts.forEach(court => {
    court.fields.forEach(field => {
      totalFields++;
      field.reservations.forEach(res => {
        const resDate = new Date(res.startTime);
        
        // Count monthly stats
        if (resDate >= monthStart && resDate <= monthEnd) {
          monthlyReservations++;
          monthlyRevenue += res.totalPrice;
        }
        
        // Collect all reservations for recent list
        recentReservations.push({
          id: res.id,
          courtName: court.name,
          fieldName: field.name,
          userName: res.user?.name || null,
          visitorName: res.visitorName,
          startTime: res.startTime,
          endTime: res.endTime,
          totalPrice: res.totalPrice,
          status: res.status,
        });
      });
    });
  });

  // Sort and get recent 5
  const recent5 = recentReservations
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  // Today's reservations
  const todayReservations = recentReservations.filter(r => {
    const start = new Date(r.startTime);
    return start >= today && start < tomorrow;
  }).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">مرحباً، {owner.name}</h1>
        <p className="text-slate-400">إليك ملخص أداء ملاعبك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">دخل الشهر</h3>
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-white">{monthlyRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-500">ج.م</span></p>
          <p className="text-xs text-slate-500 mt-1">{format(monthStart, 'MMMM yyyy', { locale: arSA })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">حجوزات اليوم</h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{todayReservations}</p>
          <p className="text-xs text-slate-500 mt-1">{format(today, 'd MMMM', { locale: arSA })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">حجوزات الشهر</h3>
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-white">{monthlyReservations}</p>
          <p className="text-xs text-slate-500 mt-1">{format(monthStart, 'MMMM yyyy', { locale: arSA })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">الملاعب النشطة</h3>
            <BarChart3 className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-white">{totalFields}</p>
          <p className="text-xs text-slate-500 mt-1">إجمالي الملاعب</p>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">آخر الحجوزات</h2>
            <Link href="/owner/dashboard/reservations" className="text-emerald-500 text-sm hover:underline">
              عرض الكل
            </Link>
          </div>
          {recent5.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {recent5.map(res => (
                <div key={res.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-white font-medium text-sm">
                        {res.userName || res.visitorName || 'زائر'}
                      </span>
                    </div>
                    <span className="text-emerald-500 font-bold text-sm">{res.totalPrice} ج.م</span>
                  </div>
                  <p className="text-slate-400 text-xs mb-1">{res.courtName} - {res.fieldName}</p>
                  <p className="text-slate-500 text-xs">
                    {format(new Date(res.startTime), 'EEEE d MMMM', { locale: arSA })} • {formatTime12h(new Date(res.startTime))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              لا توجد حجوزات بعد
            </div>
          )}
        </div>

        {/* Courts Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">ملاعبك</h2>
            <Link href="/owner/dashboard/courts" className="text-emerald-500 text-sm hover:underline">
              إدارة الملاعب
            </Link>
          </div>
          {owner.courts.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {owner.courts.map(court => (
                <div key={court.id} className="p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{court.name}</h3>
                    <span className="text-slate-400 text-sm">{court.fields.length} ملاعب</span>
                  </div>
                  <p className="text-slate-500 text-sm">{court.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              لم تضف أي ملاعب بعد
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
