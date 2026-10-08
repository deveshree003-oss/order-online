import assert from "node:assert/strict";
import test from "node:test";

import { cleanProductTitle, deriveProductCodeTitle, deriveProductNameFromUrl, inferProductNameFromMessage, isValidProductName, nullablePrice, parseProductPostMessage } from "../app/_lib/product-post-parser.ts";

const example = `https://www.amazon.in/dp/B0F53TTJF5?th=1&psc=1
Ratings deal
Less - 119
Code - AE-19-Maroon
Any size`;

test("parses the example without using the deal label as the product name", () => {
  const metadata = parseProductPostMessage(example);

  assert.equal(metadata.productName, "");
  assert.equal(metadata.brand, "");
  assert.equal(metadata.platform, "Amazon");
  assert.equal(metadata.orderPrice, "");
  assert.equal(metadata.lessPrice, "119");
});

test("keeps missing prices null while preserving a real zero price", () => {
  assert.equal(nullablePrice(""), null);
  assert.equal(nullablePrice("0"), 0);
  assert.equal(nullablePrice("249"), 249);
});

test("extracts a numeric less amount while leaving missing order price absent", () => {
  const metadata = parseProductPostMessage("Less - 300\nRatings deal");

  assert.equal(metadata.lessPrice, "300");
  assert.equal(metadata.orderPrice, "");
  assert.equal(nullablePrice(metadata.orderPrice), null);
  assert.equal(nullablePrice(metadata.lessPrice), 300);
});

test("treats less phrases as the final purchase price", () => {
  assert.equal(parseProductPostMessage("320 less").lessPrice, "320");
  assert.equal(parseProductPostMessage("₹320 less").lessPrice, "320");
  assert.equal(parseProductPostMessage("Less 320").lessPrice, "320");
  assert.equal(parseProductPostMessage("Less Price: ₹3,699.00 Only").lessPrice, "3699.00");
});

test("removes an Amazon website and category suffix without changing the product title", () => {
  assert.equal(
    cleanProductTitle("20000mAh Power Bank: Amazon.in: Electronics"),
    "20000mAh Power Bank",
  );
  assert.equal(
    cleanProductTitle("USB-C Power Bank 22.5W"),
    "USB-C Power Bank 22.5W",
  );
  assert.equal(
    cleanProductTitle("Portronics Power Plate 10K 10000mAh Power Bank | 22.5W Fast Charging | Type C Input | Amazon.in"),
    "Portronics Power Plate 10K 10000mAh Power Bank",
  );
});

test("parses the saved FirstCry message price formatting", () => {
  const metadata = parseProductPostMessage(
    "Product code: BAYBEE_Bedside_Crib_fc\nBrand Name: Dom\nPlatform: FirstCry\nOrder Link: https://bitli.in/QyeGq8Q\nOrder Price: ₹11,999/-\nLess Price: ₹3,699.00 Only",
  );

  assert.equal(metadata.productName, "");
  assert.equal(metadata.brand, "Dom");
  assert.equal(metadata.platform, "FirstCry");
  assert.equal(metadata.orderPrice, "11999");
  assert.equal(metadata.lessPrice, "3699.00");
});

test("derives a clearly non-verified title clue from the FirstCry product code", () => {
  assert.equal(
    deriveProductCodeTitle("Product code: BAYBEE_Bedside_Crib_fc"),
    "Baybee Bedside Crib",
  );
});

test("derives a short product title from an order-link search term or product path", () => {
  assert.equal(
    deriveProductNameFromUrl("https://www.amazon.in/s?k=Winter+Jacket+for+man&rh=p_78%3AB0CGHYDJFD%2Cssx%3Arelevance"),
    "Winter Jacket for Man",
  );
  assert.equal(
    deriveProductNameFromUrl("https://www.amazon.in/UNIGEN-Bluetooth-Wireless-Compatible-Receiver/dp/B0GZ46LDQW/ref=sr_1_7?sr=8-7"),
    "UNIGEN Bluetooth Wireless Compatible Receiver",
  );
  assert.equal(
    deriveProductNameFromUrl("https://www.amazon.in/dp/B0F53TTJF5?th=1&psc=1"),
    "",
  );
  assert.equal(deriveProductNameFromUrl("https://bitli.in/QyeGq8Q"), "");
  assert.equal(isValidProductName("B0F53TTJF5"), false);
  assert.equal(isValidProductName("QyeGq8Q"), false);
});

test("never treats a deal type, mediator, or product code as a product name", () => {
  const description = "Deal Type: Review\nMediator Name: Samarth\nProduct Code: Unigen_WiFiDongle5g_Az";

  assert.equal(isValidProductName("Deal Type: Review"), false);
  assert.equal(isValidProductName("Mediator Name: Samarth"), false);
  assert.equal(inferProductNameFromMessage(description), "");
  assert.equal(parseProductPostMessage(description).productName, "");
  assert.equal(parseProductPostMessage(`${description}\nhttps://bitli.in/QyeGq8Q`).productName, "");
  assert.equal(deriveProductCodeTitle(description), "Unigen WiFi Dongle 5G Az");
});

test("skips message instructions and review requirements before finding a product name", () => {
  const description = "Don't Change Link\n4/5 star review\nMeal pod Black";

  assert.equal(isValidProductName("Don't Change Link"), false);
  assert.equal(isValidProductName("4/5 star review"), false);
  assert.equal(inferProductNameFromMessage(description), "Meal pod Black");
});

test("infers product name and platform from ordinary deal-message lines", () => {
  const message = "Winter Jacket Del/err 50 extra\nAmazon link: https://www.amazon.in/dp/example\n320 less";
  const metadata = parseProductPostMessage(message);

  assert.equal(metadata.productName, "Winter Jacket");
  assert.equal(metadata.platform, "Amazon");
  assert.equal(inferProductNameFromMessage(message), "Winter Jacket");
});

test("accepts explicit product names and rejects generic deal labels", () => {
  assert.equal(parseProductPostMessage("Product: Nike Running Shoes\nReview\n320 less").productName, "Nike Running Shoes");
  assert.equal(parseProductPostMessage("Product Name: Samsung Galaxy S24").productName, "Samsung Galaxy S24");
  assert.equal(parseProductPostMessage("Item: Portable Smart Lamp").productName, "Portable Smart Lamp");
  assert.equal(parseProductPostMessage("Review\nOrder links:\nhttps://www.amazon.in/dp/example").productName, "");
  assert.equal(parseProductPostMessage("Rating 69\nhttps://www.amazon.in/dp/example").productName, "");
});

test("cleans store and marketing suffixes into short product names", () => {
  assert.equal(cleanProductTitle("Amazon.in: Nike Men's Running Shoes Online in India"), "Nike Men's Running Shoes");
  assert.equal(cleanProductTitle("BAYBEE Bedside Crib for Baby with Rocking Mode | Bassinet"), "BAYBEE Bedside Crib for Baby with Rocking Mode");
  assert.equal(cleanProductTitle("Sydney Portable Smart Lamp Buy Online - FirstCry"), "Sydney Portable Smart Lamp");
  assert.equal(cleanProductTitle("Winter Jacket Del/err 50 extra"), "Winter Jacket");
  assert.equal(inferProductNameFromMessage("Winter Jacket Del/err 50 extra\n320 less"), "Winter Jacket");
});
