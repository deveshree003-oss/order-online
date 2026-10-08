"use server";

import { revalidatePath } from "next/cache";

import { getAdminSession } from "../../_lib/admin-auth";
import { removeProductImage } from "../../_lib/product-image-storage";
import { createSupabaseServerClient } from "../../_lib/supabase-server";
import { classifySupabaseError, logSupabaseError } from "../../_lib/supabase-error";
import { resolveProductPostMetadata } from "../../_lib/product-post-metadata";
import {
  cleanProductTitle,
  isValidProductName,
  nullablePrice,
  parseProductPostMessage,
} from "../../_lib/product-post-parser";
import type { CreateDealState } from "./state";

const postStatuses = ["draft", "live", "over"] as const;
type ProductPostStatus = (typeof postStatuses)[number];

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function rawTextValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function priceValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validatePost(formData: FormData) {
  const imageUrl = textValue(formData, "imageUrl");
  const description = rawTextValue(formData, "details");
  const status = textValue(formData, "status");
  const productName = textValue(formData, "productName");
  const brand = textValue(formData, "brand");
  const platform = textValue(formData, "platform");
  const orderPrice = priceValue(textValue(formData, "orderPrice"));
  const lessPrice = priceValue(textValue(formData, "lessPrice"));
  const fieldErrors: Record<string, string> = {};

  if (!imageUrl || !validHttpUrl(imageUrl)) fieldErrors.imageUrl = "Upload a valid product image before publishing.";
  if (!description.trim()) fieldErrors.details = "Add a product description before publishing.";
  if (description.length > 10000) fieldErrors.details = "Description must be 10,000 characters or fewer.";
  if (!postStatuses.includes(status as ProductPostStatus)) fieldErrors.status = "Choose a valid post status.";
  if (textValue(formData, "orderPrice") && orderPrice === null) fieldErrors.orderPrice = "Enter a valid non-negative order price.";
  if (textValue(formData, "lessPrice") && lessPrice === null) fieldErrors.lessPrice = "Enter a valid non-negative final price.";

  return {
    fieldErrors,
    values: { imageUrl, description, status: status as ProductPostStatus, productName: productName || null, brand: brand || null, platform: platform || null, orderPrice, lessPrice },
  };
}

function unauthorized(message: string): CreateDealState {
  return { errorMessage: message, successMessage: null, fieldErrors: {} };
}

function validSubmittedName(value: string) {
  const cleaned = cleanProductTitle(value);
  return isValidProductName(cleaned) ? cleaned : "";
}

async function metadataForPublish(formData: FormData, description: string) {
  const parsed = parseProductPostMessage(description);
  const submittedName = validSubmittedName(textValue(formData, "productName"));
  const submittedBrand = textValue(formData, "brand");
  const submittedPlatform = textValue(formData, "platform");
  const submittedOrderPrice = priceValue(textValue(formData, "orderPrice"));
  const submittedLessPrice = priceValue(textValue(formData, "lessPrice"));
  const labeledName = validSubmittedName(parsed.productName);
  const needsRemoteName = !submittedName && !labeledName;
  const extracted = needsRemoteName
    ? await resolveProductPostMetadata(description)
    : {
        productName: "",
        brand: null,
        platform: null,
        orderPrice: null,
        lessPrice: null,
        rating: null,
      };

  return {
    productName: submittedName || labeledName || extracted.productName,
    brand: submittedBrand || parsed.brand || extracted.brand || "",
    platform: submittedPlatform || parsed.platform || extracted.platform || "",
    orderPrice: submittedOrderPrice ?? nullablePrice(parsed.orderPrice) ?? extracted.orderPrice,
    lessPrice: submittedLessPrice ?? nullablePrice(parsed.lessPrice) ?? extracted.lessPrice,
    rating: extracted.rating,
  };
}

function insertErrorMessage(error: unknown) {
  const category = classifySupabaseError(error);
  if (category === "rls") return "Supabase denied the product post insert. Confirm your account is an active admin and the product_posts INSERT policy is applied.";
  if (category === "missing-table") return "The product_posts table is missing. Apply 20261002_create_product_posts.sql in Supabase before publishing.";
  if (category === "missing-column") return "The base product_posts columns are missing. Apply 20261002_create_product_posts.sql in Supabase before publishing.";
  if (category === "network") return "Supabase could not be reached while publishing. Check the Supabase URL and network connection.";
  return "We could not publish this product post. Check the server log for the Supabase error code and message.";
}

