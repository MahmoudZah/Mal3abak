import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '../../../components/ui/button';
import { Plus, MapPin, Users, Banknote, Edit } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function OwnerCourtsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const courts = await prisma.court.findMany({
    where: { ownerId: user.id },
    include: {
      fields: {
        include: {
          reservations: {
            where: {
              startTime: { gte: new Date() }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">إدارة الملاعب</h1>
          <p className="text-slate-400">أضف وعدّل ملاعبك ومواعيدها</p>
        </div>
        <Link href="/owner/courts/new">
          <Button>
            <Plus className="w-4 h-4" />
            إضافة نادي جديد
          </Button>
        </Link>
      </div>

      {courts.length > 0 ? (
        <div className="space-y-6">
          {courts.map(court => {
            let images: string[] = [];
            try { images = JSON.parse(court.images || '[]'); } catch {}
            const img = images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400';
            
            const totalUpcoming = court.fields.reduce((sum, f) => sum + f.reservations.length, 0);
            const priceRange = court.fields.length > 0 
              ? `${Math.min(...court.fields.map(f => f.pricePerHour))} - ${Math.max(...court.fields.map(f => f.pricePerHour))} ج.م`
              : 'لا توجد ملاعب';

            return (
              <div key={court.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-48 h-48 md:h-auto bg-slate-800 flex-shrink-0">
                    <img src={img} alt={court.name} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">{court.name}</h2>
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {court.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/courts/${court.id}`}>
                          <Button variant="ghost" size="sm">عرض الصفحة</Button>
                        </Link>
                        <Link href={`/owner/dashboard/courts/${court.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">عدد الملاعب</p>
                        <p className="text-white font-bold flex items-center gap-1">
                          <Users className="w-4 h-4 text-emerald-500" />
                          {court.fields.length}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">الحجوزات القادمة</p>
                        <p className="text-white font-bold">{totalUpcoming}</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-slate-400 text-xs mb-1">نطاق الأسعار</p>
                        <p className="text-emerald-400 font-bold flex items-center gap-1">
                          <Banknote className="w-4 h-4" />
                          {priceRange}
                        </p>
                      </div>
                    </div>

                    {/* Fields */}
                    <div>
                      <h3 className="text-slate-400 text-sm mb-2">الملاعب:</h3>
                      <div className="flex flex-wrap gap-2">
                        {court.fields.map(field => (
                          <span key={field.id} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                            {field.name} ({field.type === '5v5' ? 'خماسي' : field.type === '7v7' ? 'سباعي' : 'كبير'})
                          </span>
                        ))}
                        {court.fields.length === 0 && (
                          <span className="text-slate-500 text-sm">لا توجد ملاعب</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
          <p className="text-slate-400 mb-4">لم تضف أي نوادي أو ملاعب بعد</p>
          <Link href="/owner/courts/new">
            <Button>
              <Plus className="w-4 h-4" />
              إضافة نادي جديد
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

