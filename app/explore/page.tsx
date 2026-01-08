import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ExplorePageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { search } = await searchParams;
  const q = (search || '').trim();
  if (!q) redirect('/browse');
  redirect(`/browse?search=${encodeURIComponent(q)}`);
}
