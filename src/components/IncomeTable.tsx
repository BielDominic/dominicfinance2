import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowUpDown, Plus, CalendarDays, Sparkles, Trash2, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import { IncomeEntry, EntryStatus, Currency } from '@/types/financial';
import { formatCurrency, formatDate, parseCurrencyInput, parseDateInput } from '@/utils/formatters';
import { EditableCell } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { PersonBadge } from './PersonBadge';
import { PersonFilterSelect } from './PersonFilterSelect';
import { CurrencySelect, formatCurrencyWithSymbol } from './CurrencySelect';
import { SectionCurrencyFilter, SectionCurrency, convertCurrency, formatWithCurrency } from './SectionCurrencyFilter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeriodFilter, PeriodFilterValue, filterByPeriod } from '@/components/PeriodFilter';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface IncomeTableProps {
  entries: IncomeEntry[];
  onUpdateEntry: (id: string, updates: Partial<IncomeEntry>) => void;
  onAddEntry: (status: 'Entrada' | 'Futuros') => void;
  onDeleteEntry: (id: string) => void;
}

type SortField = 'data' | 'valor' | 'pessoa';
type SortDirection = 'asc' | 'desc';

export function IncomeTable({ entries, onUpdateEntry, onAddEntry, onDeleteEntry }: IncomeTableProps) {
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeTab, setActiveTab] = useState<'Entrada' | 'Futuros'>('Entrada');
  const [isExpanded, setIsExpanded] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({ type: 'all' });
  const [displayCurrency, setDisplayCurrency] = useState<SectionCurrency>('original');
  
  // Track pending (unconfirmed) entries
  const [pendingEntries, setPendingEntries] = useState<Set<string>>(new Set());
  
  // Confirmation dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; descricao: string }>({ open: false, id: '', descricao: '' });
  const [addConfirm, setAddConfirm] = useState<{ open: boolean; id: string; entry: IncomeEntry | null }>({ open: false, id: '', entry: null });
  
  // Track previous entries to detect newly completed ones
  const prevEntriesRef = useRef<Map<string, IncomeEntry>>(new Map());

  // Check if an entry is complete (has valor > 0, descricao, and data)
  const isEntryComplete = (entry: IncomeEntry) => {
    return entry.valor > 0 && entry.descricao && entry.descricao.trim() !== '' && entry.data;
  };

  // Monitor pending entries for completion
  useEffect(() => {
    const prevEntries = prevEntriesRef.current;
    
    entries.forEach(entry => {
      const prev = prevEntries.get(entry.id);
      const isPending = pendingEntries.has(entry.id);
      
      // If entry is pending and now complete, show confirmation
      if (isPending && isEntryComplete(entry)) {
        setAddConfirm({ open: true, id: entry.id, entry });
      }
    });
    
    // Update previous entries reference
    const newMap = new Map<string, IncomeEntry>();
    entries.forEach(e => newMap.set(e.id, { ...e }));
    prevEntriesRef.current = newMap;
  }, [entries, pendingEntries]);

  // Filter entries by period first
  const periodFilteredEntries = useMemo(() => 
    filterByPeriod(entries, periodFilter), 
    [entries, periodFilter]
  );

  const getFilteredAndSortedEntries = (status: 'Entrada' | 'Futuros') => {
    let result = periodFilteredEntries.filter(e => e.status === status);

    // Filter by person - also include entries marked as "Ambos" when filtering by a specific person
    if (filterPerson !== 'all') {
      result = result.filter(e => e.pessoa === filterPerson || e.pessoa === 'Ambos');
    }

    // Separate pending/new entries (in pendingEntries set OR empty) to show at top
    const newEntries = result.filter(e => pendingEntries.has(e.id) || (e.valor === 0 && !e.descricao));
    const existingEntries = result.filter(e => !pendingEntries.has(e.id) && (e.valor !== 0 || e.descricao));

    // Sort existing entries
    existingEntries.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'data':
          const dateA = a.data || '9999-12-31';
          const dateB = b.data || '9999-12-31';
          comparison = dateA.localeCompare(dateB);
          break;
        case 'valor':
          comparison = a.valor - b.valor;
          break;
        case 'pessoa':
          comparison = a.pessoa.localeCompare(b.pessoa);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Return with new entries at the top
    return [...newEntries, ...existingEntries];
  };

  const entradasEntries = useMemo(() => getFilteredAndSortedEntries('Entrada'), [entries, filterPerson, sortField, sortDirection, periodFilter, pendingEntries]);
  const futurosEntries = useMemo(() => getFilteredAndSortedEntries('Futuros'), [entries, filterPerson, sortField, sortDirection, periodFilter, pendingEntries]);

  const totalEntradas = useMemo(() => entradasEntries.reduce((sum, e) => sum + e.valor, 0), [entradasEntries]);
  const totalFuturos = useMemo(() => futurosEntries.reduce((sum, e) => sum + e.valor, 0), [futurosEntries]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddNewEntry = (status: 'Entrada' | 'Futuros') => {
    // Create a temporary ID to track the new entry
    const tempId = `temp-${Date.now()}`;
    onAddEntry(status);
    
    // Find the newly added entry (it will be the one with valor=0 and empty descricao)
    setTimeout(() => {
      const newEntry = entries.find(e => e.valor === 0 && !e.descricao && e.status === status);
      if (newEntry) {
        setPendingEntries(prev => new Set(prev).add(newEntry.id));
      }
    }, 100);
  };

  // When entries change, check if there's a new empty entry to track
  useEffect(() => {
    entries.forEach(entry => {
      if (entry.valor === 0 && !entry.descricao && !pendingEntries.has(entry.id)) {
        // This might be a new entry - add it to pending
        const isNew = !prevEntriesRef.current.has(entry.id);
        if (isNew) {
          setPendingEntries(prev => new Set(prev).add(entry.id));
        }
      }
    });
  }, [entries]);

  const handleValueChange = (id: string, newValue: string) => {
    const parsed = parseCurrencyInput(newValue);
    onUpdateEntry(id, { valor: parsed });
  };

  const handleDateChange = (id: string, newValue: string) => {
    const parsed = parseDateInput(newValue);
    onUpdateEntry(id, { data: parsed });
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    // When checked, move from Futuros to Entrada
    if (checked) {
      onUpdateEntry(id, { status: 'Entrada' });
    }
  };

  const confirmEntry = (id: string) => {
    setPendingEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast({
      title: "Entrada confirmada! ✓",
      description: "O registro foi adicionado com sucesso.",
    });
  };

  const cancelEntry = (id: string) => {
    setPendingEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    onDeleteEntry(id);
    toast({
      title: "Entrada cancelada",
      description: "O registro foi removido.",
    });
  };

  // Mobile card view for each entry
  const renderMobileCard = (entry: IncomeEntry, status: 'Entrada' | 'Futuros') => {
    const showCheckbox = status === 'Futuros';
    
    return (
      <div 
        key={entry.id}
        className="p-4 border-b border-border/50 last:border-b-0 bg-card"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {showCheckbox && (
              <Checkbox
                checked={false}
                onCheckedChange={(checked) => handleCheckboxChange(entry.id, checked as boolean)}
                className="data-[state=checked]:bg-income data-[state=checked]:border-income"
              />
            )}
            <div className={cn(
              'font-mono font-medium rounded px-2 py-1 flex items-center gap-1',
              'bg-highlight-light text-highlight-foreground'
            )}>
              <CurrencySelect
                value={entry.moeda || 'BRL'}
                onChange={(moeda) => onUpdateEntry(entry.id, { moeda })}
                compact
              />
              <EditableCell
                value={formatCurrencyWithSymbol(entry.valor, entry.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
                onChange={(v) => handleValueChange(entry.id, v)}
                type="currency"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense/10 shrink-0"
            onClick={() => setDeleteConfirm({ open: true, id: entry.id, descricao: entry.descricao || 'este registro' })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-3">
          <EditableCell
            value={entry.descricao}
            onChange={(v) => onUpdateEntry(entry.id, { descricao: v })}
            placeholder="Descrição..."
            className="text-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="font-mono text-muted-foreground">
            <EditableCell
              value={formatDate(entry.data)}
              onChange={(v) => handleDateChange(entry.id, v)}
              type="date"
              placeholder="—"
            />
          </div>
          <PersonBadge 
            person={entry.pessoa} 
            editable 
            onChange={(pessoa: string) => onUpdateEntry(entry.id, { pessoa })}
          />
          <StatusBadge 
            status={entry.status} 
            editable
            onChange={(newStatus) => onUpdateEntry(entry.id, { status: newStatus })}
          />
        </div>
      </div>
    );
  };

  const renderTable = (tableEntries: IncomeEntry[], status: 'Entrada' | 'Futuros') => {
    const total = status === 'Entrada' ? totalEntradas : totalFuturos;
    const showCheckbox = status === 'Futuros';

    return (
      <>
        {/* Mobile View */}
        <div className="md:hidden">
          {tableEntries.map((entry) => renderMobileCard(entry, status))}
          {tableEntries.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum registro encontrado
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {showCheckbox && <th className="p-3 w-10"></th>}
                <th className="text-left p-3 whitespace-nowrap">
                  <button
                    onClick={() => toggleSort('valor')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Valor
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left p-3">Descrição</th>
                <th className="text-left p-3 whitespace-nowrap">
                  <button
                    onClick={() => toggleSort('data')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Data
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left p-3 whitespace-nowrap">
                  <button
                    onClick={() => toggleSort('pessoa')}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Pessoa
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left p-3">Status</th>
                <th className="text-center p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {tableEntries.map((entry, index) => (
                <tr 
                  key={entry.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 transition-colors group',
                    index % 2 === 0 && 'bg-muted/10'
                  )}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  {showCheckbox && (
                    <td className="p-3">
                      <Checkbox
                        checked={false}
                        onCheckedChange={(checked) => handleCheckboxChange(entry.id, checked as boolean)}
                        className="data-[state=checked]:bg-income data-[state=checked]:border-income"
                      />
                    </td>
                  )}
                  <td className="p-3">
                    <div className={cn(
                      'font-mono font-medium rounded px-2 py-1 inline-flex items-center gap-1',
                      'bg-highlight-light text-highlight-foreground'
                    )}>
                      <CurrencySelect
                        value={entry.moeda || 'BRL'}
                        onChange={(moeda) => onUpdateEntry(entry.id, { moeda })}
                        compact
                      />
                      <EditableCell
                        value={formatCurrencyWithSymbol(entry.valor, entry.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
                        onChange={(v) => handleValueChange(entry.id, v)}
                        type="currency"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <EditableCell
                      value={entry.descricao}
                      onChange={(v) => onUpdateEntry(entry.id, { descricao: v })}
                      placeholder="Descrição..."
                    />
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <EditableCell
                      value={formatDate(entry.data)}
                      onChange={(v) => handleDateChange(entry.id, v)}
                      type="date"
                      placeholder="—"
                    />
                  </td>
                  <td className="p-3">
                    <PersonBadge 
                      person={entry.pessoa} 
                      editable 
                      onChange={(pessoa: string) => onUpdateEntry(entry.id, { pessoa })}
                    />
                  </td>
                  <td className="p-3">
                    <StatusBadge 
                      status={entry.status} 
                      editable
                      onChange={(newStatus) => onUpdateEntry(entry.id, { status: newStatus })}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense hover:bg-expense/10"
                      onClick={() => setDeleteConfirm({ open: true, id: entry.id, descricao: entry.descricao || 'este registro' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {tableEntries.length === 0 && (
                <tr>
                  <td colSpan={showCheckbox ? 7 : 6} className="p-8 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {tableEntries.length} registros • Soma dos valores
            </span>
            <span className={cn(
              "font-mono text-lg font-bold",
              status === 'Entrada' ? 'text-income' : 'text-future'
            )}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-income" />
                Entradas
              </h2>
              <p className="text-sm text-muted-foreground">
                Registros de entradas e valores futuros
              </p>
            </div>
          </button>
          
          {isExpanded && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Person */}
              <PersonFilterSelect
                value={filterPerson}
                onChange={setFilterPerson}
              />

              {filterPerson !== 'all' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setFilterPerson('all')}
                  className="h-7 sm:h-8 px-2 sm:px-3 gap-1 text-[10px] sm:text-xs"
                >
                  <X className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span>Limpar</span>
                </Button>
              )}

              <Button 
                onClick={() => handleAddNewEntry(activeTab)} 
                size="sm" 
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          )}
        </div>
        
        {/* Period Filter & Currency Filter */}
        {isExpanded && (
          <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PeriodFilter 
                value={periodFilter}
                onChange={setPeriodFilter}
              />
              {periodFilter.type !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPeriodFilter({ type: 'all' })}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>
            <SectionCurrencyFilter 
              value={displayCurrency}
              onChange={setDisplayCurrency}
              compact
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'Entrada' | 'Futuros')} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Entrada" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Entradas
                <span className="ml-1 px-2 py-0.5 rounded-full bg-income-light text-income text-xs font-mono">
                  {entradasEntries.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="Futuros" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Futuros
                <span className="ml-1 px-2 py-0.5 rounded-full bg-future-light text-future text-xs font-mono">
                  {futurosEntries.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="Entrada" className="mt-0">
            {renderTable(entradasEntries, 'Entrada')}
          </TabsContent>

          <TabsContent value="Futuros" className="mt-0">
            <div className="px-4 pt-3 pb-2 bg-future-light/50 border-b border-future/20">
              <p className="text-sm text-future flex items-center gap-2">
                <Checkbox className="h-4 w-4" disabled />
                <span>Marque o checkbox para confirmar a entrada do valor</span>
              </p>
            </div>
            {renderTable(futurosEntries, 'Futuros')}
          </TabsContent>
        </Tabs>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Remover Registro"
        description={`Tem certeza que deseja remover "${deleteConfirm.descricao}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={() => {
          onDeleteEntry(deleteConfirm.id);
          toast({
            title: "Registro removido",
            description: `"${deleteConfirm.descricao}" foi removido com sucesso.`,
          });
          setDeleteConfirm({ open: false, id: '', descricao: '' });
        }}
      />

      <ConfirmDialog
        open={addConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            // If closing without action, cancel the entry
            cancelEntry(addConfirm.id);
          }
          setAddConfirm({ ...addConfirm, open });
        }}
        title="Confirmar Registro"
        description={addConfirm.entry 
          ? `Confirmar a adição de "${addConfirm.entry.descricao}" no valor de ${formatCurrency(addConfirm.entry.valor)}?`
          : 'Confirmar a adição deste registro?'
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={() => {
          confirmEntry(addConfirm.id);
          setAddConfirm({ open: false, id: '', entry: null });
        }}
      />
    </div>
  );
}
