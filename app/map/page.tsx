import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface MapPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const { search } = await searchParams;
  const q = (search || "").trim();
  if (!q) redirect("/browse");
  redirect(`/browse?search=${encodeURIComponent(q)}`);
}
