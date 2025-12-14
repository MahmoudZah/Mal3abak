import { Suspense } from 'react';
import MapPageClient from './MapPageClient';

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <MapPageClient />
    </Suspense>
  );
}