export async function createProductPostAction(_previousState: CreateDealState, formData: FormData): Promise<CreateDealState> {
  const { user, isAuthorized } = await getAdminSession();
  if (!user) return unauthorized("Your session has expired. Please sign in again.");
  if (!isAuthorized) return unauthorized("You are not authorized to publish product posts.");

  const description = rawTextValue(formData, "details");
  const finalDescription = addDefaultDealInfo(description);
  const extracted = await metadataForPublish(formData, finalDescription);
  const enriched = new FormData();
  for (const [name, value] of formData.entries()) enriched.append(name, value);
  enriched.set("details", finalDescription);
  enriched.set("productName", extracted.productName);
  enriched.set("brand", extracted.brand ?? "");
  enriched.set("platform", extracted.platform ?? "");
  enriched.set("orderPrice", extracted.orderPrice === null ? "" : String(extracted.orderPrice));
  enriched.set("lessPrice", extracted.lessPrice === null ? "" : String(extracted.lessPrice));
  const { fieldErrors, values } = validatePost(enriched);
  if (Object.keys(fieldErrors).length > 0) return { errorMessage: "Please correct the highlighted fields.", successMessage: null, fieldErrors };

  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  if (!storageBucket || !values.imageUrl.includes(`/storage/v1/object/public/${storageBucket}/`)) {
    return unauthorized("The image must be uploaded to the configured product-images bucket before publishing.");
  }

  const supabase = await createSupabaseServerClient();
  const existing = await supabase
    .from("product_posts")
    .select("id")
    .eq("image_url", values.imageUrl)
    .eq("description", values.description)
    .eq("status", values.status)
    .limit(1)
    .maybeSingle();
  if (existing.data) {
    const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
    if (storageBucket) await removeProductImage(supabase, values.imageUrl, storageBucket);
    revalidatePath("/");
    revalidatePath("/admin/create-deal");
    return { errorMessage: null, successMessage: "Product published successfully.", fieldErrors: {} };
  }
  if (existing.error && classifySupabaseError(existing.error) !== "rls") {
    logSupabaseError("Unable to check for an existing product post before insert.", existing.error, "warn");
  }
  const fullPayload = {
    image_url: values.imageUrl,
    description: values.description,
    status: values.status,
    product_name: values.productName,
    brand: values.brand,
    platform: values.platform,
    order_price: values.orderPrice,
    less_price: values.lessPrice,
    rating: extracted.rating,
  };
  let { error } = await supabase.from("product_posts").insert(fullPayload);

  if (error && classifySupabaseError(error) === "missing-column") {
    const metadataPayload = {
      image_url: values.imageUrl,
      description: values.description,
      status: values.status,
      product_name: values.productName,
      brand: values.brand,
      platform: values.platform,
      order_price: values.orderPrice,
      less_price: values.lessPrice,
    };
    const metadataAttempt = await supabase.from("product_posts").insert(metadataPayload);
    error = metadataAttempt.error;
  }

  if (error && classifySupabaseError(error) === "missing-column") {
    const baseAttempt = await supabase.from("product_posts").insert({
      image_url: values.imageUrl,
      description: values.description,
      status: values.status,
    });
    error = baseAttempt.error;
  }

  if (error) {
    logSupabaseError("Unable to create product post.", error);
    return unauthorized(insertErrorMessage(error));
  }

  revalidatePath("/");
  revalidatePath("/admin/create-deal");
  return { errorMessage: null, successMessage: "Product published successfully.", fieldErrors: {} };
}

