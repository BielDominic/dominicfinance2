import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Trash2,
  Hash,
  Database,
  Key,
  Globe,
  Phone,
  MapPin,
  UserCircle,
  Lock,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface UserWithProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_sign_in: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
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
  old_values: any;
  new_values: any;
  record_id: string | null;
}

interface UserStats {
  totalIncomes: number;
  totalExpenses: number;
  totalInvestments: number;
  totalDecisions: number;
  totalActions: number;
  totalFinancialImpact: number;
  lastActivity: string | null;
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
  const [showDeleteLogsConfirm, setShowDeleteLogsConfirm] = useState(false);
  const [isDeletingLogs, setIsDeletingLogs] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

      // Fetch ALL activities for this user (with more details)
      const { data: activityData } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at, financial_impact, old_values, new_values, record_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setActivities(activityData || []);

      // Fetch comprehensive stats
      const [incomes, expenses, investments, decisions, userActions] = await Promise.all([
        supabase.from('income_entries').select('id', { count: 'exact', head: true }),
        supabase.from('expense_categories').select('id', { count: 'exact', head: true }),
        supabase.from('investments').select('id', { count: 'exact', head: true }),
        supabase.from('decision_vault').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('id, financial_impact, created_at').eq('user_id', user.id),
      ]);

      const totalFinancialImpact = (userActions.data || []).reduce((sum, log) => 
        sum + (log.financial_impact || 0), 0);
      
