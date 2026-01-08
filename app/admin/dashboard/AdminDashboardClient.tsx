"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Stats {
  users: {
    total: number;
    players: number;
    owners: number;
  };
  courts: {
    total: number;
    fields: number;
  };
  reservations: {
    total: number;
    confirmed: number;
    cancelled: number;
    pending: number;
  };
  revenue: {
    total: number;
  };
}

interface RecentReservation {
  id: string;
  courtName: string;
  fieldName: string;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

interface TopCourt {
  id: string;
  name: string;
  location: string;
  ownerName: string;
  fieldsCount: number;
  totalReservations: number;
  totalRevenue: number;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReservations, setRecentReservations] = useState<
    RecentReservation[]
  >([]);
  const [topCourts, setTopCourts] = useState<TopCourt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok && isMounted) {
          setStats(data.stats);
          setRecentReservations(data.recentReservations);
          setTopCourts(data.topCourts);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-slate-400 py-12">
        حدث خطأ في تحميل البيانات
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.users.total,
      icon: Users,
      color: "bg-blue-500/20 text-blue-400",
      subtitle: `${stats.users.players} لاعب • ${stats.users.owners} مالك`,
    },
    {
      title: "الملاعب المسجلة",
      value: stats.courts.total,
      icon: Building2,
      color: "bg-emerald-500/20 text-emerald-400",
      subtitle: `${stats.courts.fields} ملعب فرعي`,
    },
    {
      title: "الحجوزات المؤكدة",
      value: stats.reservations.confirmed,
      icon: CalendarCheck,
      color: "bg-purple-500/20 text-purple-400",
      subtitle: `${stats.reservations.pending} معلق • ${stats.reservations.cancelled} ملغي`,
    },
    {
      title: "إجمالي الإيرادات",
      value: `${stats.revenue.total.toLocaleString()} ج.م`,
      icon: DollarSign,
      color: "bg-amber-500/20 text-amber-400",
      subtitle: "من الحجوزات المؤكدة",
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">لوحة تحكم الأدمن</h1>
        <p className="text-slate-400 mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {card.value}
                </p>
                <p className="text-slate-500 text-xs mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">
              آخر الحجوزات
            </h2>
          </div>
          <div className="space-y-3">
            {recentReservations.length === 0 ? (
              <p className="text-slate-500 text-center py-4">لا توجد حجوزات</p>
            ) : (
              recentReservations.slice(0, 5).map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {res.courtName} - {res.fieldName}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {res.customerName} •{" "}
                      {format(new Date(res.startTime), "d MMM, h:mm a", {
                        locale: ar,
                      })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-emerald-400 text-sm font-medium">
                      {res.totalPrice} ج.م
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        res.status === "CONFIRMED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : res.status === "CANCELLED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {res.status === "CONFIRMED"
                        ? "مؤكد"
                        : res.status === "CANCELLED"
                        ? "ملغي"
                        : "معلق"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Courts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">
              أفضل الملاعب
            </h2>
          </div>
          <div className="space-y-3">
            {topCourts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">لا توجد ملاعب</p>
            ) : (
              topCourts.map((court, index) => (
                <div
                  key={court.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {court.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {court.location} • {court.ownerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-emerald-400 text-sm font-medium">
                      {court.totalRevenue.toLocaleString()} ج.م
                    </p>
                    <p className="text-slate-500 text-xs">
                      {court.totalReservations} حجز
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

