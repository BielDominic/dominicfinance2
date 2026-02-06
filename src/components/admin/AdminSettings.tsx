import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { BlockedEmailsManager } from './BlockedEmailsManager';
import {
  Key,
  Palette,
  Layout,
  Shield,
  Database,
  Bell,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Plus,
  GripVertical,
  Settings2,
  Zap,
  Globe,
  Clock,
  FileText,
  Lock,
  Users,
  AlertTriangle,
  CheckCircle,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemConfig {
  theme_mode: 'light' | 'dark' | 'system';
  primary_color: string;
  accent_color: string;
  border_radius: number;
  compact_mode: boolean;
  show_animations: boolean;
  auto_save: boolean;
  auto_save_interval: number;
  currency_format: string;
  date_format: string;
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  session_timeout: number;
  two_factor_enabled: boolean;
  audit_retention_days: number;
  max_upload_size: number;
  allowed_file_types: string[];
  maintenance_mode: boolean;
  custom_tabs: { key: string; label: string; icon: string; enabled: boolean }[];
}

const DEFAULT_CONFIG: SystemConfig = {
  theme_mode: 'system',
  primary_color: '#166534',
  accent_color: '#f97316',
  border_radius: 18,
  compact_mode: false,
  show_animations: true,
  auto_save: true,
  auto_save_interval: 30,
  currency_format: 'BRL',
  date_format: 'dd/MM/yyyy',
  timezone: 'America/Sao_Paulo',
  notifications_enabled: true,
  email_notifications: false,
  push_notifications: false,
  session_timeout: 60,
  two_factor_enabled: false,
  audit_retention_days: 90,
  max_upload_size: 10,
  allowed_file_types: ['jpg', 'png', 'pdf', 'xlsx'],
  maintenance_mode: false,
  custom_tabs: [
    { key: 'entradas', label: 'Entradas', icon: 'TrendingUp', enabled: true },
    { key: 'despesas', label: 'Despesas', icon: 'DollarSign', enabled: true },
    { key: 'investimentos', label: 'Investimentos', icon: 'PiggyBank', enabled: true },
    { key: 'resumo', label: 'Resumo', icon: 'FileText', enabled: true },
    { key: 'graficos', label: 'Gráficos', icon: 'BarChart', enabled: true },
    { key: 'assistente', label: 'Assistente', icon: 'Bot', enabled: true },
  ],
};

const COLOR_PRESETS = [
  { name: 'Verde Irlanda', primary: '#166534', accent: '#f97316' },
  { name: 'Azul Oceano', primary: '#1e40af', accent: '#06b6d4' },
  { name: 'Roxo Místico', primary: '#7c3aed', accent: '#ec4899' },
  { name: 'Vermelho Vinho', primary: '#991b1b', accent: '#fbbf24' },
  { name: 'Esmeralda', primary: '#047857', accent: '#8b5cf6' },
  { name: 'Noite', primary: '#1f2937', accent: '#60a5fa' },
];

const ICON_OPTIONS = [
  'TrendingUp', 'TrendingDown', 'DollarSign', 'PiggyBank', 'Wallet', 
  'CreditCard', 'Receipt', 'FileText', 'BarChart', 'PieChart', 
  'LineChart', 'Bot', 'User', 'Users', 'Settings', 'Home'
];

export function AdminSettings() {
  const { user } = useAuth();
  const { isMaintenanceMode, maintenanceMessage, toggleMaintenanceMode } = useMaintenanceMode();
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  
  // Password settings
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_key, config_value')
        .eq('config_key', 'app_settings')
        .single();

      if (data && !error) {
        setConfig({ ...DEFAULT_CONFIG, ...(data.config_value as object) });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // Check if config exists
      const { data: existing } = await supabase
        .from('system_config')
        .select('id')
        .eq('config_key', 'app_settings')
        .single();

      let error;
      const configAsJson = JSON.parse(JSON.stringify(config));
      if (existing) {
        const result = await supabase
          .from('system_config')
          .update({ config_value: configAsJson, updated_by: user?.id })
          .eq('config_key', 'app_settings');
        error = result.error;
      } else {
        const result = await supabase
          .from('system_config')
          .insert([{ config_key: 'app_settings', config_value: configAsJson, updated_by: user?.id }]);
        error = result.error;
      }

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'UPDATE_SYSTEM_CONFIG',
        table_name: 'system_config',
        record_id: 'app_settings',
        new_values: { updated: true },
      });

      toast.success('Configurações salvas com sucesso');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateAdminPassword = async () => {
    if (!newPassword) {
      toast.error('Digite a nova senha');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('system_config')
        .update({ config_value: newPassword, updated_by: user?.id })
        .eq('config_key', 'admin_password');

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'UPDATE_ADMIN_PASSWORD',
        table_name: 'system_config',
        record_id: 'admin_password',
        new_values: { updated: true },
      });

      toast.success('Senha do painel atualizada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating admin password:', error);
      toast.error('Erro ao atualizar senha');
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomTab = () => {
    const newTab = {
      key: `custom_${Date.now()}`,
      label: 'Nova Aba',
      icon: 'FileText',
      enabled: true,
    };
    updateConfig('custom_tabs', [...config.custom_tabs, newTab]);
  };

  const updateCustomTab = (index: number, field: string, value: any) => {
    const updated = [...config.custom_tabs];
    updated[index] = { ...updated[index], [field]: value };
    updateConfig('custom_tabs', updated);
  };

  const removeCustomTab = (index: number) => {
    const updated = config.custom_tabs.filter((_, i) => i !== index);
    updateConfig('custom_tabs', updated);
  };

  const exportData = async () => {
    try {
      const [incomes, expenses, investments, decisions] = await Promise.all([
        supabase.from('income_entries').select('*'),
        supabase.from('expense_categories').select('*'),
        supabase.from('investments').select('*'),
        supabase.from('decision_vault').select('*'),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        incomes: incomes.data,
        expenses: expenses.data,
        investments: investments.data,
        decisions: decisions.data,
        config: config,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const clearAuditLogs = async () => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.audit_retention_days);

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      toast.success('Logs antigos removidos com sucesso');
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Erro ao limpar logs');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="password" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 h-auto p-2">
          <TabsTrigger value="password" className="gap-2">
            <Key className="h-4 w-4" />
            Senha
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="tabs" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Abas
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="localization" className="gap-2">
            <Globe className="h-4 w-4" />
            Localização
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Manutenção
          </TabsTrigger>
          <TabsTrigger value="blocked-emails" className="gap-2">
            <Ban className="h-4 w-4" />
            Emails
          </TabsTrigger>
        </TabsList>

        {/* Password Settings */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Senha do Painel Admin
              </CardTitle>
              <CardDescription>
                Altere a senha de acesso ao painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <Button onClick={updateAdminPassword} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Nova Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize cores e tema do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Modo do Tema</Label>
                <div className="flex gap-4">
                  {[
                    { value: 'light', icon: Sun, label: 'Claro' },
                    { value: 'dark', icon: Moon, label: 'Escuro' },
                    { value: 'system', icon: Monitor, label: 'Sistema' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => updateConfig('theme_mode', value as any)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        config.theme_mode === value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Esquema de Cores Predefinido</Label>
                <div className="grid grid-cols-3 gap-4">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateConfig('primary_color', preset.primary);
                        updateConfig('accent_color', preset.accent);
                      }}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        config.primary_color === preset.primary
                          ? 'border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={config.primary_color}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={config.accent_color}
                      onChange={(e) => updateConfig('accent_color', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={config.accent_color}
                      onChange={(e) => updateConfig('accent_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Raio da Borda: {config.border_radius}px</Label>
                <Slider
                  value={[config.border_radius]}
                  onValueChange={([value]) => updateConfig('border_radius', value)}
                  min={0}
                  max={32}
                  step={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Settings */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Layout
              </CardTitle>
              <CardDescription>
                Configure o layout e comportamento da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Modo Compacto</p>
                  <p className="text-sm text-muted-foreground">Reduz espaçamentos e tamanhos</p>
                </div>
                <Switch
                  checked={config.compact_mode}
                  onCheckedChange={(checked) => updateConfig('compact_mode', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Animações</p>
                  <p className="text-sm text-muted-foreground">Habilita transições e animações</p>
                </div>
                <Switch
                  checked={config.show_animations}
                  onCheckedChange={(checked) => updateConfig('show_animations', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Salvamento Automático</p>
                  <p className="text-sm text-muted-foreground">Salva alterações automaticamente</p>
                </div>
                <Switch
                  checked={config.auto_save}
                  onCheckedChange={(checked) => updateConfig('auto_save', checked)}
                />
              </div>

              {config.auto_save && (
                <div className="space-y-2 pl-4">
                  <Label>Intervalo de Salvamento: {config.auto_save_interval}s</Label>
                  <Slider
                    value={[config.auto_save_interval]}
                    onValueChange={([value]) => updateConfig('auto_save_interval', value)}
                    min={10}
                    max={120}
                    step={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabs Management */}
        <TabsContent value="tabs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Gerenciar Abas
              </CardTitle>
              <CardDescription>
                Adicione, remova e reordene abas do dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {config.custom_tabs.map((tab, index) => (
                    <div
                      key={tab.key}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <Input
                        value={tab.label}
                        onChange={(e) => updateCustomTab(index, 'label', e.target.value)}
                        className="flex-1"
                        placeholder="Nome da aba"
                      />
                      <Select
                        value={tab.icon}
                        onValueChange={(value) => updateCustomTab(index, 'icon', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={tab.enabled}
                        onCheckedChange={(checked) => updateCustomTab(index, 'enabled', checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomTab(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button onClick={addCustomTab} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Aba
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Notificações Ativas</p>
                  <p className="text-sm text-muted-foreground">Habilita todas as notificações</p>
                </div>
                <Switch
                  checked={config.notifications_enabled}
                  onCheckedChange={(checked) => updateConfig('notifications_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">Receba alertas importantes por email</p>
                </div>
                <Switch
                  checked={config.email_notifications}
                  onCheckedChange={(checked) => updateConfig('email_notifications', checked)}
                  disabled={!config.notifications_enabled}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                </div>
                <Switch
                  checked={config.push_notifications}
                  onCheckedChange={(checked) => updateConfig('push_notifications', checked)}
                  disabled={!config.notifications_enabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Backup, exportação e limpeza de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={exportData} variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <Download className="h-6 w-6" />
                    <span>Exportar Backup</span>
                    <span className="text-xs text-muted-foreground">JSON completo</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4" disabled>
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span>Importar Backup</span>
                    <span className="text-xs text-muted-foreground">Em breve</span>
                  </div>
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Retenção de Logs: {config.audit_retention_days} dias</Label>
                <Slider
                  value={[config.audit_retention_days]}
                  onValueChange={([value]) => updateConfig('audit_retention_days', value)}
                  min={7}
                  max={365}
                  step={7}
                />
              </div>

              <Button onClick={clearAuditLogs} variant="outline" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Logs Antigos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configure opções de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Timeout da Sessão: {config.session_timeout} minutos</Label>
                <Slider
                  value={[config.session_timeout]}
                  onValueChange={([value]) => updateConfig('session_timeout', value)}
                  min={5}
                  max={240}
                  step={5}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-muted-foreground">Requer código adicional no login</p>
                </div>
                <Badge variant="secondary">Em breve</Badge>
              </div>

              <div className="space-y-2">
                <Label>Tamanho Máximo de Upload: {config.max_upload_size}MB</Label>
                <Slider
                  value={[config.max_upload_size]}
                  onValueChange={([value]) => updateConfig('max_upload_size', value)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization Settings */}
        <TabsContent value="localization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localização
              </CardTitle>
              <CardDescription>
                Configure formato de moeda, data e fuso horário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato de Moeda</Label>
                  <Select
                    value={config.currency_format}
                    onValueChange={(value) => updateConfig('currency_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Formato de Data</Label>
                  <Select
                    value={config.date_format}
                    onValueChange={(value) => updateConfig('date_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select
                  value={config.timezone}
                  onValueChange={(value) => updateConfig('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                    <SelectItem value="America/New_York">Nova York (EST)</SelectItem>
                    <SelectItem value="Europe/London">Londres (GMT)</SelectItem>
                    <SelectItem value="Europe/Dublin">Dublin (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance
              </CardTitle>
              <CardDescription>
                Otimize o desempenho do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Cache de Dados</p>
                  <p className="text-sm text-muted-foreground">Armazena dados localmente para acesso rápido</p>
                </div>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Ativo
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Pré-carregamento</p>
                  <p className="text-sm text-muted-foreground">Carrega dados em segundo plano</p>
                </div>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" /> Ativo
                </Badge>
              </div>

              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Cache
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Mode */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Modo de Manutenção
              </CardTitle>
              <CardDescription>
                Coloque o sistema em manutenção para atualizações. Usuários comuns verão uma tela de manutenção.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Ativar Modo de Manutenção</p>
                  <p className="text-sm text-muted-foreground">
                    Apenas administradores poderão acessar o sistema
                  </p>
                </div>
                <Switch
                  checked={isMaintenanceMode}
                  disabled={isTogglingMaintenance}
                  onCheckedChange={async (checked) => {
                    setIsTogglingMaintenance(true);
                    const { error } = await toggleMaintenanceMode(checked, maintenanceMsg || undefined);
                    if (error) {
                      toast.error('Erro ao alterar modo de manutenção');
                    } else {
                      toast.success(checked ? 'Modo de manutenção ativado' : 'Modo de manutenção desativado');
                    }
                    setIsTogglingMaintenance(false);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Manutenção</Label>
                <Textarea
                  value={maintenanceMsg || maintenanceMessage}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  placeholder="O sistema está em manutenção. Tente novamente mais tarde."
                  rows={3}
                />
              </div>

              {isMaintenanceMode && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Modo de manutenção ativo
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usuários comuns não conseguirão acessar o sistema até você desativar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Emails */}
        <TabsContent value="blocked-emails">
          <BlockedEmailsManager />
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <Button onClick={saveConfig} size="lg" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      )}
    </div>
  );
}
