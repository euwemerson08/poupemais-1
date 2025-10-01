import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['wallet', 'checking', 'credit_card']),
  balance: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)),
    z.number({ invalid_type_error: "Saldo deve ser um número" }).optional().nullable()
  ),
  color: z.string(),
  icon: z.enum(['wallet', 'landmark', 'credit_card']),
  limit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val)),
    z.number({ invalid_type_error: "Limite deve ser um número" }).optional().nullable()
  ),
  closing_day: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : parseInt(String(val), 10)),
    z.number({ invalid_type_error: "Deve ser um número" }).int().min(1, "Deve ser entre 1 e 31").max(31, "Deve ser entre 1 e 31").optional().nullable()
  ),
  due_day: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : parseInt(String(val), 10)),
    z.number({ invalid_type_error: "Deve ser um número" }).int().min(1, "Deve ser entre 1 e 31").max(31, "Deve ser entre 1 e 31").optional().nullable()
  ),
}).superRefine((data, ctx) => {
  if (data.type !== 'credit_card' && (data.balance === undefined || data.balance === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['balance'],
      message: 'Saldo Inicial é obrigatório.',
    });
  }
});

export type Account = z.infer<typeof accountSchema> & { id: string };
export type AccountFormData = z.infer<typeof accountSchema>;
export type AccountType = Account['type'];
export type AccountIcon = Account['icon'];