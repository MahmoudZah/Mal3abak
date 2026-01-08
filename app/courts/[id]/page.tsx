import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { BookingPanel } from "./BookingPanel";
import { MapPin, Users, Navigation } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CourtDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const court = await prisma.court.findUnique({
    where: { id },
    include: {
      fields: true,
    },
  });

  if (!court) return notFound();

  // Parse images safely
  let images: string[] = [];
  try {
    images = JSON.parse(court.images || "[]");
  } catch {
    images = [];
  }
  const mainImage =
    images[0] ||
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1000";

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero Image */}
      <div className="h-[400px] w-full relative">
        <div className="absolute inset-0 bg-slate-900" />
        <img
          src={mainImage}
          alt={court.name}
          className="w-full h-full object-cover relative z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent z-20" />
        <div className="absolute bottom-0 w-full p-8 container mx-auto z-30">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {court.name}
          </h1>
          <div className="flex flex-wrap items-center text-slate-200 gap-6 text-lg">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-500" /> {court.location}
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />{" "}
              {court.fields.length} ملاعب متاحة
            </span>
            {court.latitude && court.longitude && (
              <a 
                href={`https://www.google.com/maps?q=${court.latitude},${court.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm"
              >
                <Navigation className="w-4 h-4" />
                الاتجاهات
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Description & Fields */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-4">
              تفاصيل النادي
            </h2>
            <p className="text-slate-300 leading-loose text-lg whitespace-pre-line">
              {court.description || "لا يوجد وصف متاح."}
            </p>
          </div>

          {/* Fields List */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              الملاعب المتاحة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {court.fields.map((field) => (
                <div
                  key={field.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-lg">
                      {field.name}
                    </h3>
                    <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded-full border border-emerald-500/20">
                      {field.type === "5v5"
                        ? "خماسي"
                        : field.type === "7v7"
                        ? "سباعي"
                        : "كبير"}
                    </span>
                  </div>
                  <p className="text-emerald-400 font-bold">
                    {field.pricePerHour} ج.م / ساعة
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Images Grid */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">صور النادي</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.length > 0 ? (
                images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-video bg-slate-800 rounded-xl overflow-hidden group"
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={`${court.name} - صورة ${i + 1}`}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 aspect-video bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                  لا توجد صور
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Booking Panel */}
        <div className="lg:col-span-1">
          <BookingPanel 
            court={court} 
            fields={court.fields}
            paymentName={court.paymentName || ''}
            paymentPhone={court.paymentPhone || ''}
            paymentMethod={court.paymentMethod || ''}
          />
        </div>
      </div>

      <Footer />
    </main>
  );
}
