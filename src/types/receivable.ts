import { z } from 'zod';

export const receivableSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória."),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "O valor é obrigatório." }).positive("O valor deve ser positivo.")
  ),
  due_date: z.date({ required_error: "Data de vencimento é obrigatória." }).optional(), // Optional for recurring
  category_id: z.string().min(1, "Categoria é obrigatória."),
  is_recurring: z.boolean().optional().default(false),
  due_day: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : parseInt(String(val), 10)),
    z.number({ invalid_type_error: "Dia de vencimento deve ser um número" }).int().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31").optional()
  ),
  start_date: z.date({ required_error: "Data de início é obrigatória." }).optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring) {
    if (data.due_day === undefined || data.due_day === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_day'],
        message: 'Dia de vencimento é obrigatório para recebimentos recorrentes.',
      });
    }
    if (data.start_date === undefined || data.start_date === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_date'],
        message: 'Data de início é obrigatória para recebimentos recorrentes.',
      });
    }
  } else {
    if (data.due_date === undefined || data.due_date === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['due_date'],
        message: 'Data de vencimento é obrigatória para recebimentos únicos.',
      });
    }
  }
});

export type ReceivableFormData = z.infer<typeof receivableSchema>;

export interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received';
  received_at: string | null;
  category_name: string | null;
  category_icon: string | null;
}

export interface RecurringReceivable {
  id: string;
  description: string;
  amount: number;
  due_day: number;
  category_name: string;
  category_icon: string;
  start_date: string;
}

export const recurringReceivableSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Descrição é obrigatória."),
  amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "O valor é obrigatório." }).positive("O valor deve ser positivo.")
  ),
  due_day: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : parseInt(String(val), 10)),
    z.number({ required_error: "Dia de vencimento é obrigatório." }).int().min(1, "Dia deve ser entre 1 e 31").max(31, "Dia deve ser entre 1 e 31")
  ),
  category_id: z.string().min(1, "Categoria é obrigatória."),
  start_date: z.date({ required_error: "Data de início é obrigatória." }),
});

export type RecurringReceivableFormData = z.infer<typeof recurringReceivableSchema>;