import { z } from 'zod';

export const shoppingListItemSchema = z.object({
  id: z.string().uuid().optional(),
  list_id: z.string().uuid().optional(), // Optional for form input, required for DB
  description: z.string().min(1, "A descrição é obrigatória."),
  quantity: z.string().optional().nullable(),
  price: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ invalid_type_error: "O preço deve ser um número." }).positive("O preço deve ser um valor positivo.").optional().nullable()
  ),
  is_purchased: z.boolean().default(false).optional(),
});

export const shoppingListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome da lista é obrigatório."),
});

export type ShoppingListItem = z.infer<typeof shoppingListItemSchema> & { id: string; list_id: string; };
export type ShoppingListItemFormData = z.infer<typeof shoppingListItemSchema>;

export type ShoppingList = z.infer<typeof shoppingListSchema> & {
  id: string;
  user_id: string;
  created_at: string;
  items: ShoppingListItem[]; // Items will be nested
};

export type ShoppingListFormData = z.infer<typeof shoppingListSchema>;