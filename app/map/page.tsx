'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Navigation, ExternalLink, Building2, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface Court {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  fields: { pricePerHour: number }[];
}

// Calculate distance between two points (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didAutoLocate = useRef(false);

  const [courts, setCourts] = useState<Court[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all courts
  useEffect(() => {
    fetch('/api/courts')
      .then(res => res.json())
      .then(data => {
        setCourts(data.courts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Init search from URL (?search=)
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  // Courts with location
  const courtsWithLocation = useMemo(() => 
    courts.filter(c => c.latitude && c.longitude),
    [courts]
  );

  // Courts sorted by distance if user location is available
  const sortedCourts = useMemo(() => {
    if (!userLocation) return courtsWithLocation;
    
    return [...courtsWithLocation].sort((a, b) => {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!);
      return distA - distB;
    });
  }, [courtsWithLocation, userLocation]);

  const getMyLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) alert('المتصفح لا يدعم تحديد الموقع');
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
        if (!silent) alert('فشل في تحديد موقعك. تأكد من السماح للمتصفح بالوصول للموقع.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Auto-locate once to enable "nearest first" sorting by default
  useEffect(() => {
    if (didAutoLocate.current) return;
    didAutoLocate.current = true;
    getMyLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredCourts = useMemo(() => {
    if (!normalizedQuery) return sortedCourts;
    return sortedCourts.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const loc = (c.location || '').toLowerCase();
      return name.includes(normalizedQuery) || loc.includes(normalizedQuery);
    });
  }, [sortedCourts, normalizedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      router.replace('/map');
      return;
    }
    router.replace(`/map?search=${encodeURIComponent(q)}`);
  };

  const getDistanceText = (court: Court): string | null => {
    if (!userLocation || !court.latitude || !court.longitude) return null;
    const dist = calculateDistance(userLocation.lat, userLocation.lng, court.latitude, court.longitude);
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
      window.open(url, '_blank');
    }
  };

  // Create Google Maps embed URL
  const getMapEmbedUrl = () => {
    // Center on Cairo by default
    let center = '30.0444,31.2357';
    let zoom = 11;

    if (userLocation) {
      center = `${userLocation.lat},${userLocation.lng}`;
      zoom = 13;
    } else if (selectedCourt?.latitude && selectedCourt?.longitude) {
      center = `${selectedCourt.latitude},${selectedCourt.longitude}`;
      zoom = 15;
    } else if (courtsWithLocation.length > 0) {
      const first = courtsWithLocation[0];
      center = `${first.latitude},${first.longitude}`;
    }

    // Use no-key embed to avoid leaking API keys in client code
    return `https://www.google.com/maps?q=${encodeURIComponent(center)}&z=${zoom}&output=embed`;
  };

  const getMinPrice = (court: Court) => {
    if (!court.fields.length) return 0;
    return Math.min(...court.fields.map(f => f.pricePerHour));
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
                <MapPin className="w-6 h-6 text-emerald-500" />
                خريطة الملاعب
              </h1>
              <p className="text-slate-400 mt-1">اكتشف الملاعب القريبة منك</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => getMyLocation(false)}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <span className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {userLocation ? 'تحديث موقعي' : 'تحديد موقعي'}
              </Button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="relative max-w-xl">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم النادي أو المنطقة..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-3 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden h-[500px] lg:h-[600px]">
                {courtsWithLocation.length > 0 ? (
                  <iframe
                    src={getMapEmbedUrl()}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <MapPin className="w-12 h-12 mb-4" />
                    <p>لا توجد ملاعب بمواقع GPS حالياً</p>
                  </div>
                )}
              </div>

              {/* Courts List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pl-2">
                <div className="flex items-center justify-between sticky top-0 bg-slate-950 py-2">
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
                  <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center">
                    <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      {normalizedQuery ? 'لا توجد نتائج للبحث.' : 'لا توجد ملاعب بمواقع GPS'}
                    </p>
                  </div>
                ) : (
                  filteredCourts.map(court => {
                    const distance = getDistanceText(court);
                    const isSelected = selectedCourt?.id === court.id;
                    
                    return (
                      <div
                        key={court.id}
                        className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 ${
                          isSelected ? 'border-emerald-500' : 'border-slate-800'
                        }`}
                        onClick={() => setSelectedCourt(court)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold truncate">{court.name}</h3>
                            <p className="text-slate-400 text-sm truncate flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {court.location}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-emerald-400 text-sm font-medium">
                                من {getMinPrice(court)} ج.م/ساعة
                              </span>
                              {distance && (
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  {distance}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openInGoogleMaps(court);
                            }}
                            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                            title="الاتجاهات"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Link href={`/courts/${court.id}`} className="flex-1">
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
                    );
                  })
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

