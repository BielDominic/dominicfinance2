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
  const deleteUser = async (userToRemove: UserWithProfile) => {
    try {
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
        action: 'DELETE_USER',
        table_name: 'profiles',
        record_id: userToRemove.id,
        old_values: { username: userToRemove.username, display_name: userToRemove.display_name },
        new_values: null,
      }]);

      toast.success(`Usuário ${userToRemove.username} removido com sucesso`);
      setUserToDelete(null);
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie usuários, permissões e configurações
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              fetchUsers();
              fetchAuditLogs();
              toast.success('Dados atualizados');
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Auditoria</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>
                  Visualize, edite e remova usuários do sistema. Clique em "Ver" para mais detalhes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
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
                              {/* View user details */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUserToView(u)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </Button>
                              
                              {/* Toggle admin */}
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
                              
                              {/* Delete user - cannot delete self */}
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
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>
                  Histórico completo de ações no sistema
                </CardDescription>
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
        onOpenChange={(open) => !open && setUserToDelete(null)}
        title="Remover Usuário"
        description={`Tem certeza que deseja remover o usuário "${userToDelete?.display_name || userToDelete?.username}"? Esta ação não pode ser desfeita e removerá todas as permissões associadas.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => userToDelete && deleteUser(userToDelete)}
      />
    </div>
  );
}