export async function updateProductPostAction(formData: FormData) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to update product posts." };

  const id = textValue(formData, "postId");
  const description = rawTextValue(formData, "details");
  const finalDescription = addDefaultDealInfo(description);
  const extracted = await metadataForPublish(formData, finalDescription);
  const enriched = new FormData();
  for (const [name, value] of formData.entries()) enriched.append(name, value);
  enriched.set("details", finalDescription);
  enriched.set("productName", extracted.productName);
  enriched.set("brand", extracted.brand ?? "");
  enriched.set("platform", extracted.platform ?? "");
  enriched.set("orderPrice", extracted.orderPrice === null ? "" : String(extracted.orderPrice));
  enriched.set("lessPrice", extracted.lessPrice === null ? "" : String(extracted.lessPrice));
  const { fieldErrors, values } = validatePost(enriched);
  if (!id) return { errorMessage: "A product post id is required." };
  if (Object.keys(fieldErrors).length > 0) return { errorMessage: "Please correct the highlighted fields.", fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { data: existingPost, error: existingPostError } = await supabase
    .from("product_posts")
    .select("status, image_url")
    .eq("id", id)
    .maybeSingle();
  if (existingPostError || !existingPost) return { errorMessage: "That product post could not be found." };

  const payload = {
    image_url: values.imageUrl,
    description: values.description,
    status: values.status,
    product_name: values.productName,
    brand: values.brand,
    platform: values.platform,
    order_price: values.orderPrice,
    less_price: values.lessPrice,
    rating: extracted.rating,
  };
  const { data: updatedPost, error } = await supabase
    .from("product_posts")
    .update(payload)
    .eq("id", id)
    .select("id, image_url, description, status, product_name, brand, platform, order_price, less_price, rating")
    .maybeSingle();

  if (error) {
    logSupabaseError("Unable to update product post metadata.", error);
    return { errorMessage: "We could not update this product post." };
  }
  if (!updatedPost) {
    logSupabaseError("Product post update returned no row.", { code: "UPDATE_NO_ROW", message: `No product post matched id ${id}.` });
    return { errorMessage: "The product post could not be verified after saving." };
  }
  if (existingPost.image_url !== values.imageUrl) {
    const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
    if (storageBucket) await removeProductImage(supabase, existingPost.image_url, storageBucket);
  }
  revalidatePath("/");
  revalidatePath("/admin/create-deal");
  revalidatePath(`/products/${id}`);
  return { errorMessage: null };
}

export async function deleteProductPostAction(id: string) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to delete product posts." };
  if (!id) return { errorMessage: "A product post id is required." };

  const supabase = await createSupabaseServerClient();
  const { data: post, error: lookupError } = await supabase.from("product_posts").select("image_url").eq("id", id).maybeSingle();
  if (lookupError || !post) return { errorMessage: "That product post could not be found." };
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  if (storageBucket) {
    const imageError = await removeProductImage(supabase, post.image_url, storageBucket);
    if (imageError) return { errorMessage: "The product image could not be removed, so the product was not deleted." };
  }
  const { error } = await supabase.from("product_posts").delete().eq("id", id);
  if (error) return { errorMessage: "We could not delete this product post." };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/create-deal");
  revalidatePath(`/products/${id}`);
  return { errorMessage: null };
}

export async function markProductPostOverAction(id: string) {
  const { user, isAuthorized } = await getAdminSession();
  if (!user || !isAuthorized) return { errorMessage: "You are not authorized to update product posts." };
  if (!id) return { errorMessage: "A product post id is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("product_posts").update({ status: "over" }).eq("id", id);
  if (error) return { errorMessage: "We could not mark this product post as over." };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/products/${id}`);
  return { errorMessage: null };
}

export type ProductPostActionState = {
  errorMessage: string | null;
};

export async function deleteProductPostFormAction(
  _previousState: ProductPostActionState,
  formData: FormData,
): Promise<ProductPostActionState> {
  return deleteProductPostAction(textValue(formData, "postId"));
}

export async function markProductPostOverFormAction(formData: FormData) {
  await markProductPostOverAction(textValue(formData, "postId"));
}
const DEFAULT_DEAL_INFO = `*Mediator :- Samarth*
---------------------------------------------------------------
MANDATORY to Join this For Fast
*PAYMENT UPDATES 😇* & *REGULAR RATTING🥳* Deals 🌟
[**https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF**](https://chat.whatsapp.com/GR9V81zaR0226WSgCbN3wF)`;
function addDefaultDealInfo(description: string) {
  const normalized = description.toLowerCase();

  if (
    normalized.includes("samarth") &&
    normalized.includes("payment updates") &&
    normalized.includes("regular ratting") &&
    normalized.includes("chat.whatsapp.com/gr9v81zar0226wsgcbn3wf")
  ) {
    return description;
  }

  return `${description.trim()}\n\n${DEFAULT_DEAL_INFO}`;
}
