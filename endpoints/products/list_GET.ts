import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle() {
  try {
    const products = await db
      .selectFrom("products")
      .selectAll()
      .where("status", "in", ["active", "out_of_stock"])
      .orderBy("createdAt", "desc")
      .execute();

    return new Response(superjson.stringify({ products }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", Pragma: "no-cache" },
    });
  } catch (error) {
    console.error("Product list error:", error);
    return new Response(superjson.stringify({ error: "Unable to load products." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
