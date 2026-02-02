import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Activity, 
  Calendar, 
  Mail, 
  Eye, 
  Pencil,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  Loader2,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserWithProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_sign_in: string | null;
}

interface UserPermission {
  section_key: string;
  can_view: boolean;
  can_edit: boolean;
}

interface UserActivity {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  financial_impact: number | null;
}

interface UserStats {
  totalIncomes: number;
  totalExpenses: number;
  totalInvestments: number;
  totalDecisions: number;
}

const SECTIONS = [
  { key: 'entradas', label: 'Entradas', icon: TrendingUp },
  { key: 'despesas', label: 'Despesas', icon: DollarSign },
  { key: 'investimentos', label: 'Investimentos', icon: TrendingUp },
  { key: 'resumo', label: 'Resumo Financeiro', icon: FileText },
  { key: 'dashboard', label: 'Dashboard', icon: Activity },
  { key: 'assistente', label: 'Assistente IA', icon: User },
  { key: 'conversor', label: 'Conversor de Moedas', icon: DollarSign },
  { key: 'graficos', label: 'Gráficos', icon: Activity },
  { key: 'decisoes', label: 'Decisões', icon: FileText },
];

interface UserDetailModalProps {
  user: UserWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  onUserUpdated?: () => void;
}

export function UserDetailModal({ 
  user, 
  open, 
  onOpenChange, 
  currentUserId,
  onUserUpdated 
}: UserDetailModalProps) {
  const [permissions, setPermissions] = useState<Record<string, UserPermission>>({});
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserData();
    }
  }, [user, open]);

  const fetchUserData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch permissions
      const { data: permsData } = await supabase
        .from('user_permissions')
        .select('section_key, can_view, can_edit')
        .eq('user_id', user.id);

      const permMap: Record<string, UserPermission> = {};
      SECTIONS.forEach(section => {
        const perm = permsData?.find(p => p.section_key === section.key);
        permMap[section.key] = {
          section_key: section.key,
          can_view: perm?.can_view ?? true,
          can_edit: perm?.can_edit ?? true,
        };
      });
      setPermissions(permMap);

      // Fetch recent activities
      const { data: activityData } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, financial_impact')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(activityData || []);

      // Fetch stats (global counts - since data is shared)
      const [incomes, expenses, investments, decisions] = await Promise.all([
        supabase.from('income_entries').select('id', { count: 'exact', head: true }),
        supabase.from('expense_categories').select('id', { count: 'exact', head: true }),
        supabase.from('investments').select('id', { count: 'exact', head: true }),
        supabase.from('decision_vault').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalIncomes: incomes.count || 0,
        totalExpenses: expenses.count || 0,
        totalInvestments: investments.count || 0,
        totalDecisions: decisions.count || 0,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePermission = (sectionKey: string, field: 'can_view' | 'can_edit', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
        // If disabling view, also disable edit
        ...(field === 'can_view' && !value ? { can_edit: false } : {}),
      },
    }));
    setHasChanges(true);
  };

  const savePermissions = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      for (const [sectionKey, perm] of Object.entries(permissions)) {
        // Check if permission exists
        const { data: existing } = await supabase
          .from('user_permissions')
          .select('id')
          .eq('user_id', user.id)
          .eq('section_key', sectionKey)
          .single();

        if (existing) {
          await supabase
            .from('user_permissions')
            .update({ can_view: perm.can_view, can_edit: perm.can_edit })
            .eq('user_id', user.id)
            .eq('section_key', sectionKey);
        } else {
          await supabase
            .from('user_permissions')
            .insert({
              user_id: user.id,
              section_key: sectionKey,
              can_view: perm.can_view,
              can_edit: perm.can_edit,
            });
        }
      }

      // Log the action
      const permissionsJson = JSON.parse(JSON.stringify(permissions));
      await supabase.from('audit_logs').insert([{
        user_id: currentUserId,
        action: 'BULK_UPDATE_PERMISSIONS',
        table_name: 'user_permissions',
        record_id: user.id,
        new_values: permissionsJson,
      }]);

      toast.success('Permissões salvas com sucesso');
      setHasChanges(false);
      onUserUpdated?.();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{user.display_name || user.username}</p>
              <p className="text-sm text-muted-foreground font-normal">@{user.username}</p>
            </div>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="ml-auto">
              {user.role === 'admin' ? 'Admin' : 'Usuário'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="info" className="gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Permissões</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Atividade</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Estatísticas</span>
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Nome de Usuário
                  </p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Nome de Exibição
                  </p>
                  <p className="font-medium">{user.display_name || '-'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </p>
                  <p className="font-medium text-sm">{user.email}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Papel
                  </p>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </Badge>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Criado em
                  </p>
                  <p className="font-medium">
                    {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Último acesso
                  </p>
                  <p className="font-medium">
                    {user.last_sign_in 
                      ? format(new Date(user.last_sign_in), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : 'Não disponível'}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="mt-4">
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-3">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{section.label}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Ver</span>
                            <Switch
                              checked={permissions[section.key]?.can_view ?? true}
                              onCheckedChange={(checked) => updatePermission(section.key, 'can_view', checked)}
                              disabled={user.role === 'admin'}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Editar</span>
                            <Switch
                              checked={permissions[section.key]?.can_edit ?? true}
                              onCheckedChange={(checked) => updatePermission(section.key, 'can_edit', checked)}
                              disabled={user.role === 'admin' || !permissions[section.key]?.can_view}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {hasChanges && user.role !== 'admin' && (
                <div className="mt-4 flex justify-end">
                  <Button onClick={savePermissions} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Permissões
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <ScrollArea className="h-[350px]">
                {activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Badge variant="outline" className="text-xs">
                              {activity.action}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.table_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          {activity.financial_impact && (
                            <p className={`text-sm font-mono ${activity.financial_impact > 0 ? 'text-income' : 'text-expense'}`}>
                              R$ {Math.abs(activity.financial_impact).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Nenhuma atividade registrada
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-income-light rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 text-income mx-auto mb-2" />
                  <p className="text-2xl font-bold text-income">{stats?.totalIncomes || 0}</p>
                  <p className="text-sm text-income-foreground">Entradas</p>
                </div>
                <div className="p-4 bg-expense-light rounded-lg text-center">
                  <DollarSign className="h-8 w-8 text-expense mx-auto mb-2" />
                  <p className="text-2xl font-bold text-expense">{stats?.totalExpenses || 0}</p>
                  <p className="text-sm text-expense-foreground">Despesas</p>
                </div>
                <div className="p-4 bg-future-light rounded-lg text-center">
                  <TrendingUp className="h-8 w-8 text-future mx-auto mb-2" />
                  <p className="text-2xl font-bold text-future">{stats?.totalInvestments || 0}</p>
                  <p className="text-sm text-future-foreground">Investimentos</p>
                </div>
                <div className="p-4 bg-highlight-light rounded-lg text-center">
                  <FileText className="h-8 w-8 text-highlight mx-auto mb-2" />
                  <p className="text-2xl font-bold text-highlight">{stats?.totalDecisions || 0}</p>
                  <p className="text-sm text-highlight-foreground">Decisões</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
