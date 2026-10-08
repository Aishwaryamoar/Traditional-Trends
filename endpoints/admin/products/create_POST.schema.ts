import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  rawMessage: z.string().min(10),
  imageUrl: z.string().max(4_000_000).optional().or(z.literal("")),
  imageUrls: z.array(z.string().max(4_000_000)).max(4).optional().default([]),
  marginPercent: z.number().min(1).max(90).default(30),
});

export type OutputType =
  | { success: true; product: Record<string, unknown> }
  | { error: string };

export const postCreateProduct = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch("/_api/admin/products/create", {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: superjson.stringify(body),
  });
  return superjson.parse<OutputType>(await result.text());
};
