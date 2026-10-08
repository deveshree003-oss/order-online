import Link from "next/link";

import type { ProductPost } from "../_lib/product-posts";
import { formatDate, formatPrice } from "../_lib/formatters";
import { numericPrice } from "../_lib/pricing";

export default function ProductPostCard({
  post,
  position,
}: {
  post: ProductPost;
  position?: number;
}) {
  const orderPrice = numericPrice(post.order_price);
  const lessPrice = numericPrice(post.less_price);
  const isLive = post.status === "live";
  const detailUrl = `/products/${post.id}`;


  return (
    <article className="group flex min-h-[210px] flex-row overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10 md:min-h-0 md:flex-col md:rounded-2xl">
      {/* Product image */}
      <div className="relative flex w-[42%] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-[#f8f7fb] to-[#eef5f5] p-3 md:aspect-[4/3] md:w-auto md:p-5">
        <Link
          aria-label={`View ${post.product_name || "product"} details`}
          className="group/image flex h-full w-full items-center justify-center rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-950/20"
          href={detailUrl}
        >
          <img
            alt={post.product_name || "Product image"}
            className="h-full w-full object-contain transition duration-500 group-hover/image:scale-105"
            src={post.image_url}
          />
        </Link>

        {/* ONE LIVE / OVER badge only */}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.13em] shadow-sm md:left-4 md:top-4 md:px-3 md:py-1.5 ${
            isLive
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 text-white"
          }`}
        >
          {isLive ? "LIVE" : "OVER"}
        </span>
      </div>

      {/* Product information */}
      <div className="flex min-w-0 flex-1 flex-col p-3 md:p-5">
        {/* Mobile top row */}
        <div className="flex items-center gap-2 md:hidden">
          {position !== undefined && (
            <span className="rounded-full bg-[#f3f1e8] px-3 py-2 text-sm font-black text-slate-950">
              #{position}
            </span>
          )}

          <span className="ml-auto shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-500">
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* Desktop platform row */}
        <div className="hidden items-center justify-between text-xs font-bold uppercase tracking-[0.12em] md:flex">
          {post.platform && (
            <p className="text-slate-500">{post.platform}</p>
          )}
        </div>

        {/* Mobile platform */}
        {post.platform && (
          <div className="mt-2 md:hidden">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
              {post.platform}
            </span>
          </div>
        )}

        {/* Product name */}
        <div className="mt-3 min-h-[3rem]">
          {post.product_name && (
            <h3 className="line-clamp-2 text-lg font-black leading-6 tracking-tight text-slate-950">
              <Link
                className="rounded-sm transition hover:text-emerald-700 hover:underline hover:underline-offset-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                href={detailUrl}
              >
                {post.product_name}
              </Link>
            </h3>
          )}
        </div>

        {/* Brand / Rating */}
        <div className="mt-2 min-h-5">
          {post.brand && (
            <p className="hidden text-sm font-medium text-slate-500 md:block">
              {post.brand}
            </p>
          )}

          {post.rating !== null && (
            <p className="mt-1 text-sm font-bold text-amber-600">
              ★ {Number(post.rating).toFixed(1)} / 5
            </p>
          )}
        </div>

        

        {/* Pricing */}
        {orderPrice !== null && lessPrice !== null ? (
          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-[#f8f9fb] p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Order price</dt>
              <dd className="mt-1 text-lg font-black text-slate-950">
                {formatPrice(orderPrice)}
              </dd>
            </div>

            <div className="rounded-xl bg-emerald-50 px-3 py-2">
              <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                Less price
              </dt>

              <dd className="mt-1 text-2xl font-black text-emerald-700">
                {formatPrice(lessPrice)}
              </dd>
            </div>
          </dl>
        ) : lessPrice !== null ? (
          <div className="mt-3 w-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 md:mt-5 md:w-auto md:rounded-2xl md:p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
              Less price
            </p>

            <p className="mt-0.5 text-2xl font-black leading-none text-emerald-700 md:mt-1 md:text-3xl md:leading-normal">
              {formatPrice(lessPrice)}
            </p>
          </div>
        ) : orderPrice !== null ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Order price
            </p>

            <p className="mt-1 text-2xl font-black text-slate-950">
              {formatPrice(orderPrice)}
            </p>
          </div>
        ) : null}

        {/* View deal */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 md:pt-5">
          <p className="hidden text-xs text-slate-500 md:block">
            Posted {formatDate(post.created_at)}
          </p>

          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-sm font-bold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-4 focus:ring-orange-500/25 md:min-h-11 md:w-auto md:rounded-xl md:bg-slate-950 md:px-4 md:shadow-none md:hover:bg-slate-700"
            href={detailUrl}
          >
            View deal
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}