-- Create table for dashboard people (participants)
CREATE TABLE public.dashboard_people (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_people ENABLE ROW LEVEL SECURITY;

-- Create policies - everyone authenticated can view and modify (shared dashboard)
CREATE POLICY "Authenticated users can view people"
ON public.dashboard_people
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage people"
ON public.dashboard_people
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default people (Gabriel, Myrelle, Ambos)
INSERT INTO public.dashboard_people (name, color, display_order) VALUES
('Gabriel', '#3b82f6', 1),
('Myrelle', '#ec4899', 2),
('Ambos', '#8b5cf6', 3);

-- Create trigger for updated_at
CREATE TRIGGER update_dashboard_people_updated_at
    BEFORE UPDATE ON public.dashboard_people
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_people;