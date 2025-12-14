'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'أحمد محمود',
    role: 'لاعب',
    content: 'أخيراً لقيت تطبيق يحل مشكلة الحجز! بدل ما أروح الملعب وأرجع، دلوقتي بحجز من البيت.',
    rating: 5,
  },
  {
    name: 'محمد سعيد',
    role: 'صاحب ملعب',
    content: 'زادت الحجوزات عندي ٤٠٪ بعد ما سجلت ملعبي. التطبيق سهل ومنظم جداً.',
    rating: 5,
  },
  {
    name: 'عمر خالد',
    role: 'لاعب',
    content: 'سهل جداً وسريع. بحجز الملعب في ثواني ومش بضيع وقت.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">آراء مستخدمينا</h2>
          <p className="text-slate-400 text-lg">شوف إيه رأي اللاعبين وأصحاب الملاعب</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-slate-900 p-8 rounded-2xl border border-slate-800"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">&quot;{item.content}&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-slate-500 text-sm">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

