'use client';

import Link from 'next/link';
import { MapPin, Banknote, Users } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface CourtWithFields {
  id: string;
  name: string;
  location: string;
  images: string;
  fields: { id: string; pricePerHour: number }[];
}

interface CourtCardProps {
  court: CourtWithFields;
}

export function CourtCard({ court }: CourtCardProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    try {
        const images = JSON.parse(court.images || '[]');
        return images[0] || 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800';
    } catch {
        return 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800';
    }
  });

  // Get price range
  const prices = court.fields.map(f => f.pricePerHour);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceText = minPrice === maxPrice ? `${minPrice} ج.م` : `${minPrice} - ${maxPrice} ج.م`;

  return (
    <div className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 flex flex-col h-full">
      <div className="aspect-video relative overflow-hidden bg-slate-800">
        <img 
            src={imgSrc} 
            alt={court.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-10"
            onError={() => {
                setImgSrc('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800');
            }}
        />
        <div className="absolute top-2 right-2 z-20 bg-slate-950/80 backdrop-blur px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
            <Users className="w-3 h-3" />
            {court.fields.length} ملاعب
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2">{court.name}</h3>
        
        <div className="flex items-center text-slate-400 text-sm mb-2">
          <MapPin className="w-4 h-4 ml-1 text-emerald-500" />
          <span>{court.location}</span>
        </div>

        <div className="flex items-center text-slate-400 text-sm mb-6">
          <Banknote className="w-4 h-4 ml-1 text-emerald-500" />
          <span>يبدأ من {priceText} / ساعة</span>
        </div>

        <div className="mt-auto">
            <Link href={`/courts/${court.id}`}>
            <Button className="w-full">
                احجز الآن
            </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
