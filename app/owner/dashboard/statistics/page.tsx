import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { StatisticsClient } from './StatisticsClient';

export const dynamic = 'force-dynamic';

export default async function StatisticsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'OWNER') {
    redirect('/login');
  }

  // Fetch owner's courts with all necessary data
  const courts = await prisma.court.findMany({
    where: { ownerId: user.id },
    include: {
      fields: {
        include: {
          reservations: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            },
            orderBy: { startTime: 'desc' }
          }
        }
      }
    }
  });

  return <StatisticsClient courts={courts} />;
}

