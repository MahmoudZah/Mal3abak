"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Building2,
  Search,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  GOVERNORATES,
  getRegionsByGovernorate,
  getFullLocation,
} from "@/lib/locations";

interface Court {
  id: string;
  name: string;
  governorate: string;
  region: string;
  location?: string;
  latitude: number | null;
  longitude: number | null;
  images: string;
  fields: { pricePerHour: number }[];
}

// Calculate distance between two points (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BrowsePageClient() {
  const searchParams = useSearchParams();
  const didAutoLocate = useRef(false);

  const [courts, setCourts] = useState<Court[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("cairo");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Get regions for selected governorate
  const availableRegions = useMemo(
    () => getRegionsByGovernorate(selectedGovernorate),
    [selectedGovernorate]
  );

  // Fetch courts based on filters
  useEffect(() => {
    // Use a small delay to batch state updates and avoid cascading renders
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedGovernorate)
        params.append("governorate", selectedGovernorate);
      if (selectedRegion) params.append("region", selectedRegion);
      if (searchQuery) params.append("search", searchQuery);

      fetch(`/api/courts?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setCourts(data.courts || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedGovernorate, selectedRegion, searchQuery]);

  // Init search from URL (?search=) - Use startTransition to avoid cascading renders
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      // Use setTimeout to defer state update
      const timer = setTimeout(() => {
        setSearchQuery(searchFromUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, searchQuery]);

  // Courts sorted by distance if user location is available
  const sortedCourts = useMemo(() => {
    // Separate courts with and without location
    const courtsWithLocation = courts.filter((c) => c.latitude && c.longitude);
    const courtsWithoutLocation = courts.filter(
      (c) => !c.latitude || !c.longitude
    );

    if (!userLocation) {
      // If no user location, show courts with location first, then without
      return [...courtsWithLocation, ...courtsWithoutLocation];
    }

    // Sort courts with location by distance
    const sortedWithLocation = [...courtsWithLocation].sort((a, b) => {
      const distA = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        a.latitude!,
        a.longitude!
      );
      const distB = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        b.latitude!,
        b.longitude!
      );
      return distA - distB;
    });

    // Return sorted courts with location, then courts without location
    return [...sortedWithLocation, ...courtsWithoutLocation];
  }, [courts, userLocation]);

  const getMyLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert("المتصفح لا يدعم تحديد الموقع");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoadingLocation(false);
      },
      () => {
        if (!silent)
          alert("فشل في تحديد موقعك. تأكد من السماح للمتصفح بالوصول للموقع.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Auto-locate once to enable "nearest first" sorting by default
  useEffect(() => {
    if (didAutoLocate.current) return;
    didAutoLocate.current = true;
    // Defer geolocation call to avoid affecting initial render
    const timer = setTimeout(() => {
      getMyLocation(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getMinPrice = (court: Court) => {
    if (!court.fields.length) return 0;
    return Math.min(...court.fields.map((f) => f.pricePerHour));
  };

  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const filteredCourts = useMemo(() => {
    let filtered = sortedCourts;

    // Filter by search query (client-side additional filtering)
    if (normalizedQuery) {
      filtered = filtered.filter((c) => {
        const name = (c.name || "").toLowerCase();
        return name.includes(normalizedQuery);
      });
    }

    return filtered;
  }, [sortedCourts, normalizedQuery]);

  const getDistanceText = (court: Court): string | null => {
    if (!userLocation || !court.latitude || !court.longitude) return null;
    const dist = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      court.latitude,
      court.longitude
    );
    if (dist < 1) {
      return `${Math.round(dist * 1000)} متر`;
    }
    return `${dist.toFixed(1)} كم`;
  };

  const openInGoogleMaps = (court: Court) => {
    if (court.latitude && court.longitude) {
      const url = userLocation
        ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${court.latitude},${court.longitude}`
        : `https://www.google.com/maps?q=${court.latitude},${court.longitude}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-500" />
                تصفح الملاعب
              </h1>
              <p className="text-slate-400 mt-1">اكتشف الملاعب القريبة منك</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => getMyLocation(false)}
                disabled={loadingLocation}
                suppressHydrationWarning
              >
                {loadingLocation ? (
                  <span className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span suppressHydrationWarning>
                  {userLocation ? "تحديث موقعي" : "تحديد موقعي"}
                </span>
              </Button>
            </div>
          </div>

          {/* Search and Governorate Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم النادي..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                suppressHydrationWarning
              />
            </div>

            {/* Governorate Select */}
            <div className="w-full md:w-64">
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  setSelectedGovernorate(e.target.value);
                  setSelectedRegion(null); // Reset region when governorate changes
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                suppressHydrationWarning
              >
                {GOVERNORATES.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Region Chips */}
          <div className="mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedRegion(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedRegion === null
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                suppressHydrationWarning
              >
                الكل
              </button>
              {availableRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedRegion === region.id
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  suppressHydrationWarning
                >
                  {region.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="h-7 w-32 bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Skeleton Image */}
                    <div className="h-48 bg-slate-800 animate-pulse" />

                    {/* Skeleton Content */}
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-slate-800 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-slate-800 rounded animate-pulse w-24" />
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-16" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-9 bg-slate-800 rounded-lg animate-pulse flex-1" />
                        <div className="h-9 w-12 bg-slate-800 rounded-lg animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {/* Courts List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">
                    الملاعب ({filteredCourts.length})
                  </h2>
                  {userLocation && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      مرتبة حسب القرب
                    </span>
                  )}
                </div>

                {filteredCourts.length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center animate-in fade-in duration-300">
                    <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      {normalizedQuery
                        ? "لا توجد نتائج للبحث."
                        : "لا توجد ملاعب متاحة"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourts.map((court) => {
                      const distance = getDistanceText(court);

                      // Parse images safely
                      let images: string[] = [];
                      try {
                        images = JSON.parse(court.images || "[]");
                      } catch {
                        images = [];
                      }
                      const mainImage =
                        images[0] ||
                        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600";

                      return (
                        <div
                          key={court.id}
                          className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-emerald-500/50 group"
                        >
                          {/* Court Image */}
                          <div className="relative h-48 bg-slate-800 overflow-hidden">
                            <img
                              src={mainImage}
                              alt={court.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />

                            {/* Distance Badge */}
                            {distance && (
                              <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-2 py-1 flex items-center gap-1">
                                <Navigation className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-xs font-medium">
                                  {distance}
                                </span>
                              </div>
                            )}

                            {/* Navigation Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInGoogleMaps(court);
                              }}
                              className="absolute top-3 left-3 p-2 bg-slate-900/90 backdrop-blur-sm text-emerald-400 border border-slate-700 rounded-lg hover:bg-emerald-500/20 transition-colors"
                              title="الاتجاهات"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Court Info */}
                          <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-1 truncate">
                              {court.name}
                            </h3>
                            <p className="text-slate-400 text-sm truncate flex items-center gap-1 mb-3">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {getFullLocation(court.governorate, court.region)}
                            </p>

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-emerald-400 text-sm font-medium">
                                من {getMinPrice(court)} ج.م/ساعة
                              </span>
                              <span className="text-slate-500 text-xs">
                                {court.fields.length} ملاعب
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Link
                                href={`/courts/${court.id}`}
                                className="flex-1"
                              >
                                <Button size="sm" className="w-full">
                                  احجز الآن
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInGoogleMaps(court);
                                }}
                              >
                                <Navigation className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
