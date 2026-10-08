import { z } from "zod";
import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";

const bodySchema = z.object({
  rawMessage: z.string().min(10),
  imageUrl: z.string().max(4_000_000).optional().or(z.literal("")),
  imageUrls: z.array(z.string().max(4_000_000)).max(4).optional().default([]),
  marginPercent: z.number().min(1).max(90).default(30),
});

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\b(Xxl|Xl|L|M|S)\b/g, (size) => size.toUpperCase());
}

function parseProduct(rawMessage: string, marginPercent: number) {
  const text = rawMessage.replace(/\r/g, "").trim();
  const lower = text.toLowerCase();

  const fabric = firstMatch(text, [
    /fabrics?\s*[:\-]\s*([^\n]+)/i,
    /fabric\s*[:\-]\s*([^\n]+)/i,
  ]).replace(/[✨⭐️]+/g, "").trim();

  const workDetails = firstMatch(text, [
    /(?:👉\s*)?aline[^\n]*/i,
    /(?:👉\s*)?a[-\s]?line[^\n]*/i,
    /(?:👉\s*)?work\s*[:\-]\s*([^\n]+)/i,
  ]).replace(/^[👉\s]+/, "").trim();

  const pantDetails = firstMatch(text, [
    /(?:👉\s*)?(?:pant|pants)\s*[:\-]\s*([^\n]+)/i,
  ]);

  const size = firstMatch(text, [
    /size\s*[:\-]\s*([^\n]+)/i,
  ]).replace(/\s+only.*$/i, "").trim();

  const costText = firstMatch(text, [
    /(?:wholesale|dealer)[^\d]{0,30}(\d[\d,]*)/i,
    /price[^\d]{0,20}(\d[\d,]*)/i,
  ]);
  const costPrice = Number(costText.replace(/,/g, ""));

  if (!Number.isFinite(costPrice) || costPrice <= 0) {
    throw new Error("I couldn't find the supplier price. Please include a line such as 'wholesale & dealer price 950/-'.");
  }

  const category =
    /saree/i.test(lower) ? "Sarees" :
    /shirt/i.test(lower) ? "Shirts" :
    /top/i.test(lower) ? "Tops" :
    /co[- ]?ord/i.test(lower) ? "Co-ords" :
    /kurta|kurti|a[- ]?line/i.test(lower) ? "Kurta Sets" :
    /dress/i.test(lower) ? "Dresses" :
    "Sets";

  const silhouette = /a[- ]?line/i.test(lower) ? "A-Line" : "";
  const work = /kalamkari/i.test(lower) ? "Kalamkari" : "";
  const productName = [
    fabric ? titleCase(fabric) : "",
    work,
    silhouette,
    category === "Kurta Sets" ? "Kurta Set" : category.slice(0, -1),
  ].filter(Boolean).join(" ");

  const descriptionParts = [
    fabric ? "Crafted in " + fabric + "." : "",
    workDetails ? workDetails.replace(/^aline\s*/i, "").trim() + "." : "",
    pantDetails ? "Includes matching pants in the same fabric (" + pantDetails + ")." : "",
    size ? "Available in " + size + " only." : "",
  ].filter(Boolean);

  const exactPrice = costPrice / (1 - marginPercent / 100);
  const price = Math.ceil((exactPrice - 99) / 100) * 100 + 99;
  const sku = "TT-" + Date.now().toString().slice(-8);

  return {
    name: productName || "Traditional Trends Product",
    category,
    description: descriptionParts.join(" "),
    fabric: fabric || null,
    workDetails: workDetails || null,
    sizes: size || null,
    costPrice,
    marginPercent,
    price,
    oldPrice: null,
    tag: "NEW",
    isSale: false,
    stock: 0,
    sku,
    status: "active",
  };
}

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(superjson.stringify({ error: "Admin access required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = bodySchema.parse(superjson.parse(await request.text()));
    const parsed = parseProduct(body.rawMessage, body.marginPercent);

    const product = await db
      .insertInto("products")
      .values({
        ...parsed,
        imageUrl: body.imageUrl || body.imageUrls[0] || "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=900&q=80",
        imageUrls: body.imageUrls.length ? body.imageUrls : (body.imageUrl ? [body.imageUrl] : []),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ success: true, product }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin product import error:", error);
    const message = error instanceof Error ? error.message : "Could not import product.";
    return new Response(superjson.stringify({ error: message }), {
      status: message.includes("Admin access") ? 403 : 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
