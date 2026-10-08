import superjson from "superjson";

export type OutputType =
  | { products: Array<Record<string, unknown>> }
  | { error: string };

export const getProducts = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch("/_api/products/list", {
    method: "GET",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return superjson.parse<OutputType>(await result.text());
};
