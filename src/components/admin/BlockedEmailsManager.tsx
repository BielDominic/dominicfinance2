import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { 
  Ban, 
  Unlock, 
  Plus, 
  Loader2, 
  Mail,
  Clock,
  User,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockedEmail {
  id: string;
  email: string;
  blocked_at: string;
  blocked_by: string | null;
  reason: string | null;
  blocked_by_username?: string;
}

export function BlockedEmailsManager() {
  const [blockedEmails, setBlockedEmails] = useState<BlockedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailToUnblock, setEmailToUnblock] = useState<BlockedEmail | null>(null);

  useEffect(() => {
    fetchBlockedEmails();
  }, []);

  const fetchBlockedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_emails')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      // Enrich with blocker usernames
      const enriched: BlockedEmail[] = [];
      for (const email of data || []) {
        let username = 'Sistema';
        if (email.blocked_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', email.blocked_by)
            .single();
          username = profile?.username || 'Desconhecido';
        }
        enriched.push({ ...email, blocked_by_username: username });
      }

      setBlockedEmails(enriched);
    } catch (error) {
      console.error('Error fetching blocked emails:', error);
      toast.error('Erro ao carregar emails bloqueados');
    } finally {
      setIsLoading(false);
    }
  };

  const addBlockedEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Digite um email');
      return;
    }

    const emailLower = newEmail.toLowerCase().trim();

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      toast.error('Email inválido');
      return;
    }

    // Check if already blocked
    if (blockedEmails.some(e => e.email === emailLower)) {
      toast.error('Este email já está bloqueado');
      return;
    }

    setIsAdding(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('blocked_emails')
        .insert({
          email: emailLower,
          reason: newReason.trim() || null,
          blocked_by: session?.session?.user?.id || null,
        });

      if (error) throw error;

      toast.success(`Email ${emailLower} bloqueado`);
      setNewEmail('');
      setNewReason('');
      fetchBlockedEmails();
    } catch (error) {
      console.error('Error blocking email:', error);
      toast.error('Erro ao bloquear email');
    } finally {
      setIsAdding(false);
    }
  };

  const unblockEmail = async () => {
    if (!emailToUnblock) return;

    try {
      const { error } = await supabase
        .from('blocked_emails')
        .delete()
        .eq('id', emailToUnblock.id);

      if (error) throw error;

      toast.success(`Email ${emailToUnblock.email} desbloqueado`);
      setEmailToUnblock(null);
      fetchBlockedEmails();
    } catch (error) {
      console.error('Error unblocking email:', error);
      toast.error('Erro ao desbloquear email');
    }
  };

  const filteredEmails = blockedEmails.filter(e =>
    e.email.includes(searchQuery.toLowerCase()) ||
    e.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Emails Bloqueados
          </CardTitle>
          <CardDescription>
            Gerencie emails que não podem criar novas contas ({blockedEmails.length} bloqueados)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Email */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="email@exemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Input
              placeholder="Motivo (opcional)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Button onClick={addBlockedEmail} disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Bloquear
                </>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Blocked Emails List */}
          <ScrollArea className="h-[300px]">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'Nenhum email encontrado' : 'Nenhum email bloqueado'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{email.email}</span>
                        <Badge variant="destructive" className="text-xs flex-shrink-0">
                          Bloqueado
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(email.blocked_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.blocked_by_username}
                        </span>
                      </div>
                      {email.reason && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          Motivo: {email.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmailToUnblock(email)}
                      className="text-primary hover:text-primary flex-shrink-0"
                    >
                      <Unlock className="h-4 w-4 mr-1" />
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!emailToUnblock}
        onOpenChange={(open) => !open && setEmailToUnblock(null)}
        title="Desbloquear Email"
        description={`Tem certeza que deseja desbloquear o email "${emailToUnblock?.email}"? Este email poderá ser usado para criar novas contas.`}
        confirmText="Desbloquear"
        cancelText="Cancelar"
        onConfirm={unblockEmail}
      />
    </>
  );
}
