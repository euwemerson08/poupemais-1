import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['wallet', 'checking', 'credit_card']),
  balance: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val),
    z.number({ invalid_type_error: "Saldo deve ser um número" })
  ),
  color: z.string(),
  icon: z.enum(['wallet', 'landmark', 'credit_card']),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)),
    z.number({ invalid_type_error: "Limite deve ser um número" }).optional().nullable()
  ),
});

export type Account = z.infer<typeof accountSchema> & { id: string };
export type AccountFormData = z.infer<typeof accountSchema>;
export type AccountType = Account['type'];
export type AccountIcon = Account['icon'];