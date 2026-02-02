-- =============================================
-- SISTEMA DE AUTENTICAÇÃO E PAPÉIS
-- =============================================

-- Enum para papéis de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de papéis (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- =============================================
-- SISTEMA DE PERMISSÕES POR SEÇÃO
-- =============================================

CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section_key TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, section_key)
);

-- =============================================
-- CONFIGURAÇÕES GLOBAIS DO SISTEMA (ADMIN)
-- =============================================

CREATE TABLE public.system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- LOGS DE AUDITORIA
-- =============================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    financial_impact DECIMAL(15,2),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SNAPSHOTS FINANCEIROS (VERSIONAMENTO)
-- =============================================

CREATE TABLE public.financial_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    snapshot_type TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', 'manual'
    data JSONB NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- COFRE DE DECISÕES
-- =============================================

CREATE TABLE public.decision_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    decision_date DATE NOT NULL DEFAULT CURRENT_DATE,
    financial_impact DECIMAL(15,2),
    tags TEXT[],
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ALERTAS INTELIGENTES
-- =============================================

CREATE TABLE public.smart_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'danger'
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    related_table TEXT,
    related_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- TAGS SEMÂNTICAS
-- =============================================

CREATE TABLE public.semantic_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- FUNÇÕES DE SEGURANÇA
-- =============================================

-- Função para verificar papel do usuário (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin')
$$;

-- Função para obter papel do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_tags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - USER ROLES
-- =============================================

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - USER PERMISSIONS
-- =============================================

CREATE POLICY "Users can view own permissions"
ON public.user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage permissions"
ON public.user_permissions FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - SYSTEM CONFIG
-- =============================================

CREATE POLICY "Anyone can view system config"
ON public.system_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can modify system config"
ON public.system_config FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - AUDIT LOGS
-- =============================================

CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- =============================================
-- RLS POLICIES - FINANCIAL SNAPSHOTS
-- =============================================

CREATE POLICY "Authenticated users can view snapshots"
ON public.financial_snapshots FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage snapshots"
ON public.financial_snapshots FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - DECISION VAULT
-- =============================================

CREATE POLICY "Authenticated users can view decisions"
ON public.decision_vault FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert decisions"
ON public.decision_vault FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own decisions or admins"
ON public.decision_vault FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete decisions"
ON public.decision_vault FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - SMART ALERTS
-- =============================================

CREATE POLICY "Authenticated users can view alerts"
ON public.smart_alerts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update alerts"
ON public.smart_alerts FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Admins can manage alerts"
ON public.smart_alerts FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- RLS POLICIES - SEMANTIC TAGS
-- =============================================

CREATE POLICY "Authenticated users can view tags"
ON public.semantic_tags FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage tags"
ON public.semantic_tags FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decision_vault_updated_at
BEFORE UPDATE ON public.decision_vault
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE REALTIME FOR ALL TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.income_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.smart_alerts;

-- =============================================
-- INSERIR CONFIGURAÇÕES INICIAIS DO SISTEMA
-- =============================================

INSERT INTO public.system_config (config_key, config_value) VALUES
('theme', '{"primary": "#6366f1", "mode": "dark"}'),
('layout', '{"tabOrder": ["entradas", "despesas", "investimentos", "resumo", "dashboard"], "hiddenTabs": []}'),
('branding', '{"title": "Planejamento Financeiro", "subtitle": "Irlanda 2026", "logoUrl": null}'),
('features', '{"multiCurrency": true, "aiAssistant": true, "charts": true, "exportPdf": true}')
ON CONFLICT (config_key) DO NOTHING;