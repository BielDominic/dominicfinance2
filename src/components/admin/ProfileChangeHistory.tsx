import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { History, Loader2, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChangeRecord {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: string;
  changed_by_username?: string;
}

interface ProfileChangeHistoryProps {
  profileId: string;
}

const FIELD_LABELS: Record<string, string> = {
  display_name: 'Nome de Exibição',
  full_name: 'Nome Completo',
  phone: 'Telefone',
  city: 'Cidade',
  username: 'Usuário',
  email: 'Email',
};

export function ProfileChangeHistory({ profileId }: ProfileChangeHistoryProps) {
  const [history, setHistory] = useState<ChangeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_change_history')
          .select('*')
          .eq('profile_id', profileId)
          .order('changed_at', { ascending: false });

        if (error) throw error;

        // Enrich with usernames
        const enriched: ChangeRecord[] = [];
        for (const record of data || []) {
          let username = 'Sistema';
          if (record.changed_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('user_id', record.changed_by)
              .single();
            username = profile?.username || 'Desconhecido';
          }
          enriched.push({ ...record, changed_by_username: username });
        }

        setHistory(enriched);
      } catch (error) {
        console.error('Error fetching profile history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      fetchHistory();
    }
  }, [profileId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico de Alterações
        </CardTitle>
        <CardDescription className="text-xs">
          Todas as mudanças realizadas neste perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma alteração registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {FIELD_LABELS[record.field_name] || record.field_name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(record.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground line-through truncate max-w-[120px]">
                      {record.old_value || '(vazio)'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate max-w-[120px]">
                      {record.new_value || '(vazio)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Por: {record.changed_by_username}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
