import { useState, useEffect } from 'react';
import { Camera, History, ChevronDown, ChevronUp, Calendar, TrendingUp, TrendingDown, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { FinancialSummary } from '@/types/financial';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface FinancialSnapshot {
  id: string;
  snapshot_date: string;
  snapshot_type: string;
  data: any;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface FinancialSnapshotsProps {
  summary: FinancialSummary;
  incomeEntries: any[];
  expenseCategories: any[];
  investments: any[];
}

export function FinancialSnapshots({ summary, incomeEntries, expenseCategories, investments }: FinancialSnapshotsProps) {
  const { isAdmin } = useAuth();
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<FinancialSnapshot | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshots();

    const channel = supabase
      .channel('snapshots_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_snapshots' }, () => {
        fetchSnapshots();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSnapshots = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('financial_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error fetching snapshots:', error);
    } else {
      setSnapshots(data || []);
    }
    setIsLoading(false);
  };

  const createSnapshot = async () => {
    setIsSaving(true);
    const snapshotData = {
      summary: JSON.parse(JSON.stringify(summary)),
      incomeEntries: incomeEntries.map(e => ({ id: e.id, valor: e.valor, descricao: e.descricao, status: e.status, pessoa: e.pessoa })),
      expenseCategories: expenseCategories.map(c => ({ id: c.id, categoria: c.categoria, total: c.total, pago: c.pago })),
      investments: investments.map(i => ({ id: i.id, categoria: i.categoria, valor: i.valor })),
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from('financial_snapshots').insert([{
      snapshot_date: new Date().toISOString().split('T')[0],
      snapshot_type: 'manual',
      data: snapshotData as any,
      notes: notes || null,
    }]);

    if (error) {
      toast.error('Erro ao criar snapshot');
      console.error(error);
    } else {
      toast.success('Snapshot criado com sucesso!');
      setNotes('');
      fetchSnapshots();
    }
    setIsSaving(false);
  };

  const deleteSnapshot = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('financial_snapshots').delete().eq('id', deleteId);

    if (error) {
      toast.error('Erro ao excluir snapshot');
    } else {
      toast.success('Snapshot excluído');
      if (selectedSnapshot?.id === deleteId) {
        setSelectedSnapshot(null);
      }
      fetchSnapshots();
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

  const compareWithCurrent = (snapshot: FinancialSnapshot) => {
    const snapshotSummary = snapshot.data?.summary;
    if (!snapshotSummary) return null;

    return {
      entradas: summary.totalEntradas - (snapshotSummary.totalEntradas || 0),
      saidas: summary.totalSaidas - (snapshotSummary.totalSaidas || 0),
      saldo: summary.saldoFinalPrevisto - (snapshotSummary.saldoFinalPrevisto || 0),
    };
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Snapshots Financeiros
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{snapshots.length} salvos</Badge>
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Create Snapshot Section */}
            {isAdmin && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Criar Snapshot do Estado Atual
                </h4>
                <Textarea
                  placeholder="Notas sobre este snapshot (opcional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
                <Button onClick={createSnapshot} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Salvar Snapshot Agora
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Snapshots List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum snapshot salvo ainda</p>
                <p className="text-sm">Crie snapshots para acompanhar a evolução financeira</p>
              </div>
            ) : (
              <div className="space-y-3">
                {snapshots.map((snapshot) => {
                  const comparison = compareWithCurrent(snapshot);
                  const isSelected = selectedSnapshot?.id === snapshot.id;

                  return (
                    <div
                      key={snapshot.id}
                      className={cn(
                        'border rounded-lg p-4 transition-colors',
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => setSelectedSnapshot(isSelected ? null : snapshot)}
                        >
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{formatDate(snapshot.snapshot_date)}</p>
                            <p className="text-xs text-muted-foreground">
                              {snapshot.snapshot_type === 'monthly' ? 'Automático' : 'Manual'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {comparison && (
                            <div className={cn(
                              'flex items-center gap-1 text-sm',
                              comparison.saldo >= 0 ? 'text-income' : 'text-expense'
                            )}>
                              {comparison.saldo >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>{formatCurrency(Math.abs(comparison.saldo))}</span>
                            </div>
                          )}
                          
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(snapshot.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isSelected && snapshot.data?.summary && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Entradas</p>
                            <p className="font-mono font-semibold text-income">
                              {formatCurrency(snapshot.data.summary.totalEntradas || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Saídas</p>
                            <p className="font-mono font-semibold text-expense">
                              {formatCurrency(snapshot.data.summary.totalSaidas || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Saldo</p>
                            <p className="font-mono font-semibold">
                              {formatCurrency(snapshot.data.summary.saldoFinalPrevisto || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Investimentos</p>
                            <p className="font-mono font-semibold text-primary">
                              {snapshot.data.investments?.length || 0} itens
                            </p>
                          </div>
                          {snapshot.notes && (
                            <div className="col-span-full">
                              <p className="text-muted-foreground">Notas</p>
                              <p className="text-sm">{snapshot.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Snapshot"
        description="Tem certeza que deseja excluir este snapshot? Esta ação não pode ser desfeita."
        onConfirm={deleteSnapshot}
      />
    </>
  );
}
