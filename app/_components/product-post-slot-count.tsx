"use client";

import { useEffect, useState } from "react";

import type { OrderFormSlotAvailability } from "../_lib/order-form-slots";

export default function ProductPostSlotCount({
  formUrl,
  className = "mt-2",
}: {
  formUrl: string | null;
  className?: string;
}) {
  const [availability, setAvailability] =
    useState<OrderFormSlotAvailability | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!formUrl) return;

    const requestedFormUrl = formUrl;
    const controller = new AbortController();

    async function loadSlots() {
      try {
        const response = await fetch(
          `/api/product-post-slots?url=${encodeURIComponent(requestedFormUrl)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setUnavailable(true);
          return;
        }

        const result = (await response.json()) as {
          slots: OrderFormSlotAvailability | null;
        };
        setAvailability(result.slots);
        setUnavailable(!result.slots);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      }
    }

    void loadSlots();

    return () => controller.abort();
  }, [formUrl]);

  if (!formUrl) return null;

  const slotCount = availability?.slots[0]?.availableSlots;

  return (
    <p
      aria-live="polite"
      className={`${className} w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide md:text-xs ${
        slotCount !== undefined
          ? slotCount > 0
            ? "bg-sky-100 text-sky-800"
            : "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {slotCount !== undefined
        ? slotCount > 0
          ? `${slotCount} slots left`
          : "No slots left"
        : unavailable
          ? "Slots unavailable"
          : "Checking slots…"}
    </p>
  );
}
