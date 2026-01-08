import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { OwnerTabs } from './OwnerTabs';
import { OwnerLayoutClient } from './OwnerLayoutClient';

export const dynamic = 'force-dynamic';

export default async function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/owner/dashboard');
  }

  if (user.role !== 'OWNER') {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <OwnerTabs />
      <OwnerLayoutClient>
        {children}
      </OwnerLayoutClient>
      <Footer />
    </main>
  );
}

