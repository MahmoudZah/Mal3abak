import { Suspense } from 'react';
import RegisterPageClient from './RegisterPageClient';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <RegisterPageClient />
    </Suspense>
  );
}

