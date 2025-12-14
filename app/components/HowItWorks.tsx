'use client';

import { motion } from 'framer-motion';
import { Search, Calendar, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '١',
    title: 'ابحث عن ملعب',
    description: 'تصفح الملاعب القريبة منك وشوف التفاصيل والأسعار'
  },
  {
    icon: Calendar,
    step: '٢',
    title: 'اختر موعدك',
    description: 'اختر الوقت المناسب ليك من المواعيد المتاحة'
  },
  {
    icon: CheckCircle,
    step: '٣',
    title: 'أكد الحجز',
    description: 'أكد حجزك واستمتع باللعب مع أصحابك'
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">كيف يعمل ملعبك؟</h2>
          <p className="text-slate-400 text-lg">ثلاث خطوات بسيطة للحجز</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <item.icon className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

