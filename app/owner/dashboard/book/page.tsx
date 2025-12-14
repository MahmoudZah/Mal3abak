"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import {
  Calendar,
  Clock,
  User,
  Phone,
  ChevronDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { arSA } from "date-fns/locale";

interface Court {
  id: string;
  name: string;
  fields: Field[];
}

interface Field {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

interface Reservation {
  startTime: string;
  endTime: string;
}

// Available hours (2 PM to midnight)
const AVAILABLE_HOURS = Array.from({ length: 10 }, (_, i) => 14 + i);

// Convert 24h to 12h format
function formatTime12h(hour: number): string {
  const period = hour >= 12 ? "م" : "ص";
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
}

export default function ManualBookingPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch owner's courts
  useEffect(() => {
    fetch("/api/owner/courts")
      .then((res) => res.json())
      .then((data) => {
        if (data.courts) {
          setCourts(data.courts);
          if (data.courts.length > 0) {
            setSelectedCourt(data.courts[0].id);
            if (data.courts[0].fields.length > 0) {
              setSelectedField(data.courts[0].fields[0].id);
            }
          }
        }
      })
      .catch(console.error);
  }, []);

  // Get current court and field
  const currentCourt = courts.find((c) => c.id === selectedCourt);
  const currentField = currentCourt?.fields.find((f) => f.id === selectedField);

  // Fetch reservations when field or date changes
  useEffect(() => {
    if (!selectedField) return;
    setLoadingSlots(true);
    setSelectedSlots([]);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    fetch(`/api/availability?fieldId=${selectedField}&date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        setReservations(data.reservations || []);
      })
      .catch(() => {
        setReservations([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [selectedField, selectedDate]);

  // Update field when court changes
  useEffect(() => {
    if (currentCourt?.fields.length) {
      setSelectedField(currentCourt.fields[0].id);
    }
  }, [selectedCourt]);

  // Check if a slot is booked
  const isSlotBooked = (hour: number): boolean => {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(selectedDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return reservations.some((res) => {
      const resStart = new Date(res.startTime);
      const resEnd = new Date(res.endTime);
      return slotStart < resEnd && slotEnd > resStart;
    });
  };

  // Filter out past slots for today
  const availableHours = useMemo(() => {
    const now = new Date();
    const isToday =
      format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    if (isToday) {
      return AVAILABLE_HOURS.filter((hour) => hour > now.getHours());
    }
    return AVAILABLE_HOURS;
  }, [selectedDate]);

  // Calculate total
  const totalPrice = selectedSlots.length * (currentField?.pricePerHour || 0);

  // Navigate dates
  const goToPreviousDay = () => {
    const yesterday = addDays(selectedDate, -1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (yesterday >= today) {
      setSelectedDate(yesterday);
    }
  };

  const goToNextDay = () => {
    const maxDate = addDays(new Date(), 6);
    const tomorrow = addDays(selectedDate, 1);
    if (tomorrow <= maxDate) {
      setSelectedDate(tomorrow);
    }
  };

  const handleSlotClick = (hour: number, isBooked: boolean) => {
    if (isBooked) return;
    setSelectedSlots((prev) =>
      prev.includes(hour)
        ? prev.filter((h) => h !== hour)
        : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      setError("يرجى اختيار موعد واحد على الأقل");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/owner/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedField,
          date: format(selectedDate, "yyyy-MM-dd"),
          slots: selectedSlots,
          customerName,
          customerPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ");
      }

      setSuccess(true);
      setSelectedSlots([]);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            تم الحجز بنجاح!
          </h2>
          <p className="text-slate-400 mb-6">تم تسجيل الحجز للعميل</p>
          <Button onClick={() => setSuccess(false)}>حجز جديد</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">حجز يدوي</h1>
        <p className="text-slate-400">
          سجّل حجز للعملاء الموجودين في الملعب بدون دفع من التطبيق
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Selection */}
        <div className="space-y-6">
          {/* Court Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              اختر النادي والملعب
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  النادي
                </label>
                <div className="relative">
                  <select
                    value={selectedCourt}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {currentCourt && currentCourt.fields.length > 0 && (
                <div>
                  <label className="block text-slate-400 text-sm mb-2">
                    الملعب
                  </label>
                  <div className="relative">
                    <select
                      value={selectedField}
                      onChange={(e) => setSelectedField(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
                    >
                      {currentCourt.fields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.name} - {field.pricePerHour} ج.م/ساعة
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Navigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              اختر اليوم
            </h3>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
              <button
                type="button"
                onClick={goToPreviousDay}
                className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-30"
                disabled={
                  format(selectedDate, "yyyy-MM-dd") ===
                  format(new Date(), "yyyy-MM-dd")
                }
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
              <span className="text-white font-medium">
                {format(selectedDate, "EEEE, d MMMM", { locale: arSA })}
              </span>
              <button
                type="button"
                onClick={goToNextDay}
                className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-30"
                disabled={
                  format(selectedDate, "yyyy-MM-dd") ===
                  format(addDays(new Date(), 6), "yyyy-MM-dd")
                }
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              اختر الموعد
            </h3>

            {loadingSlots ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : availableHours.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                لا توجد مواعيد متاحة لهذا اليوم
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableHours.map((hour) => {
                  const isSelected = selectedSlots.includes(hour);
                  const booked = isSlotBooked(hour);

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => handleSlotClick(hour, booked)}
                      disabled={booked}
                      className={`p-2 rounded-lg text-sm transition-all border cursor-pointer ${
                        booked
                          ? "bg-red-500/10 text-red-400 border-red-500/30 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {formatTime12h(hour)}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlots.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-400 text-sm">
                  تم اختيار {selectedSlots.length} ساعة • الإجمالي: {totalPrice}{" "}
                  ج.م
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer Info */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-40"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              بيانات العميل (اختياري)
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  اسم العميل
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="اسم العميل"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder="01012345678"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="border-t border-slate-800 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">
                  الإجمالي ({selectedSlots.length} ساعة)
                </span>
                <span className="text-2xl font-bold text-white">
                  {totalPrice} ج.م
                </span>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={selectedSlots.length === 0}
                isLoading={loading}
              >
                تأكيد الحجز
              </Button>
              <p className="text-slate-500 text-xs text-center mt-3">
                * هذا الحجز للعملاء الموجودين فعلياً في الملعب
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
