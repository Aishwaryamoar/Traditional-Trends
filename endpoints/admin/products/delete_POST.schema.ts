import superjson from "superjson";
import { z } from "zod";
export const schema=z.object({id:z.number().int().positive()}); export type OutputType={success:true}|{error:string};
export const postDeleteProduct=async(body:z.infer<typeof schema>,init?:RequestInit):Promise<OutputType>=>{const result=await fetch("/_api/admin/products/delete",{method:"POST",...init,headers:{"Content-Type":"application/json",...(init?.headers??{})},body:superjson.stringify(body)});return superjson.parse<OutputType>(await result.text());};