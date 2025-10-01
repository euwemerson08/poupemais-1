-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity TEXT,
  price NUMERIC,
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_list_items
CREATE POLICY "Users can view items from their own shopping lists" ON public.shopping_list_items
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create items in their own shopping lists" ON public.shopping_list_items
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid())
);

CREATE POLICY "Users can update items in their own shopping lists" ON public.shopping_list_items
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid())
);

CREATE POLICY "Users can delete items from their own shopping lists" ON public.shopping_list_items
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.shopping_lists WHERE id = list_id AND user_id = auth.uid())
);