import { useState, useEffect } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronUp, Calendar, Tag, DollarSign, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Decision {
  id: string;
  title: string;
  description: string | null;
  decision_date: string;
  financial_impact: number | null;
  tags: string[] | null;
  created_at: string;
  created_by: string | null;
}

export function DecisionVault() {
  const { user, isAdmin, hasPermission } = useAuth();
  const canEdit = hasPermission('decisoes', 'edit') || isAdmin;
  
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchDecisions();

    const channel = supabase
      .channel('decisions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decision_vault' }, () => {
        fetchDecisions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDecisions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('decision_vault')
      .select('*')
      .order('decision_date', { ascending: false });

    if (error) {
      console.error('Error fetching decisions:', error);
    } else {
      setDecisions(data || []);
    }
    setIsLoading(false);
  };

  const createDecision = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('decision_vault').insert({
      title: title.trim(),
      description: description.trim() || null,
      financial_impact: impact ? parseFloat(impact) : null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      created_by: user?.id,
    });

    if (error) {
      toast.error('Erro ao salvar decisão');
      console.error(error);
    } else {
      toast.success('Decisão registrada!');
      setTitle('');
      setDescription('');
      setImpact('');
      setTags('');
      setIsAdding(false);
      fetchDecisions();
    }
    setIsSaving(false);
  };

  const deleteDecision = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('decision_vault').delete().eq('id', deleteId);

    if (error) {
      toast.error('Erro ao excluir decisão');
    } else {
      toast.success('Decisão excluída');
      fetchDecisions();
    }
    setDeleteId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Cofre de Decisões
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{decisions.length} registros</Badge>
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Add Decision Form */}
            {canEdit && (
              <div className="space-y-3">
                {!isAdding ? (
                  <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Nova Decisão
                  </Button>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <Input
                      placeholder="Título da decisão *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Descrição e motivos..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Impacto financeiro (R$)"
                        value={impact}
                        onChange={(e) => setImpact(e.target.value)}
                      />
                      <Input
                        placeholder="Tags (separadas por vírgula)"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createDecision} disabled={isSaving} className="flex-1">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsAdding(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Decisions List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : decisions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma decisão registrada</p>
                <p className="text-sm">Registre decisões importantes para revisitar depois</p>
              </div>
            ) : (
              <div className="space-y-3">
                {decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{decision.title}</h4>
                          {decision.financial_impact && (
                            <Badge variant={decision.financial_impact >= 0 ? 'default' : 'destructive'}>
                              <DollarSign className="h-3 w-3 mr-1" />
                              {formatCurrency(Math.abs(decision.financial_impact))}
                            </Badge>
                          )}
                        </div>
                        
                        {decision.description && (
                          <p className="text-sm text-muted-foreground">{decision.description}</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(decision.decision_date)}
                          </span>
                          {decision.tags && decision.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {decision.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(decision.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Decisão"
        description="Tem certeza que deseja excluir esta decisão? Esta ação não pode ser desfeita."
        onConfirm={deleteDecision}
      />
    </>
  );
}
