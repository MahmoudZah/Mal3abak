import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, XCircle, Phone, User as UserIcon, Image as ImageIcon } from 'lucide-react';
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
            include: { 
              court: {
                include: {
                  owner: {
                    select: {
                      name: true,
                      phone: true,
                    }
                  }
                }
              }
            }
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
            
            {upcoming.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {upcoming.map((res, index) => {
                        let images: string[] = [];
                        try { images = JSON.parse(res.field.court.images || '[]'); } catch {}
                        const img = images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400';

                        // Calculate hours
                        const hours = Math.round((new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60));
                        
                        // Status styling
                        const statusConfig = {
                          PENDING: { label: 'قيد المراجعة', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle },
                          CONFIRMED: { label: 'مؤكد', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
                          CANCELLED: { label: 'ملغي', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
                        };
                        const status = statusConfig[res.status as keyof typeof statusConfig] || statusConfig.PENDING;
                        const StatusIcon = status.icon;

                        return (
                            <div 
                                key={res.id} 
                                className={`flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors ${
                                    index !== upcoming.length - 1 ? 'border-b border-slate-800' : ''
                                }`}
                            >
                                {/* Image */}
                                <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={img}
                                        className="w-full h-full object-cover"
                                        alt={res.field.court.name}
                                    />
                                </div>
                                
                                {/* Court & Field Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg mb-1 truncate">{res.field.court.name}</h3>
                                    <p className="text-emerald-400 text-sm mb-2">{res.field.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500"/> 
                                            {format(new Date(res.startTime), 'd MMM', { locale: arSA })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-slate-500"/> 
                                            {formatTime12h(new Date(res.startTime))} - {formatTime12h(new Date(res.endTime))}
                                        </span>
                                        <span className="text-slate-500">({hours} ساعة)</span>
                                    </div>
                                </div>
                                
                                {/* Status */}
                                <div className="flex-shrink-0">
                                    <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium border ${status.color}`}>
                                        <StatusIcon className="w-4 h-4" />
                                        {status.label}
                                    </span>
                                </div>
                                
                                {/* Price */}
                                <div className="flex-shrink-0 text-left min-w-[100px]">
                                    <p className="text-emerald-400 font-bold text-lg">{res.totalPrice} ج.م</p>
                                    <p className="text-slate-500 text-xs">المبلغ الكلي</p>
                                </div>
                                
                                {/* Owner Contact & Payment Proof */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    {res.field.court.owner.phone && (
                                        <a 
                                            href={`tel:${res.field.court.owner.phone}`}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                            title={`اتصل بـ ${res.field.court.owner.name}`}
                                        >
                                            <Phone className="w-4 h-4 text-slate-400" />
                                        </a>
                                    )}
                                    {res.paymentProof && (
                                        <a 
                                            href={res.paymentProof} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="عرض إثبات الدفع"
                                        >
                                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-slate-900/50 p-8 rounded-xl text-center text-slate-500 border border-slate-800 border-dashed">
                    <p className="mb-4">لا توجد حجوزات قادمة.</p>
                    <Link href="/explore">
                        <Button variant="outline">تصفح الملاعب</Button>
                    </Link>
                </div>
            )}
        </div>

        {/* Past */}
        {past.length > 0 && (
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-slate-500" />
                    الحجوزات السابقة
                </h2>
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {past.map((res, index) => {
                        let images: string[] = [];
                        try { images = JSON.parse(res.field.court.images || '[]'); } catch {}
                        const img = images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400';
                        const hours = Math.round((new Date(res.endTime).getTime() - new Date(res.startTime).getTime()) / (1000 * 60 * 60));
                        
                        return (
                            <div 
                                key={res.id} 
                                className={`flex items-center gap-4 p-4 opacity-60 hover:opacity-80 transition-opacity ${
                                    index !== past.length - 1 ? 'border-b border-slate-800' : ''
                                }`}
                            >
                                <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                    <img 
                                        src={img}
                                        className="w-full h-full object-cover"
                                        alt={res.field.court.name}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-300 truncate">{res.field.court.name}</h4>
                                    <p className="text-slate-500 text-sm">
                                        {res.field.name} • {format(new Date(res.startTime), 'd MMM yyyy', { locale: arSA })}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-slate-400 font-medium">{res.totalPrice} ج.م</p>
                                    <p className="text-slate-600 text-xs">{hours} ساعة</p>
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
