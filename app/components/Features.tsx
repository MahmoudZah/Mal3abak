'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, TrendingUp, Users, Clock } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'ملاعب قريبة منك',
    description: 'ابحث عن الملاعب في منطقتك بكل سهولة وشاهد الصور والتقييمات.'
  },
  {
    icon: Calendar,
    title: 'حجز فوري',
    description: 'تصفح المواعيد المتاحة واحجز وقتك المفضل بضغطة زر واحدة.'
  },
  {
    icon: Trophy,
    title: 'تجربة احترافية',
    description: 'نضمن لك ملاعب مجهزة ومجتمع رياضي يدعم شغفك.'
  }
];

const ownerFeatures = [
  {
    icon: TrendingUp,
    title: 'زيادة دخلك',
    description: 'تحليلات دقيقة تساعدك تفهم أوقات الذروة وتزيد نسبة الإشغال.'
  },
  {
    icon: Clock,
    title: 'تنظيم وقتك',
    description: 'جدول حجوزات ذكي يمنع التضارب ويسهل إدارة المواعيد.'
  },
  {
    icon: Users,
    title: 'قاعدة عملاء',
    description: 'وصل ملعبك لآلاف اللاعبين الباحثين عن مكان للعب.'
  }
];

export function Features() {
  return (
    <div className="py-24 bg-slate-950">
      {/* Player Features */}
      <div className="container mx-auto px-4 mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">لماذا تختار <span className="text-emerald-500">ملعبك</span>؟</h2>
          <p className="text-slate-400 text-lg">كل ما يحتاجه اللاعب في مكان واحد</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-colors"
            >
              <feature.icon className="w-12 h-12 text-emerald-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Owner Features */}
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">لأصحاب الملاعب</h2>
          <p className="text-slate-400 text-lg">أدوات احترافية لإدارة مشروعك</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ownerFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-colors"
            >
              <feature.icon className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