      const sortedActions = (userActions.data || []).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setStats({
        totalIncomes: incomes.count || 0,
        totalExpenses: expenses.count || 0,
        totalInvestments: investments.count || 0,
        totalDecisions: decisions.count || 0,
        totalActions: userActions.data?.length || 0,
        totalFinancialImpact,
        lastActivity: sortedActions[0]?.created_at || null,
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

  const deleteUserLogs = async () => {
    if (!user) return;
    setIsDeletingLogs(true);

    try {
      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Log this deletion
      await supabase.from('audit_logs').insert([{
        user_id: currentUserId,
        action: 'DELETE_USER_LOGS',
        table_name: 'audit_logs',
        record_id: user.id,
        old_values: { count: activities.length },
        new_values: null,
      }]);

      setActivities([]);
      toast.success(`${activities.length} logs removidos`);
      setShowDeleteLogsConfirm(false);
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Erro ao remover logs');
    } finally {
      setIsDeletingLogs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    
    if (!newPassword) {
      toast.error('Digite a nova senha');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-password', {
        body: {
          targetUserId: user.id,
          newPassword: newPassword,
        },
      });
      
      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast.success('Senha alterada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-xl font-bold truncate">{user.display_name || user.username}</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal truncate">@{user.username}</p>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="ml-auto text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 flex-shrink-0">
                {user.role === 'admin' ? '👑' : '👤'}<span className="hidden sm:inline ml-1">{user.role === 'admin' ? 'Admin' : 'Usuário'}</span>
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="info" className="mt-3 sm:mt-4">
              <TabsList className="grid grid-cols-4 w-full h-8 sm:h-10">
                <TabsTrigger value="info" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Permissões</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Atividade</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-1 text-xs sm:text-sm px-1 sm:px-3">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Tab - EXPANDED */}
              <TabsContent value="info" className="mt-3 sm:mt-4">
                <ScrollArea className="h-[350px] sm:h-[400px] pr-2 sm:pr-4">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Usuário
                          </p>
                          <p className="font-semibold text-xs sm:text-base truncate">{user.username}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Exibição
                          </p>
                          <p className="font-semibold text-xs sm:text-base truncate">{user.display_name || '—'}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Personal Info */}
                    <Card className="border-muted">
                      <CardContent className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                          <UserCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Nome Completo
                        </p>
                        <p className="font-semibold text-xs sm:text-base">{user.full_name || '—'}</p>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                            <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Telefone
                          </p>
                          <p className="font-semibold text-xs sm:text-base truncate">{user.phone || '—'}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 sm:gap-2">
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Cidade
                          </p>
                          <p className="font-semibold text-xs sm:text-base truncate">{user.city || '—'}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" /> Email
                          </p>
                          <p className="font-semibold text-sm break-all">{user.email}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Shield className="h-3 w-3" /> Papel no Sistema
                          </p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Technical Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Hash className="h-3 w-3" /> ID do Usuário
                          </p>
                          <p className="font-mono text-xs text-muted-foreground break-all">{user.id}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Key className="h-3 w-3" /> Autenticação
                          </p>
                          <p className="font-semibold text-sm">Email/Senha</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Conta Criada em
                          </p>
                          <p className="font-semibold">
                            {format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.created_at), "HH:mm:ss", { locale: ptBR })}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Último Acesso
                          </p>
                          <p className="font-semibold">
                            {user.last_sign_in 
                              ? format(new Date(user.last_sign_in), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                              : 'Não disponível'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Activity Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Total de Ações
                          </p>
                          <p className="font-semibold text-2xl">{stats?.totalActions || 0}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-muted">
                        <CardContent className="p-4 space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-3 w-3" /> Impacto Financeiro
                          </p>
                          <p className={`font-semibold text-lg ${(stats?.totalFinancialImpact || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                            R$ {Math.abs(stats?.totalFinancialImpact || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Last Activity */}
                    <Card className="border-muted">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Globe className="h-3 w-3" /> Última Atividade Registrada
                        </p>
                        <p className="font-semibold">
                          {stats?.lastActivity 
                            ? format(new Date(stats.lastActivity), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })
                            : 'Nenhuma atividade registrada'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Password Change Section */}
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4 space-y-4">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4" /> Alterar Senha do Usuário
                        </p>
                        
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="new-password" className="text-xs">Nova Senha</Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nova senha (mín. 6 caracteres)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="confirm-password" className="text-xs">Confirmar Senha</Label>
                            <Input
                              id="confirm-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Confirme a nova senha"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                          </div>
                          
                          <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword || !newPassword || !confirmPassword}
                            className="w-full"
                            size="sm"
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Alterando...
                              </>
                            ) : (
                              <>
                                <Key className="mr-2 h-4 w-4" />
                                Alterar Senha
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
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

              {/* Activity Tab - WITH DELETE BUTTON */}
              <TabsContent value="activity" className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">
                    {activities.length} registros de atividade
                  </p>
                  {activities.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteLogsConfirm(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar Logs
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[350px]">
                  {activities.length > 0 ? (
                    <div className="space-y-2">
                      {activities.map((activity) => (
                        <div key={activity.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.action}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {activity.table_name}
                                  {activity.record_id && (
                                    <span className="ml-1 font-mono text-[10px]">
                                      ({activity.record_id.slice(0, 8)}...)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                              </p>
                              {activity.financial_impact && (
                                <p className={`text-sm font-mono ${activity.financial_impact > 0 ? 'text-income' : 'text-expense'}`}>
                                  R$ {Math.abs(activity.financial_impact).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Show old/new values if present */}
                          {(activity.old_values || activity.new_values) && (
                            <div className="text-xs p-2 bg-background/50 rounded border border-border/50">
                              {activity.old_values && (
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-expense">Antes:</span>{' '}
                                  <code className="break-all">{JSON.stringify(activity.old_values)}</code>
                                </div>
                              )}
                              {activity.new_values && (
                                <div className="text-muted-foreground mt-1">
                                  <span className="font-medium text-income">Depois:</span>{' '}
                                  <code className="break-all">{JSON.stringify(activity.new_values)}</code>
                                </div>
                              )}
                            </div>
                          )}
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
                    <p className="text-sm text-income-foreground">Entradas no Sistema</p>
                  </div>
                  <div className="p-4 bg-expense-light rounded-lg text-center">
                    <DollarSign className="h-8 w-8 text-expense mx-auto mb-2" />
                    <p className="text-2xl font-bold text-expense">{stats?.totalExpenses || 0}</p>
                    <p className="text-sm text-expense-foreground">Despesas no Sistema</p>
                  </div>
                  <div className="p-4 bg-future-light rounded-lg text-center">
                    <Database className="h-8 w-8 text-future mx-auto mb-2" />
                    <p className="text-2xl font-bold text-future">{stats?.totalInvestments || 0}</p>
                    <p className="text-sm text-future-foreground">Investimentos</p>
                  </div>
                  <div className="p-4 bg-highlight-light rounded-lg text-center">
                    <FileText className="h-8 w-8 text-highlight mx-auto mb-2" />
                    <p className="text-2xl font-bold text-highlight">{stats?.totalDecisions || 0}</p>
                    <p className="text-sm text-highlight-foreground">Decisões Registradas</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{stats?.totalActions || 0}</p>
                      <p className="text-sm text-muted-foreground">Ações do Usuário</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className={`text-2xl font-bold ${(stats?.totalFinancialImpact || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                        R$ {Math.abs(stats?.totalFinancialImpact || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">Impacto Financeiro Total</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Logs Confirmation */}
      <ConfirmDialog
        open={showDeleteLogsConfirm}
        onOpenChange={setShowDeleteLogsConfirm}
        title="Limpar Logs de Atividade"
        description={`Tem certeza que deseja remover todos os ${activities.length} logs de atividade deste usuário? Esta ação não pode ser desfeita.`}
        confirmText={isDeletingLogs ? 'Removendo...' : 'Limpar Logs'}
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={deleteUserLogs}
      />
    </>
  );
}
