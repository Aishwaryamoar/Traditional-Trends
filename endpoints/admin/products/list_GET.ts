import superjson from "superjson";
import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "admin") {
      return new Response(superjson.stringify({ error: "Admin access required." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const products = await db
      .selectFrom("products")
      .selectAll()
      .orderBy("createdAt", "desc")
      .execute();

    return new Response(superjson.stringify({ products }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin product list error:", error);
    return new Response(superjson.stringify({ error: "Unable to load products." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}