'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8">
            احجز <span className="text-emerald-500">ملعبك</span> في ثواني
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            منصة ذكية بتنظم حجوزات الملاعب وتسهّل الحجز للاعبين.
            <br />
            اختر، احجز، والعب.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/explore">
              <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
                احجز ملعب الآن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
    </section>
  );
}

