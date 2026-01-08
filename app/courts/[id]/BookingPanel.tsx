"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { PaymentConfirmationModal } from "../../components/PaymentConfirmationModal";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  User,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { arSA } from "date-fns/locale";

interface Field {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

interface Court {
  id: string;
  name: string;
}

interface BookingPanelProps {
  court: Court;
  fields: Field[];
  paymentName: string;
  paymentPhone: string;
  paymentMethod: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Reservation {
  startTime: string;
  endTime: string;
}

// Available hours (2 PM to midnight)
const AVAILABLE_HOURS = Array.from({ length: 10 }, (_, i) => 14 + i); // [14, 15, 16, ..., 23]

// Convert 24h to 12h format
function formatTime12h(hour: number): string {
  const period = hour >= 12 ? "م" : "ص";
  const hour12 = hour % 12 || 12;
  return `${hour12}:00 ${period}`;
}

export function BookingPanel({ court, fields, paymentName, paymentPhone, paymentMethod }: BookingPanelProps) {
  const [selectedField, setSelectedField] = useState<string | null>(
    fields[0]?.id || null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]); // Store hours instead of slot IDs
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Guest booking fields
  const [user, setUser] = useState<UserData | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");

  // Check if user is logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Fetch reservations when field or date changes
  useEffect(() => {
    if (!selectedField) return;

    setLoadingSlots(true);
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

  // Get current field
  const currentField = fields.find((f) => f.id === selectedField);

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

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedSlots.length * (currentField?.pricePerHour || 0);
  }, [selectedSlots, currentField]);

  // Handle slot selection (multi-select)
  const handleSlotClick = (hour: number, isBooked: boolean) => {
    if (isBooked) return;

    setSelectedSlots((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour);
      }
      return [...prev, hour].sort((a, b) => a - b);
    });
  };

  // Reset selection when field or date changes
  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedField, selectedDate]);

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

  const handleBook = async () => {
    if (selectedSlots.length === 0) return;
    
    // Validate guest info
    if (!user && (!visitorName || !visitorPhone)) {
      setError("يرجى إدخال الاسم ورقم الهاتف");
      return;
    }

    // Open payment modal
    setError(null);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentProofUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: selectedField,
          date: format(selectedDate, "yyyy-MM-dd"),
          slots: selectedSlots,
          visitorName: user ? null : visitorName,
          visitorPhone: user ? null : visitorPhone,
          paymentProof: paymentProofUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ في الحجز");
      }

      setBookingId(data.reservation.id);
      setIsBooked(true);
      setShowPaymentModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في الحجز");
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (isBooked) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl text-center sticky top-24">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">تم إرسال طلب الحجز!</h3>
        <p className="text-slate-300 mb-2">رقم الحجز:</p>
        <p className="text-emerald-400 font-mono text-sm mb-4 bg-slate-800 inline-block px-3 py-1 rounded">
          {bookingId}
        </p>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
          <p className="text-blue-400 text-sm">
            ⏳ <strong>في انتظار التأكيد</strong>
            <br />
            سيقوم مالك الملعب بمراجعة إثبات الدفع وتأكيد حجزك قريباً
          </p>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          {selectedSlots.length} ساعة • {totalPrice + 10} ج.م
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          حجز موعد آخر
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-24">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-emerald-500" />
        احجز موعدك
      </h3>

      {/* Field Selection */}
      {fields.length > 1 && (
        <div className="mb-6">
          <label className="block text-slate-400 text-sm mb-2">
            اختر الملعب
          </label>
          <div className="relative">
            <select
              value={selectedField || ""}
              onChange={(e) => setSelectedField(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name} - {field.pricePerHour} ج.م/ساعة
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Single field info */}
      {fields.length === 1 && currentField && (
        <div className="mb-6 p-3 bg-slate-800 rounded-lg">
          <p className="text-white font-medium">{currentField.name}</p>
          <p className="text-emerald-400 text-sm">
            {currentField.pricePerHour} ج.م / ساعة
          </p>
        </div>
      )}

      {/* Date Navigation */}
      <div className="mb-6">
        <label className="block text-slate-400 text-sm mb-2">اختر اليوم</label>
        <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
          <button
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
      <div className="space-y-4">
        <label className="block text-slate-400 text-sm">اختر الوقت</label>

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : availableHours.length === 0 ? (
          <p className="text-slate-500 text-center py-4">
            لا توجد مواعيد متاحة لهذا اليوم.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {availableHours.map((hour) => {
              const isSelected = selectedSlots.includes(hour);
              const booked = isSlotBooked(hour);

              return (
                <button
                  key={hour}
                  onClick={() => handleSlotClick(hour, booked)}
                  disabled={booked}
                  className={`flex items-center justify-center p-3 rounded-lg text-sm transition-all border cursor-pointer ${
                    booked
                      ? "bg-red-500/10 text-red-400 border-red-500/30 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-700"
                  }`}
                >
                  <Clock className="w-3 h-3 ml-2" />
                  {formatTime12h(hour)}
                  {booked && <span className="mr-1 text-xs">(محجوز)</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Slots Info */}
      {selectedSlots.length > 0 && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <p className="text-emerald-400 text-sm">
            تم اختيار {selectedSlots.length} ساعة
          </p>
        </div>
      )}

      {/* Guest Booking Fields */}
      {!user && selectedSlots.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
          <p className="text-slate-400 text-sm">أدخل بياناتك للحجز:</p>
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="الاسم"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              dir="ltr"
            />
          </div>
        </div>
      )}

      {user && selectedSlots.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-sm">
            الحجز باسم:{" "}
            <span className="text-white font-medium">{user.name}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-slate-300">
            <span>سعر الملعب ({selectedSlots.length} ساعة)</span>
            <span className="text-white">{totalPrice} ج.م</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>رسوم الخدمة</span>
            <span className="text-emerald-400">+10 ج.م</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold border-t border-slate-700 pt-2">
            <span className="text-white">المجموع</span>
            <span className="text-emerald-500">{totalPrice + 10} ج.م</span>
          </div>
        </div>
        <Button
          className="w-full h-12 text-lg"
          disabled={
            selectedSlots.length === 0 ||
            (!user && (!visitorName || !visitorPhone))
          }
          onClick={handleBook}
          isLoading={loading}
        >
          {selectedSlots.length > 0 ? "متابعة للدفع" : "اختر وقتاً للحجز"}
        </Button>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && currentField && (
        <PaymentConfirmationModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handlePaymentConfirm}
          courtName={court.name}
          fieldName={currentField.name}
          date={format(selectedDate, "EEEE, d MMMM yyyy", { locale: arSA })}
          time={`${formatTime12h(selectedSlots[0])} - ${formatTime12h(selectedSlots[selectedSlots.length - 1] + 1)}`}
          hours={selectedSlots.length}
          pricePerHour={currentField.pricePerHour}
          ownerPaymentName={paymentName}
          ownerPaymentPhone={paymentPhone}
          ownerPaymentMethod={paymentMethod}
        />
      )}
    </div>
  );
}
