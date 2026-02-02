-- Create user counter config table for individual user settings
CREATE TABLE public.user_counter_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  target_date TEXT DEFAULT '',
  counter_title TEXT DEFAULT 'Contagem para Irlanda',
  counter_background TEXT DEFAULT 'ireland',
  counter_icon TEXT DEFAULT 'shamrock',
  counter_color TEXT DEFAULT 'green',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_counter_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own counter config
CREATE POLICY "Users can view own counter config"
ON public.user_counter_config
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own counter config
CREATE POLICY "Users can insert own counter config"
ON public.user_counter_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own counter config
CREATE POLICY "Users can update own counter config"
ON public.user_counter_config
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own counter config
CREATE POLICY "Users can delete own counter config"
ON public.user_counter_config
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_counter_config_updated_at
BEFORE UPDATE ON public.user_counter_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();