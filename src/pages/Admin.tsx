import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AdminPasswordGate } from '@/components/AdminPasswordGate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { AdminSettings } from '@/components/admin/AdminSettings';
import {
  Users,
  Settings,
  Shield,
  Activity,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: string;
  created_at: string;
  last_sign_in: string | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  financial_impact: number | null;
  created_at: string;
  username?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserWithProfile | null>(null);
  const [userToView, setUserToView] = useState<UserWithProfile | null>(null);
  const [showDeleteAllLogsConfirm, setShowDeleteAllLogsConfirm] = useState(false);
  const [blockEmail, setBlockEmail] = useState(false);

  // Check if already verified in this session
  useEffect(() => {
    const verified = sessionStorage.getItem('admin-panel-auth');
    if (verified === 'true') {
      setIsPasswordVerified(true);
    }
  }, []);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch users with profiles and roles
  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles: UserWithProfile[] = [];

      for (const profile of profiles || []) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.user_id)
          .single();

        usersWithRoles.push({
          id: profile.user_id,
          email: profile.email || `${profile.username}@dominic.app`,
          username: profile.username,
          display_name: profile.display_name,
          role: roleData?.role || 'user',
          created_at: profile.created_at,
          last_sign_in: null,
          full_name: (profile as any).full_name || null,
          phone: (profile as any).phone || null,
          city: (profile as any).city || null,
        });
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Enrich with usernames
      const logsWithUsernames: AuditLog[] = [];
      for (const log of data || []) {
        let username = 'Sistema';
        if (log.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', log.user_id)
            .single();
          username = profile?.username || 'Desconhecido';
        }
        logsWithUsernames.push({ ...log, username });
      }

      setAuditLogs(logsWithUsernames);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  // Toggle user role (admin/user)
  const toggleUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        action: 'UPDATE_ROLE',
        table_name: 'user_roles',
        record_id: userId,
        old_values: { role: newRole === 'admin' ? 'user' : 'admin' },
        new_values: { role: newRole },
      }]);

      toast.success(`Usuário ${newRole === 'admin' ? 'promovido a admin' : 'rebaixado para usuário'}`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Erro ao alterar papel do usuário');
    }
  };

  // Delete user (profile, role, permissions)
  const deleteUser = async (userToRemove: UserWithProfile, shouldBlockEmail: boolean = false) => {
    try {
      // Block email if requested
      if (shouldBlockEmail && userToRemove.email) {
        const { error: blockError } = await supabase
          .from('blocked_emails')
          .insert({
            email: userToRemove.email.toLowerCase(),
            blocked_by: user?.id,
            reason: `Blocked when user ${userToRemove.username} was deleted`,
          });
        
        if (blockError && !blockError.message.includes('duplicate')) {
          console.error('Error blocking email:', blockError);
        }
      }

      // Delete user onboarding
      await supabase
        .from('user_onboarding')
        .delete()
        .eq('user_id', userToRemove.id);

      // Delete user counter config
      await supabase
        .from('user_counter_config')
        .delete()
        .eq('user_id', userToRemove.id);

      // Delete user permissions
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userToRemove.id);

      // Delete user role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToRemove.id);

      // Delete user profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userToRemove.id);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        action: shouldBlockEmail ? 'DELETE_USER_AND_BLOCK' : 'DELETE_USER',
        table_name: 'profiles',
        record_id: userToRemove.id,
        old_values: { username: userToRemove.username, display_name: userToRemove.display_name, email: userToRemove.email },
        new_values: shouldBlockEmail ? { email_blocked: true } : null,
      }]);

      toast.success(
        shouldBlockEmail 
          ? `Usuário ${userToRemove.username} removido e email bloqueado` 
          : `Usuário ${userToRemove.username} removido com sucesso`
      );
      setUserToDelete(null);
      setBlockEmail(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAdmin && isPasswordVerified) {
      Promise.all([fetchUsers(), fetchAuditLogs()]).then(() => setIsLoading(false));
    }
  }, [isAdmin, isPasswordVerified]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Show password gate if not verified
  if (!isPasswordVerified) {
    return <AdminPasswordGate onSuccess={() => setIsPasswordVerified(true)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold flex items-center gap-1.5 sm:gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="truncate">Painel Admin</span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
                  Gerencie usuários, permissões e configurações
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              fetchUsers();
              fetchAuditLogs();
              toast.success('Dados atualizados');
            }} className="h-8 px-2 sm:px-3 flex-shrink-0">
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Config</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Auditoria</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Gestão de Usuários</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Visualize, edite e remova usuários. Clique em "Ver" para detalhes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  {/* Mobile Cards View */}
                  <div className="sm:hidden space-y-3">
                    {users.map((u) => (
                      <div key={u.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{u.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.display_name || '-'}</p>
                          </div>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserToView(u)}
                            className="h-7 text-xs gap-1 flex-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                          {u.role !== 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserRole(u.id, 'admin')}
                              className="h-7 text-xs gap-1"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          ) : u.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserRole(u.id, 'user')}
                              className="h-7 text-xs text-muted-foreground"
                            >
                              -Admin
                            </Button>
                          )}
                          {u.id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToDelete(u)}
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Nenhum usuário encontrado
                      </p>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>{u.display_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(u.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserToView(u)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </Button>
                              {u.role !== 'admin' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserRole(u.id, 'admin')}
                                  className="text-xs"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Tornar Admin
                                </Button>
                              ) : u.id !== user?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserRole(u.id, 'user')}
                                  className="text-xs text-muted-foreground"
                                >
                                  Remover Admin
                                </Button>
                              )}
                              {u.id !== user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setUserToDelete(u)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Remover usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Logs de Auditoria</CardTitle>
                    <CardDescription>
                      Histórico completo de ações no sistema ({auditLogs.length} registros)
                    </CardDescription>
                  </div>
                  {auditLogs.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowDeleteAllLogsConfirm(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar Todos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Impacto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{log.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.table_name}
                          </TableCell>
                          <TableCell>
                            {log.financial_impact ? (
                              <span className={log.financial_impact > 0 ? 'text-income' : 'text-expense'}>
                                R$ {log.financial_impact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {auditLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum log de auditoria encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Detail Modal */}
      <UserDetailModal
        user={userToView}
        open={!!userToView}
        onOpenChange={(open) => !open && setUserToView(null)}
        currentUserId={user?.id}
        onUserUpdated={fetchUsers}
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
            setBlockEmail(false);
          }
        }}
        title="Remover Usuário"
        description={
          <div className="space-y-4">
            <p>
              Tem certeza que deseja remover o usuário "{userToDelete?.display_name || userToDelete?.username}"? 
              Esta ação não pode ser desfeita e removerá todas as permissões associadas.
            </p>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <input
                type="checkbox"
                id="block-email"
                checked={blockEmail}
                onChange={(e) => setBlockEmail(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="block-email" className="text-sm font-medium cursor-pointer">
                🚫 Bloquear email ({userToDelete?.email}) - impede novo cadastro
              </label>
            </div>
          </div>
        }
        confirmText={blockEmail ? "Remover e Bloquear" : "Remover"}
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => userToDelete && deleteUser(userToDelete, blockEmail)}
      />

      {/* Delete All Logs Confirmation */}
      <ConfirmDialog
        open={showDeleteAllLogsConfirm}
        onOpenChange={setShowDeleteAllLogsConfirm}
        title="Limpar Todos os Logs"
        description={`Tem certeza que deseja remover todos os ${auditLogs.length} logs de auditoria? Esta ação não pode ser desfeita.`}
        confirmText="Limpar Todos"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={async () => {
          try {
            await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            toast.success('Todos os logs foram removidos');
            setShowDeleteAllLogsConfirm(false);
            fetchAuditLogs();
          } catch (error) {
            toast.error('Erro ao remover logs');
          }
        }}
      />
    </div>
  );
}
