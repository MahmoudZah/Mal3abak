export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12 text-slate-400">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-emerald-500 font-bold text-xl mb-4">ملعبك</h3>
            <p className="text-sm leading-relaxed">
              المنصة الأولى لحجز الملاعب الرياضية بسهولة وسرعة.
              نربط بين اللاعبين وأصحاب الملاعب في مكان واحد.
            </p>
          </div>
          <div>
            <h4 className="text-slate-200 font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/browse" className="hover:text-emerald-400 transition-colors">تصفح الملاعب</a></li>
              <li><a href="/register?role=owner" className="hover:text-emerald-400 transition-colors">سجل ملعبك</a></li>
              <li><a href="/about" className="hover:text-emerald-400 transition-colors">عن المنصة</a></li>
            </ul>
          </div>
           <div>
            <h4 className="text-slate-200 font-semibold mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white transition-colors cursor-pointer">info@mal3bak.com</li>
              <li className="hover:text-white transition-colors cursor-pointer" dir="ltr">+20 10 1234 5678</li>
            </ul>
          </div>
          <div>
             <h4 className="text-slate-200 font-semibold mb-4">قانونية</h4>
              <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">الشروط والأحكام</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">سياسة الخصوصية</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm">
          © {new Date().getFullYear()} ملعبك. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
