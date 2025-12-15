import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { AdminTabs } from "./AdminTabs";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-emerald-500">
              ملعبك
            </Link>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{user.name}</span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-slate-400 hover:text-white text-sm"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <AdminTabs />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

