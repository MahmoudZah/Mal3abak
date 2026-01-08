'use client';

import { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Target,
  Activity,
  Percent
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { arSA } from 'date-fns/locale';

type Reservation = {
  id: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: string;
  user: { id: string; name: string | null; email: string } | null;
};

type Field = {
  id: string;
  name: string;
  pricePerHour: number;
  reservations: Reservation[];
};

type Court = {
  id: string;
  name: string;
  location: string | null;
  fields: Field[];
};

interface Props {
  courts: Court[];
}

type PeriodType = 'all' | 'month' | 'custom';

export function StatisticsClient({ courts }: Props) {
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('all');

  // Calculate date ranges
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Determine actual date range based on selection
  const dateRange = useMemo(() => {
    if (periodType === 'all') {
      return { start: null, end: null };
    } else if (periodType === 'month') {
      return { start: monthStart, end: monthEnd };
    } else {
      // Custom range
      const start = customStartDate ? new Date(customStartDate) : null;
      const end = customEndDate ? new Date(customEndDate) : null;
      return { start, end };
    }
  }, [periodType, customStartDate, customEndDate, monthStart, monthEnd]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const courtStats = courts.map(court => {
      let filteredRevenue = 0;
      let filteredReservations = 0;
      let filteredHoursBooked = 0;

      court.fields.forEach(field => {
        field.reservations.forEach(res => {
          const resDate = new Date(res.startTime);
          const hours = (new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60);
          
          // Check if reservation is within selected date range
          let includeReservation = false;
          if (dateRange.start === null && dateRange.end === null) {
            // All time
            includeReservation = true;
          } else if (dateRange.start && dateRange.end) {
            // Custom or monthly range
            includeReservation = isWithinInterval(resDate, { start: dateRange.start, end: dateRange.end });
          }

          if (includeReservation) {
            filteredReservations++;
            filteredRevenue += res.totalPrice;
            filteredHoursBooked += hours;
          }
        });
      });

      // Field-level stats
      const fieldStats = court.fields.map(field => {
        let fieldRevenue = 0;
        let fieldReservations = 0;
        let fieldHours = 0;

        field.reservations.forEach(res => {
          const resDate = new Date(res.startTime);
          const hours = (new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60);
          
          let includeReservation = false;
          if (dateRange.start === null && dateRange.end === null) {
            includeReservation = true;
          } else if (dateRange.start && dateRange.end) {
            includeReservation = isWithinInterval(resDate, { start: dateRange.start, end: dateRange.end });
          }

          if (includeReservation) {
            fieldReservations++;
            fieldRevenue += res.totalPrice;
            fieldHours += hours;
          }
        });

        return {
          id: field.id,
          name: field.name,
          pricePerHour: field.pricePerHour,
          revenue: fieldRevenue,
          reservations: fieldReservations,
          hours: fieldHours,
        };
      });

      return {
        id: court.id,
        name: court.name,
        location: court.location,
        revenue: filteredRevenue,
        reservations: filteredReservations,
        hoursBooked: filteredHoursBooked,
        fieldStats,
      };
    });

    // Calculate overall stats
    const overall = {
      revenue: courtStats.reduce((sum, c) => sum + c.revenue, 0),
      reservations: courtStats.reduce((sum, c) => sum + c.reservations, 0),
      hoursBooked: courtStats.reduce((sum, c) => sum + c.hoursBooked, 0),
      totalFields: courts.reduce((sum, c) => sum + c.fields.length, 0),
      totalCourts: courts.length,
    };

    return { courtStats, overall };
  }, [courts, dateRange]);

  // Filter selected court
  const displayedCourts = selectedCourtId === 'all' 
    ? statistics.courtStats 
    : statistics.courtStats.filter(c => c.id === selectedCourtId);

  // Get period label for display
  const getPeriodLabel = () => {
    if (periodType === 'all') return 'منذ البداية';
    if (periodType === 'month') return format(monthStart, 'MMMM yyyy', { locale: arSA });
    if (periodType === 'custom' && dateRange.start && dateRange.end) {
      return `${format(dateRange.start, 'd MMM', { locale: arSA })} - ${format(dateRange.end, 'd MMM yyyy', { locale: arSA })}`;
    }
    return 'الفترة المخصصة';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">الإحصائيات</h1>
        <p className="text-slate-400">تحليل شامل لأداء ملاعبك</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
        {/* Period Type Selector */}
        <div className="lg:col-span-5">
          <label className="block text-sm font-medium text-slate-400 mb-2">الفترة الزمنية</label>
          <div className="grid grid-cols-3 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                periodType === 'month'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setPeriodType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                periodType === 'all'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              كل الوقت
            </button>
            <button
              onClick={() => setPeriodType('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                periodType === 'custom'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              مخصص
            </button>
          </div>
        </div>

        {/* Custom Date Range - Show only when custom is selected */}
        {periodType === 'custom' && (
          <>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-400 mb-2">من تاريخ</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-400 mb-2">إلى تاريخ</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={customStartDate}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}

        {/* Court Filter */}
        <div className={periodType === 'custom' ? 'lg:col-span-1' : 'lg:col-span-7'}>
          <label className="block text-sm font-medium text-slate-400 mb-2">الملعب</label>
          <select
            value={selectedCourtId}
            onChange={(e) => setSelectedCourtId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">جميع الملاعب</option>
            {courts.map(court => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Summary Cards - Only show when "all courts" selected */}
      {selectedCourtId === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-400 text-sm font-medium">إجمالي الدخل</h3>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {statistics.overall.revenue.toLocaleString()}{' '}
              <span className="text-sm text-slate-500">ج.م</span>
            </p>
            <p className="text-xs text-slate-500">{getPeriodLabel()}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-400 text-sm font-medium">عدد الحجوزات</h3>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {statistics.overall.reservations}
            </p>
            <p className="text-xs text-slate-500">{getPeriodLabel()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-400 text-sm font-medium">ساعات الحجز</h3>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {Math.round(statistics.overall.hoursBooked)}
            </p>
            <p className="text-xs text-slate-500">ساعة</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-400 text-sm font-medium">إجمالي الملاعب</h3>
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {statistics.overall.totalFields}
            </p>
            <p className="text-xs text-slate-500">في {statistics.overall.totalCourts} نادي</p>
          </div>
        </div>
      )}

      {/* Court-Level Statistics */}
      <div className="space-y-6">
        {displayedCourts.map(court => (
          <div key={court.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Court Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{court.name}</h2>
                  <p className="text-slate-400 text-sm">{court.location || 'لا يوجد موقع'}</p>
                </div>
              </div>
            </div>

            {/* Court Stats Grid */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-800/30">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-slate-500">الدخل</p>
                </div>
                <p className="text-lg font-bold text-white">{court.revenue.toLocaleString()} ج.م</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-slate-500">الحجوزات</p>
                </div>
                <p className="text-lg font-bold text-white">{court.reservations}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-slate-500">الساعات</p>
                </div>
                <p className="text-lg font-bold text-white">{Math.round(court.hoursBooked)}</p>
              </div>
            </div>

            {/* Field-Level Stats */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                إحصائيات الملاعب الفرعية
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {court.fieldStats.map(field => (
                  <div
                    key={field.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium mb-1">{field.name}</h4>
                        <p className="text-xs text-slate-500">
                          {field.pricePerHour} ج.م / ساعة
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">الدخل</p>
                        <p className="text-sm font-bold text-emerald-400">
                          {field.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">الحجوزات</p>
                        <p className="text-sm font-bold text-blue-400">{field.reservations}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">الساعات</p>
                        <p className="text-sm font-bold text-purple-400">
                          {field.hours.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayedCourts.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">لا توجد بيانات</h3>
          <p className="text-slate-400">لم يتم العثور على إحصائيات لعرضها</p>
        </div>
      )}
    </div>
  );
}


