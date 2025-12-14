import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Format time in 12-hour format
function formatTime12h(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? 'م' : 'ص';
  const hour12 = hours % 12 || 12;
  return `${hour12}:00 ${period}`;
}

export default async function PlayerDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/player/dashboard');
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      reservations: {
        include: { 
          field: {
            include: { court: true }
          }
        },
        orderBy: { startTime: 'desc' }
      }
    }
  });

  if (!fullUser) {
    redirect('/login');
  }

  const now = new Date();
  const upcoming = fullUser.reservations.filter(r => new Date(r.startTime) >= now);
  const past = fullUser.reservations.filter(r => new Date(r.startTime) < now);

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">أهلاً، {fullUser.name}</h1>
                <p className="text-slate-400">تابع حجوزاتك ومواعيدك القادمة</p>
            </div>
            <Link href="/explore">
                <Button>احجز ملعب جديد</Button>
            </Link>
        </div>

        {/* Upcoming */}
        <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-emerald-500" />
                الحجوزات القادمة
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcoming.length > 0 ? upcoming.map(res => {
                    let images: string[] = [];
                    try { images = JSON.parse(res.field.court.images || '[]'); } catch {}
                    const img = images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400';

                    // Calculate hours
                    const hours = Math.round((new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60));

                    return (
                        <div key={res.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex gap-6 hover:border-emerald-500/30 transition-colors">
                            <div className="w-24 h-24 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                 <img 
                                    src={img}
                                    className="w-full h-full object-cover"
                                    alt={res.field.court.name}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg mb-1">{res.field.court.name}</h3>
                                <p className="text-emerald-400 text-sm mb-2">{res.field.name}</p>
                                <div className="space-y-1 text-sm text-slate-400">
                                    <p className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-emerald-500"/> 
                                        {format(new Date(res.startTime), 'EEEE, d MMMM', { locale: arSA })}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-emerald-500"/> 
                                        {formatTime12h(new Date(res.startTime))} - {formatTime12h(new Date(res.endTime))}
                                        <span className="text-slate-500">({hours} ساعة)</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500"/> 
                                        {res.field.court.location}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between items-end">
                                 <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded-full font-medium border border-emerald-500/20">
                                    {res.status === 'CONFIRMED' ? 'مؤكد' : res.status === 'PENDING' ? 'قيد الانتظار' : 'ملغي'}
                                 </span>
                                 <span className="text-emerald-400 font-bold">{res.totalPrice} ج.م</span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full bg-slate-900/50 p-8 rounded-xl text-center text-slate-500 border border-slate-800 border-dashed">
                        <p className="mb-4">لا توجد حجوزات قادمة.</p>
                        <Link href="/explore">
                            <Button variant="outline">تصفح الملاعب</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>

        {/* Past */}
        {past.length > 0 && (
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-slate-500" />
                    الحجوزات السابقة
                </h2>
                 <div className="space-y-4">
                    {past.map(res => {
                        let images: string[] = [];
                        try { images = JSON.parse(res.field.court.images || '[]'); } catch {}
                        const img = images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400';
                        
                        return (
                            <div key={res.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex items-center justify-between opacity-75">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded flex-shrink-0 overflow-hidden">
                                        <img 
                                            src={img}
                                            className="w-full h-full object-cover"
                                            alt={res.field.court.name}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-300">{res.field.court.name}</h4>
                                        <p className="text-xs text-slate-500">{res.field.name} • {format(new Date(res.startTime), 'd MMMM yyyy', { locale: arSA })}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className="text-slate-400 text-sm">{res.totalPrice} ج.م</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
