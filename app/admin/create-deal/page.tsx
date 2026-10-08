import Link from "next/link";
import { redirect } from "next/navigation";

import CreateDealForm from "./create-deal-form";
import { getAdminSession } from "../../_lib/admin-auth";
import LogoutButton from "../logout-button";

export const dynamic = "force-dynamic";

export default async function CreateDealPage() {
  const { user, isAuthorized } = await getAdminSession();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAuthorized) {
    redirect("/admin/access-denied");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-4 py-6 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><Link className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700" href="/admin">OrderOnline</Link><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Create Product Post</h1></div><nav className="flex flex-wrap items-center gap-2 text-sm font-bold sm:gap-3"><Link className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/admin">Dashboard</Link><Link className="inline-flex rounded-xl px-3 py-2 text-slate-600 transition hover:bg-white hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/">View site</Link><LogoutButton /></nav></header>
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="mt-7"><CreateDealForm /></div>
        </section>
      </div>
    </main>
  );
}