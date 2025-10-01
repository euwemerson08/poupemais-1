-- Create recurring_receivables table
CREATE TABLE public.recurring_receivables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  recurrence_interval TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'monthly', 'yearly'
  end_date DATE, -- Nullable, if it recurs indefinitely
  category_name TEXT,
  category_icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.recurring_receivables ENABLE ROW LEVEL SECURITY;

-- Create policies for each operation
CREATE POLICY "Users can manage their own recurring receivables" ON public.recurring_receivables
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);