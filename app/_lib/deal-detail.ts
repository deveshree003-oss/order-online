import { tokenizeDescription, type DescriptionPart } from "./description-links.ts";

export type DealAction = {
  url: string;
  type: "product" | "order" | "refund" | "track" | "whatsapp";
  label: string;
  icon: string;
};

export type DealInformation = {
  dealType: string | null;
  platform: string | null;
  brand: string | null;
  mediator: string | null;
  instruction: string | null;
};

function cleanValue(value: string) {
  return value.trim().replace(/^["'`]+|["'`]+$/g, "").trim() || null;
}

function valueAfterLabel(description: string, label: string) {
  const match = description.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
  return match ? cleanValue(match[1]) : null;
}

export function extractDealInformation(description: string): DealInformation {
  const instruction = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^(?:⚠️|warning|important)\b/i.test(line) || /don't\s+(?:change|modify)|do\s+not\s+(?:change|modify)/i.test(line));

  return {
    dealType: valueAfterLabel(description, "Deal Type"),
    platform: valueAfterLabel(description, "Platform"),
    brand: valueAfterLabel(description, "Brand(?: Name)?"),
    mediator: valueAfterLabel(description, "Mediator(?: Name)?"),
    instruction: instruction ? cleanValue(instruction) : null,
  };
}

function canonicalUrl(value: string) {
  const trimmed = value.trim().replace(/[.,!?;:]+$/, "");
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
  } catch {
    return trimmed;
  }
}

function actionType(actionLabel: string): DealAction["type"] {
  if (actionLabel === "Join WhatsApp") return "whatsapp";
  if (actionLabel === "Open refund form") return "refund";
  if (actionLabel === "Open order form") return "order";
  if (actionLabel === "Track order") return "track";
  return "product";
}

function actionPresentation(type: DealAction["type"]) {
  switch (type) {
    case "order":
      return { label: "Open Order Form", icon: "📝" };
    case "refund":
      return { label: "Open Refund Form", icon: "💰" };
    case "track":
      return { label: "Track Order", icon: "📊" };
    case "whatsapp":
      return {
        label: "Send Reference on WhatsApp (MANDATORY)",
        icon: "📩",
      };
    default:
      return { label: "Open Product", icon: "🛒" };
  }
}

export function getDealActions(description: string): DealAction[] {
  const seen = new Set<string>();
  const actions: DealAction[] = [];

  for (const part of tokenizeDescription(description)) {
    if (part.kind !== "link") continue;
    const type = actionType(part.actionLabel ?? "Open product");
    const key = `${type}:${canonicalUrl(part.url)}`;
    if (seen.has(key)) continue;

    seen.add(key);
    const presentation = actionPresentation(type);
    if (type === "product" && part.label !== part.url) {
      presentation.label = `Open ${part.label}`;
    }
    actions.push({ url: part.url, type, ...presentation });
  }

  return actions;
}

export function getOriginalDescriptionParts(description: string): DescriptionPart[] {
  return tokenizeDescription(description);
}
