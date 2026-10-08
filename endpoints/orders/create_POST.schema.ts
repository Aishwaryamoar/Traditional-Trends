import { z } from "zod";
export const CreateOrderBody = z.object({
  items: z.array(z.object({productId:z.number().int().positive(),size:z.string().min(1),quantity:z.number().int().min(1)})).min(1),
  shippingAddress:z.object({fullName:z.string().min(2),phone:z.string().min(8),addressLine1:z.string().min(3),addressLine2:z.string().optional(),city:z.string().min(2),state:z.string().min(2),pincode:z.string().min(4)})
});
