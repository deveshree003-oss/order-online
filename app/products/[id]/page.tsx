import Link from "next/link";
import { notFound } from "next/navigation";

import DescriptionWithLinks from "../../_components/description-with-links";
import { getDealActions } from "../../_lib/deal-detail";
import { formatDate, formatPrice } from "../../_lib/formatters";
import { getPublishedProductPost } from "../../_lib/product-posts";
import { extractProductUrls } from "../../_lib/product-post-parser";
import { numericPrice } from "../../_lib/pricing";

export const dynamic = "force-dynamic";

function QuickActions({
  description,
  productName,
  brand,
  platform,
  orderPrice,
  lessPrice,
}: {
  description: string;
  productName: string | null;
  brand: string | null;
  platform: string | null;
  orderPrice: number | string | null;
  lessPrice: number | string | null;
}) {
  const actions = getDealActions(description, {
    productName,
    brand,
    platform,
    orderPrice,
    lessPrice,
  }).filter((action) => action.type !== "whatsapp");

  if (actions.length === 0) return null;

  return (
    <section className="mt-6 border-t border-slate-100 pt-5 sm:mt-8 sm:pt-6">
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Quick actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        {actions.map((action) => (
          <a
            className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-950/10 sm:min-h-14 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            href={action.url}
            key={action.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm sm:h-9 sm:w-9 sm:rounded-xl sm:text-base"
            >
              {action.icon}
            </span>
            <span className="min-w-0 break-words">{action.label}</span>
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
  const caption = post.description.replace(
    /(\n\s*)Important:\s*$/i,
    (marker) =>
      post.description.includes(
        "https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF",
      )
        ? ""
        : marker,
  );
  const productOrderUrl = post.order_form_url ?? extractProductUrls(caption)[0] ?? null;
  const whatsappMessage = [
    caption,
    "",
    `Reference: ${post.id}`,
    ...(productOrderUrl ? [`Product/order link: ${productOrderUrl}`] : []),
  ].join("\n");
  const whatsappUrl = new URL("https://wa.me/917588424031");
  whatsappUrl.searchParams.set("text", whatsappMessage);
  return (
    <main className="min-h-screen bg-[#f4f5f9] px-3 py-4 text-slate-950 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link className="inline-flex min-h-10 items-center text-sm font-bold text-slate-600 transition hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-950/10" href="/">
          <span aria-hidden="true" className="mr-2">←</span> Back to deals
        </Link>
        <article className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/5 sm:mt-8">
          <div className="relative flex min-h-64 items-center justify-center bg-gradient-to-br from-slate-100 via-[#f8f7fb] to-[#eef5f5] p-5 sm:min-h-[34rem] sm:p-8">
            <img alt="Product image" className="max-h-[32rem] w-full object-contain" src={post.image_url} />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black tracking-[0.13em] ${isLive ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"}`}>{isLive ? "LIVE" : "OVER"}</span>
            </div>
          </div>
          <div className="min-w-0 p-4 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{isLive ? "Available now" : "Deal ended"}</p>
              </div>
            </div>
            {(orderPrice !== null || lessPrice !== null) && <dl className="mt-6 grid grid-cols-2 gap-2 border-y border-slate-100 py-4 sm:mt-8 sm:gap-3 sm:py-5 sm:grid-cols-3">
              {orderPrice !== null && <div className="min-w-0 rounded-2xl bg-slate-50 p-3 sm:p-4"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">Order price</dt><dd className="mt-2 break-words text-xl font-black sm:text-2xl">{formatPrice(orderPrice)}</dd></div>}
              {lessPrice !== null && <div className="min-w-0 rounded-2xl bg-emerald-50 p-3 sm:p-4"><dt className="text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:text-xs">Less price</dt><dd className="mt-2 break-words text-2xl font-black text-emerald-700 sm:text-3xl">{formatPrice(lessPrice)}</dd></div>}
            </dl>}
            {slotSummary && <section className={`mt-5 rounded-2xl border p-4 sm:mt-6 sm:p-5 ${slotSummary.availableSlots > 0 ? "border-sky-200 bg-sky-50" : "border-rose-200 bg-rose-50"}`}>
              <h2 className={`text-xs font-black uppercase tracking-[0.12em] sm:text-sm sm:tracking-[0.14em] ${slotSummary.availableSlots > 0 ? "text-sky-800" : "text-rose-800"}`}>Available slots</h2>
              <p className="mt-2 text-lg font-black text-slate-950">{slotSummary.availableSlots}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Checked directly from the order form.</p>
            </section>}
            <QuickActions
              brand={post.brand}
              description={post.description}
              lessPrice={post.less_price}
              orderPrice={post.order_price}
              platform={post.platform}
              productName={null}
            />
            <section className="mt-8 border-t border-slate-100 pt-6">
              <h2 className="text-lg font-black text-slate-950">Original deal details</h2>
              <a
                className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-[#25D366] px-5 text-center text-sm font-black tracking-wide text-white shadow-md transition hover:bg-[#1da851] focus:outline-none focus:ring-4 focus:ring-emerald-500/25 sm:min-h-16 sm:text-base"
                href={whatsappUrl.toString()}
                rel="noopener noreferrer"
                target="_blank"
              >
                WhatsApp Reference [MANDATORY]
              </a>
              <div className="mt-3 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#fbfbfd] p-2 sm:p-6">
                <DescriptionWithLinks description={caption} />
              </div>
            </section>
            <p className="mt-8 text-sm text-slate-500">Posted {formatDate(post.created_at)}</p>
          </div>
        </article>
      </div>
    </main>
  );
}
