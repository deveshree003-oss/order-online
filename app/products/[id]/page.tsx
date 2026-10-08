import Link from "next/link";
import { notFound } from "next/navigation";

import DescriptionWithLinks from "../../_components/description-with-links";
import { extractDealInformation, getDealActions } from "../../_lib/deal-detail";
import { formatDate, formatPrice } from "../../_lib/formatters";
import { getPublishedProductPost } from "../../_lib/product-posts";
import { numericPrice } from "../../_lib/pricing";

export const dynamic = "force-dynamic";

function QuickActions({ description }: { description: string }) {
  const actions = getDealActions(description);

  if (actions.length === 0) return null;

  return (
    <section className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Quick actions</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <a className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-950/10" href={action.url} key={action.url} rel="noopener noreferrer" target="_blank">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-base" aria-hidden="true">{action.icon}</span>
            <span>{action.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default async function ProductPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPublishedProductPost(id);

  if (!post) notFound();

  const orderPrice = numericPrice(post.order_price);
  const lessPrice = numericPrice(post.less_price);
  const isLive = post.status === "live";
  const slotSummary = post.order_form_slots?.slots[0] ?? null;
  const dealInformation = extractDealInformation(post.description);
  const structuredInformation = [
    ["Platform", post.platform ?? dealInformation.platform],
    ["Brand", post.brand ?? dealInformation.brand],
    ["Mediator", dealInformation.mediator],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <main className="min-h-screen bg-[#f4f5f9] px-4 py-6 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link className="inline-flex min-h-10 items-center text-sm font-bold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/">
          <span aria-hidden="true" className="mr-2">←</span> Back to deals
        </Link>
        <article className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 sm:mt-8">
          <div className="relative flex min-h-80 items-center justify-center bg-gradient-to-br from-slate-100 via-[#f8f7fb] to-[#eef5f5] p-8 sm:min-h-[34rem]">
            <img alt={post.product_name || "Product image"} className="max-h-[32rem] w-full object-contain" src={post.image_url} />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-[0.13em] ${isLive ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"}`}>{isLive ? "LIVE" : "OVER"}</span>
              {post.platform && <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">{post.platform}</span>}
            </div>
          </div>
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{isLive ? "Available now" : "Deal ended"}</p>
                {post.product_name && <h1 className="mt-3 line-clamp-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{post.product_name}</h1>}
                <p className="mt-3 text-base font-semibold text-slate-500">{post.brand || "Brand not specified"}{post.platform ? ` · ${post.platform}` : ""}</p>
                {post.rating !== null && <p className="mt-2 text-base font-bold text-amber-600">★ {Number(post.rating).toFixed(1)} / 5 platform rating</p>}
              </div>
            </div>
            {(orderPrice !== null || lessPrice !== null) && <dl className="mt-8 grid gap-3 border-y border-slate-100 py-5 sm:grid-cols-3">
              {orderPrice !== null && <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Order price</dt><dd className="mt-2 text-2xl font-black">{formatPrice(orderPrice)}</dd></div>}
              {lessPrice !== null && <div className="rounded-2xl bg-emerald-50 p-4"><dt className="text-xs font-black uppercase tracking-wide text-emerald-700">Less price</dt><dd className="mt-2 text-3xl font-black text-emerald-700">{formatPrice(lessPrice)}</dd></div>}
            </dl>}
            {slotSummary && <section className={`mt-6 rounded-2xl border p-5 ${slotSummary.availableSlots > 0 ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50"}`}>
              <h2 className={`text-sm font-black uppercase tracking-[0.14em] ${slotSummary.availableSlots > 0 ? "text-sky-800" : "text-rose-800"}`}>Live order-form availability</h2>
              <p className="mt-2 text-lg font-black text-slate-950">Slots left: {slotSummary.availableSlots}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Checked directly from the order form.</p>
            </section>}
            <QuickActions description={post.description} />
            {dealInformation.instruction && <section className="mt-8 rounded-2xl border border-amber-200 bg-[#fffaf0] p-5">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-amber-800">Important deal instruction</h2>
              <p className="mt-2 font-semibold leading-6 text-amber-950">{dealInformation.instruction}</p>
            </section>}
            {structuredInformation.length > 0 && <section className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Deal information</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {structuredInformation.map(([label, value]) => <div className="rounded-2xl border border-slate-200 bg-[#f8f9fb] p-4" key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-base font-bold text-slate-950">{value}</dd></div>)}
              </dl>
            </section>}
            <section className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-950">Original deal details</h2>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-[#fbfbfd] p-5 sm:p-6">
                <DescriptionWithLinks description={post.description} />
              </div>
            </section>
            <p className="mt-8 text-sm text-slate-500">Posted {formatDate(post.created_at)}</p>
          </div>
        </article>
      </div>
    </main>
  );
}
