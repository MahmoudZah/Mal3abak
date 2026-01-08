import { Suspense } from 'react';
import BrowsePageClient from './BrowsePageClient';

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <BrowsePageClient />
    </Suspense>
  );
}

