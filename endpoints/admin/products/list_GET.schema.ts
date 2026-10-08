import superjson from "superjson";

export type OutputType =
  | { products: Array<Record<string, unknown>> }
  | { error: string };

export const getAdminProducts = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch("/_api/admin/products/list", {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return superjson.parse<OutputType>(await result.text());
};
