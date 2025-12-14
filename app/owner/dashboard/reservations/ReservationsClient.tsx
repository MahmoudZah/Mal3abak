"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  Filter as FilterIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { arSA } from "date-fns/locale";

interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  visitorName: string | null;
  visitorPhone: string | null;
  user: { name: string; phone: string | null } | null;
  courtName: string;
  courtId: string;
  fieldName: string;
}

interface Court {
  id: string;
  name: string;
  reservationsCount: number;
  revenue: number;
}

interface Props {
  initialReservations: Reservation[];
  courts: Court[];
}

// Format time in 12-hour format
function formatTime12h(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? "م" : "ص";
  const hour12 = hours % 12 || 12;
  return `${hour12}:00 ${period}`;
}

type ViewMode = "list" | "calendar";
type FilterType = "all" | "today" | "upcoming" | "past" | "custom";

export default function ReservationsClient({
  initialReservations,
  courts,
}: Props) {
  const [selectedCourt, setSelectedCourt] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(
    null
  );

  const now = new Date();

  // Filter reservations
  const filteredReservations = useMemo(() => {
    let result = [...initialReservations];

    // Filter by court
    if (selectedCourt !== "all") {
      result = result.filter((r) => r.courtId === selectedCourt);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const name = (r.user?.name || r.visitorName || "").toLowerCase();
        const phone = r.user?.phone || r.visitorPhone || "";
        return name.includes(query) || phone.includes(query);
      });
    }

    // Filter by date/status
    if (filterType === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      result = result.filter((r) => {
        const start = new Date(r.startTime);
        return start >= today && start < tomorrow;
      });
    } else if (filterType === "upcoming") {
      result = result.filter((r) => new Date(r.startTime) >= now);
    } else if (filterType === "past") {
      result = result.filter((r) => new Date(r.startTime) < now);
    } else if (filterType === "custom" && customDate) {
      const dayStart = new Date(customDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      result = result.filter((r) => {
        const start = new Date(r.startTime);
        return start >= dayStart && start < dayEnd;
      });
    }

    // Filter by calendar date if selected
    if (selectedCalendarDate && viewMode === "calendar") {
      result = result.filter((r) =>
        isSameDay(new Date(r.startTime), selectedCalendarDate)
      );
    }

    // Sort by start time (newest first for list, oldest first for daily view)
    result.sort((a, b) => {
      if (selectedCalendarDate) {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return result;
  }, [
    initialReservations,
    selectedCourt,
    searchQuery,
    filterType,
    customDate,
    selectedCalendarDate,
    viewMode,
    now,
  ]);

  // Calculate stats for selected court
  const stats = useMemo(() => {
    const courtReservations =
      selectedCourt === "all"
        ? initialReservations
        : initialReservations.filter((r) => r.courtId === selectedCourt);

    const totalRevenue = courtReservations.reduce(
      (sum, r) => sum + r.totalPrice,
      0
    );
    const upcomingCount = courtReservations.filter(
      (r) => new Date(r.startTime) >= now
    ).length;
    const todayCount = courtReservations.filter((r) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(r.startTime);
      return start >= today && start < tomorrow;
    }).length;

    return {
      total: courtReservations.length,
      upcoming: upcomingCount,
      today: todayCount,
      revenue: totalRevenue,
    };
  }, [initialReservations, selectedCourt, now]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 6 }); // Saturday
    const end = endOfWeek(monthEnd, { weekStartsOn: 6 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const getReservationsForDay = (day: Date) => {
    return initialReservations.filter((r) => {
      const resDate = new Date(r.startTime);
      if (selectedCourt !== "all" && r.courtId !== selectedCourt) return false;
      return isSameDay(resDate, day);
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "العميل",
      "الموبايل",
      "الملعب",
      "التاريخ",
      "الوقت",
      "المدة",
      "السعر",
      "الحالة",
    ];
    const rows = filteredReservations.map((r) => {
      const hours = Math.round(
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
          (1000 * 60 * 60)
      );
      return [
        r.user?.name || r.visitorName || "زائر",
        r.user?.phone || r.visitorPhone || "-",
        `${r.courtName} - ${r.fieldName}`,
        format(new Date(r.startTime), "yyyy-MM-dd"),
        `${formatTime12h(new Date(r.startTime))} - ${formatTime12h(
          new Date(r.endTime)
        )}`,
        `${hours} ساعة`,
        `${r.totalPrice} ج.م`,
        r.status === "CONFIRMED"
          ? "مؤكد"
          : r.status === "PENDING"
          ? "قيد الانتظار"
          : "ملغي",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reservations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Court Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              إدارة الحجوزات
            </h1>
            <p className="text-slate-400">تابع وأدِر جميع حجوزات ملاعبك</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode("list");
                  setSelectedCalendarDate(null);
                }}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                قائمة
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  viewMode === "calendar"
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                تقويم
              </button>
            </div>
            {/* Export */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>

        {/* Court Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <button
            onClick={() => setSelectedCourt("all")}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedCourt === "all"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            جميع الملاعب
            <span className="mr-2 px-1.5 py-0.5 bg-black/20 rounded text-xs">
              {initialReservations.length}
            </span>
          </button>
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourt(court.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                selectedCourt === court.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {court.name}
              <span className="mr-2 px-1.5 py-0.5 bg-black/20 rounded text-xs">
                {court.reservationsCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm mb-1">إجمالي الحجوزات</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm mb-1">حجوزات اليوم</p>
          <p className="text-2xl font-bold text-blue-400">{stats.today}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm mb-1">الحجوزات القادمة</p>
          <p className="text-2xl font-bold text-emerald-500">
            {stats.upcoming}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-slate-400 text-sm mb-1">الإيرادات</p>
          <p className="text-2xl font-bold text-white">
            {stats.revenue.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 mr-1">ج.م</span>
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الموبايل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <FilterIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {(["all", "today", "upcoming", "past"] as FilterType[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => {
                  setFilterType(filter);
                  setCustomDate(null);
                }}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  filterType === filter
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filter === "all"
                  ? "الكل"
                  : filter === "today"
                  ? "اليوم"
                  : filter === "upcoming"
                  ? "القادمة"
                  : "السابقة"}
              </button>
            )
          )}

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={customDate ? format(customDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                if (e.target.value) {
                  setCustomDate(new Date(e.target.value));
                  setFilterType("custom");
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          {filterType === "custom" && customDate && (
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm flex items-center gap-2">
              {format(customDate, "d MMMM yyyy", { locale: arSA })}
              <button
                onClick={() => {
                  setFilterType("all");
                  setCustomDate(null);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-semibold text-white">
              {format(calendarMonth, "MMMM yyyy", { locale: arSA })}
            </h3>
            <button
              onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {["سبت", "أحد", "اثن", "ثلا", "أرب", "خمي", "جمع"].map((day) => (
              <div
                key={day}
                className="text-center text-slate-500 text-sm py-2"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {calendarDays.map((day) => {
              const dayReservations = getReservationsForDay(day);
              const isCurrentMonth =
                day.getMonth() === calendarMonth.getMonth();
              const isSelected =
                selectedCalendarDate && isSameDay(day, selectedCalendarDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() =>
                    setSelectedCalendarDate(isSelected ? null : day)
                  }
                  className={`p-2 rounded-lg text-center transition-all min-h-[60px] ${
                    !isCurrentMonth
                      ? "opacity-30"
                      : isSelected
                      ? "bg-emerald-500 text-white"
                      : isToday(day)
                      ? "bg-slate-800 ring-1 ring-emerald-500"
                      : "hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      isCurrentMonth ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {dayReservations.length > 0 && (
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? "text-white" : "text-emerald-400"
                      }`}
                    >
                      {dayReservations.length} حجز
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Reservations */}
          {selectedCalendarDate && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-white font-medium mb-3">
                حجوزات{" "}
                {format(selectedCalendarDate, "EEEE d MMMM", { locale: arSA })}
              </h4>
            </div>
          )}
        </div>
      )}

      {/* Reservations List/Table */}
      {filteredReservations.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    العميل
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    الملعب
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    التاريخ
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    الوقت
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    المدة
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    السعر
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium p-4">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReservations.map((res) => {
                  const hours = Math.round(
                    (new Date(res.endTime).getTime() -
                      new Date(res.startTime).getTime()) /
                      (1000 * 60 * 60)
                  );
                  const isPast = new Date(res.startTime) < now;

                  return (
                    <tr
                      key={res.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                            {(res.user?.name || res.visitorName || "ز").charAt(
                              0
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {res.user?.name || res.visitorName || "زائر"}
                            </p>
                            {(res.visitorPhone || res.user?.phone) && (
                              <p
                                className="text-slate-500 text-xs flex items-center gap-1"
                                dir="ltr"
                              >
                                <Phone className="w-3 h-3" />
                                {res.visitorPhone || res.user?.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm font-medium">
                          {res.courtName}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {res.fieldName}
                        </p>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          {format(new Date(res.startTime), "EEEE, d MMMM", {
                            locale: arSA,
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-slate-300 text-sm">
                          <Clock className="w-4 h-4 text-slate-500" />
                          {formatTime12h(new Date(res.startTime))} -{" "}
                          {formatTime12h(new Date(res.endTime))}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {hours} ساعة
                      </td>
                      <td className="p-4 text-emerald-400 font-bold text-sm">
                        {res.totalPrice.toLocaleString()} ج.م
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isPast
                              ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              : res.status === "CONFIRMED"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : res.status === "PENDING"
                              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {isPast
                            ? "منتهي"
                            : res.status === "CONFIRMED"
                            ? "مؤكد"
                            : res.status === "PENDING"
                            ? "قيد الانتظار"
                            : "ملغي"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/30">
            <p className="text-slate-500 text-sm">
              عرض {filteredReservations.length} من {initialReservations.length}{" "}
              حجز
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">لا توجد حجوزات</p>
          {(searchQuery || filterType !== "all" || selectedCourt !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
                setSelectedCourt("all");
                setCustomDate(null);
                setSelectedCalendarDate(null);
              }}
              className="text-emerald-400 hover:text-emerald-300 text-sm"
            >
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      )}
    </div>
  );
}
