'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function OwnerLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayPath, setDisplayPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== displayPath) {
      setIsLoading(true);
      
      // Short delay to show loading, then hide it
      const timer = setTimeout(() => {
        setDisplayPath(pathname);
        setIsLoading(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [pathname, displayPath]);

  return (
    <div className="flex-1 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        </div>
      )}
      <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  );
}

