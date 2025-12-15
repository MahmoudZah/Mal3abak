"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ReservationData {
  id: string;
  courtName: string;
  courtLocation: string;
  ownerName: string;
  fieldName: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    try {
      const url = statusFilter
        ? `/api/admin/reservations?status=${statusFilter}`
        : "/api/admin/reservations";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReservations(data.reservations);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(
    (res) =>
      res.courtName.toLowerCase().includes(search.toLowerCase()) ||
      res.customerName.toLowerCase().includes(search.toLowerCase()) ||
      res.fieldName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/20 text-emerald-400";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-amber-500/20 text-amber-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "مؤكد";
      case "CANCELLED":
        return "ملغي";
      default:
        return "معلق";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">جميع الحجوزات</h1>
        <p className="text-slate-400 mt-1">
          {reservations.length} حجز في المنصة
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالملعب أو العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: "", label: "الكل" },
            { value: "CONFIRMED", label: "مؤكد" },
            { value: "PENDING", label: "معلق" },
            { value: "CANCELLED", label: "ملغي" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">لا توجد حجوزات</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    الملعب
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    العميل
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    الموعد
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    السعر
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    الحالة
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-4 py-3">
                    تاريخ الحجز
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{res.courtName}</p>
                        <p className="text-slate-400 text-sm">{res.fieldName}</p>
                        <p className="text-slate-500 text-xs">
                          {res.courtLocation}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{res.customerName}</p>
                        {res.customerPhone && (
                          <p className="text-slate-400 text-sm">
                            {res.customerPhone}
                          </p>
                        )}
                        {res.customerEmail && (
                          <p className="text-slate-500 text-xs">
                            {res.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm">
                            {format(new Date(res.startTime), "d MMM yyyy", {
                              locale: ar,
                            })}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {format(new Date(res.startTime), "h:mm a", {
                              locale: ar,
                            })}{" "}
                            -{" "}
                            {format(new Date(res.endTime), "h:mm a", {
                              locale: ar,
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 font-medium">
                        {res.totalPrice} ج.م
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          res.status
                        )}`}
                      >
                        {getStatusLabel(res.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {format(new Date(res.createdAt), "d MMM yyyy, h:mm a", {
                        locale: ar,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

