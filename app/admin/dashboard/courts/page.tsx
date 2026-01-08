"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, User, DollarSign, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CourtData {
  id: string;
  name: string;
  description: string | null;
  location: string;
  images: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  fields: {
    id: string;
    name: string;
    type: string;
    pricePerHour: number;
    _count: {
      reservations: number;
    };
  }[];
  totalReservations: number;
  totalRevenue: number;
}

export default function AdminCourtsPage() {
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCourts = async () => {
      try {
        const res = await fetch("/api/admin/courts");
        const data = await res.json();
        if (res.ok && isMounted) {
          setCourts(data.courts);
        }
      } catch (error) {
        console.error("Error fetching courts:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourts();

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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">جميع الملاعب</h1>
        <p className="text-slate-400 mt-1">
          {courts.length} ملعب مسجل في المنصة
        </p>
      </div>

      {courts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">لا توجد ملاعب مسجلة حتى الآن</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courts.map((court) => {
            const images = JSON.parse(court.images || "[]");
            return (
              <div
                key={court.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-48 h-40 md:h-auto bg-slate-800 flex-shrink-0">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={court.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {court.name}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                          <MapPin className="w-4 h-4" />
                          {court.location}
                        </div>
                        {court.description && (
                          <p className="text-slate-500 text-sm mt-2 line-clamp-2">
                            {court.description}
                          </p>
                        )}

                        {/* Owner Info */}
                        <div className="flex items-center gap-2 mt-3 p-2 bg-slate-800/50 rounded-lg w-fit">
                          <User className="w-4 h-4 text-emerald-500" />
                          <div className="text-sm">
                            <span className="text-white">{court.owner.name}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-400">
                              {court.owner.email}
                            </span>
                            {court.owner.phone && (
                              <>
                                <span className="text-slate-400 mx-2">•</span>
                                <span className="text-slate-400">
                                  {court.owner.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 md:flex-col md:items-end">
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {court.totalRevenue.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg">
                          <CalendarCheck className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {court.totalReservations} حجز
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs">
                          مسجل في{" "}
                          {format(new Date(court.createdAt), "d MMM yyyy", {
                            locale: ar,
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-slate-400 text-sm mb-2">
                        الملاعب الفرعية ({court.fields.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {court.fields.map((field) => (
                          <div
                            key={field.id}
                            className="bg-slate-800 rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="text-white">{field.name}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-400">{field.type}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-emerald-400">
                              {field.pricePerHour} ج.م/ساعة
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

