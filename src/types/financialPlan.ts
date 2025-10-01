import { z } from 'zod';

export const financialPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome do plano é obrigatório."),
  goal_amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "A meta é obrigatória." }).positive("A meta deve ser um valor positivo.")
  ),
});

export const addValueSchema = z.object({
    amount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val)),
    z.number({ required_error: "O valor é obrigatório." }).positive("O valor deve ser positivo.")
  ),
})

export type FinancialPlan = {
  id: string;
  name: string;
  current_amount: number;
  goal_amount: number;
};

export type FinancialPlanFormData = z.infer<typeof financialPlanSchema>;
export type AddValueFormData = z.infer<typeof addValueSchema>;