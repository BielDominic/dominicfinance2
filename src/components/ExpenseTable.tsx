import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Plane, Trash2, ChevronDown, ChevronUp, CalendarDays, X, User } from 'lucide-react';
import { ExpenseCategory, Person, Currency } from '@/types/financial';
import { formatCurrency, parseCurrencyInput, formatDate, parseDateInput } from '@/utils/formatters';
import { EditableCell } from './EditableCell';
import { ProgressBar } from './ProgressBar';
import { PersonBadge } from './PersonBadge';
import { CurrencySelect, formatCurrencyWithSymbol } from './CurrencySelect';
import { SectionCurrencyFilter, SectionCurrency, convertCurrency, formatWithCurrency } from './SectionCurrencyFilter';
import { Button } from '@/components/ui/button';
import { PeriodFilter, PeriodFilterValue, filterExpensesByPeriod } from '@/components/PeriodFilter';
import { ConfirmDialog } from './ConfirmDialog';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ExpenseTableProps {
  categories: ExpenseCategory[];
  onUpdateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
}

export function ExpenseTable({ categories, onUpdateCategory, onAddCategory, onDeleteCategory }: ExpenseTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>({ type: 'all' });
  const [filterPerson, setFilterPerson] = useState<Person | 'all'>('all');
  const [displayCurrency, setDisplayCurrency] = useState<SectionCurrency>('original');
  
  // Track pending (unconfirmed) entries
  const [pendingEntries, setPendingEntries] = useState<Set<string>>(new Set());
  
  // Confirmation dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; categoria: string }>({ open: false, id: '', categoria: '' });
  const [addConfirm, setAddConfirm] = useState<{ open: boolean; id: string; category: ExpenseCategory | null }>({ open: false, id: '', category: null });
  
  // Track previous categories to detect newly completed ones
  const prevCategoriesRef = useRef<Map<string, ExpenseCategory>>(new Map());

  // Check if a category is complete (has total > 0 and categoria name)
  const isCategoryComplete = (category: ExpenseCategory) => {
    return category.total > 0 && category.categoria && category.categoria.trim() !== '';
  };

  // Monitor pending entries for completion
  useEffect(() => {
    categories.forEach(category => {
      const isPending = pendingEntries.has(category.id);
      
      // If category is pending and now complete, show confirmation
      if (isPending && isCategoryComplete(category)) {
        setAddConfirm({ open: true, id: category.id, category });
      }
    });
    
    // Update previous categories reference
    const newMap = new Map<string, ExpenseCategory>();
    categories.forEach(c => newMap.set(c.id, { ...c }));
    prevCategoriesRef.current = newMap;
  }, [categories, pendingEntries]);

  // When categories change, check if there's a new empty entry to track
  useEffect(() => {
    categories.forEach(category => {
      if (category.total === 0 && !category.categoria && !pendingEntries.has(category.id)) {
        const isNew = !prevCategoriesRef.current.has(category.id);
        if (isNew) {
          setPendingEntries(prev => new Set(prev).add(category.id));
        }
      }
    });
  }, [categories]);

  const handleAddNewCategory = () => {
    onAddCategory();
    setTimeout(() => {
      const newCategory = categories.find(c => c.total === 0 && !c.categoria);
      if (newCategory) {
        setPendingEntries(prev => new Set(prev).add(newCategory.id));
      }
    }, 100);
  };

  const confirmCategory = (id: string) => {
    setPendingEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast({
      title: "Saída confirmada! ✓",
      description: "A categoria foi adicionada com sucesso.",
    });
  };

  const cancelCategory = (id: string) => {
    setPendingEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    onDeleteCategory(id);
    toast({
      title: "Saída cancelada",
      description: "A categoria foi removida.",
    });
  };

  // Filter categories by period (using vencimento date)
  const filteredCategories = useMemo(() => 
    filterExpensesByPeriod(categories, periodFilter), 
    [categories, periodFilter]
  );

  // Use filtered categories for display, with new/empty entries at the top
  const displayCategories = useMemo(() => {
    let baseList = periodFilter.type === 'all' ? categories : filteredCategories;
    
    // Filter by person - also include entries marked as "Ambos" when filtering by a specific person
    if (filterPerson !== 'all') {
      baseList = baseList.filter(c => c.pessoa === filterPerson || c.pessoa === 'Ambos');
    }
    
    // Separate pending/new entries to show at top
    const newEntries = baseList.filter(c => pendingEntries.has(c.id) || (c.total === 0 && !c.categoria));
    const existingEntries = baseList.filter(c => !pendingEntries.has(c.id) && (c.total !== 0 || c.categoria));
    
    return [...newEntries, ...existingEntries];
  }, [categories, filteredCategories, periodFilter.type, filterPerson, pendingEntries]);
  
  const totals = displayCategories.reduce(
    (acc, cat) => ({
      total: acc.total + cat.total,
      pago: acc.pago + cat.pago,
      faltaPagar: acc.faltaPagar + cat.faltaPagar,
    }),
    { total: 0, pago: 0, faltaPagar: 0 }
  );

  const handleValueChange = (id: string, field: 'total' | 'pago', newValue: string) => {
    const parsed = parseCurrencyInput(newValue);
    const category = categories.find(c => c.id === id);
    if (!category) return;

    const updates: Partial<ExpenseCategory> = { [field]: parsed };
    
    if (field === 'total') {
      updates.faltaPagar = parsed - category.pago;
    } else if (field === 'pago') {
      updates.faltaPagar = category.total - parsed;
    }

    onUpdateCategory(id, updates);
  };

  const handleDateChange = (id: string, newValue: string) => {
    const parsed = parseDateInput(newValue);
    onUpdateCategory(id, { vencimento: parsed });
  };

  // Mobile card view for each expense
  const renderMobileCard = (category: ExpenseCategory) => (
    <div 
      key={category.id}
      className="p-4 border-b border-border/50 last:border-b-0 bg-card"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <EditableCell
          value={category.categoria}
          onChange={(v) => onUpdateCategory(category.id, { categoria: v })}
          placeholder="Nome da categoria..."
          className="font-medium text-base"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-expense hover:bg-expense/10 shrink-0"
          onClick={() => setDeleteConfirm({ open: true, id: category.id, categoria: category.categoria || 'esta categoria' })}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Total</p>
          <div className="font-mono flex items-center gap-1">
            <CurrencySelect
              value={category.moeda || 'BRL'}
              onChange={(moeda) => onUpdateCategory(category.id, { moeda })}
              compact
            />
            <EditableCell
              value={formatCurrencyWithSymbol(category.total, category.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
              onChange={(v) => handleValueChange(category.id, 'total', v)}
              type="currency"
            />
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Pago</p>
          <div className="font-mono text-income">
            <EditableCell
              value={formatCurrencyWithSymbol(category.pago, category.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
              onChange={(v) => handleValueChange(category.id, 'pago', v)}
              type="currency"
            />
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs mb-1">Falta</p>
          <p className={cn(
            "font-mono font-semibold",
            category.faltaPagar > 0 ? 'text-expense' : 'text-income'
          )}>
            {formatCurrencyWithSymbol(category.faltaPagar, category.moeda || 'BRL')}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="font-mono text-sm">
            <EditableCell
              value={category.vencimento ? formatDate(category.vencimento) : ''}
              onChange={(v) => handleDateChange(category.id, v)}
              type="date"
              placeholder="Vencimento..."
            />
          </div>
        </div>
        <PersonBadge 
          person={category.pessoa} 
          editable 
          onChange={(pessoa) => onUpdateCategory(category.id, { pessoa })}
        />
      </div>
      
      <ProgressBar value={category.pago} max={category.total} />
    </div>
  );

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
                <Plane className="h-5 w-5 text-expense" />
                Saídas (Viagem)
              </h2>
              <p className="text-sm text-muted-foreground">
                {displayCategories.length} categorias • Falta: <span className="font-mono font-semibold text-expense">{formatCurrency(totals.faltaPagar)}</span>
              </p>
            </div>
          </button>
          
          {isExpanded && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Person */}
              <Select value={filterPerson} onValueChange={(v) => setFilterPerson(v as Person | 'all')}>
                <SelectTrigger className="w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
                  <User className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Pessoa" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-md z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Gabriel">Gabriel</SelectItem>
                  <SelectItem value="Myrelle">Myrelle</SelectItem>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

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
                onClick={handleAddNewCategory} 
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

      {isExpanded && (
        <div className="md:hidden">
          {displayCategories.map(renderMobileCard)}
          {displayCategories.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma categoria encontrada
            </div>
          )}
          {/* Mobile Footer */}
          <div className="p-4 bg-muted/50 border-t border-border">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total</p>
                <p className="font-mono font-semibold">{formatCurrency(totals.total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Pago</p>
                <p className="font-mono font-semibold text-income">{formatCurrency(totals.pago)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Falta</p>
                <p className="font-mono font-semibold text-expense">{formatCurrency(totals.faltaPagar)}</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={totals.pago} max={totals.total} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      {isExpanded && (
        <div className="hidden md:block overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">Categoria</th>
                <th className="text-left p-3 whitespace-nowrap">Moeda</th>
                <th className="text-right p-3 whitespace-nowrap">Total</th>
                <th className="text-right p-3 whitespace-nowrap">Pago</th>
                <th className="text-right p-3 whitespace-nowrap">Falta</th>
                <th className="text-left p-3 whitespace-nowrap">Vencimento</th>
                <th className="text-left p-3">Pessoa</th>
                <th className="text-left p-3 w-32">Progresso</th>
                <th className="text-center p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayCategories.map((category, index) => (
                <tr 
                  key={category.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/30 transition-colors group',
                    index % 2 === 0 && 'bg-muted/10'
                  )}
                >
                  <td className="p-3 font-medium">
                    <EditableCell
                      value={category.categoria}
                      onChange={(v) => onUpdateCategory(category.id, { categoria: v })}
                      placeholder="Nome da categoria..."
                    />
                  </td>
                  <td className="p-3">
                    <CurrencySelect
                      value={category.moeda || 'BRL'}
                      onChange={(moeda) => onUpdateCategory(category.id, { moeda })}
                      compact
                    />
                  </td>
                  <td className="p-3 text-right font-mono">
                    <EditableCell
                      value={formatCurrencyWithSymbol(category.total, category.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
                      onChange={(v) => handleValueChange(category.id, 'total', v)}
                      type="currency"
                      className="text-right"
                    />
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className="text-income">
                      <EditableCell
                        value={formatCurrencyWithSymbol(category.pago, category.moeda || 'BRL').replace(/^[R$€\$\s]+/, '')}
                        onChange={(v) => handleValueChange(category.id, 'pago', v)}
                        type="currency"
                        className="text-right"
                      />
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className={cn(
                      category.faltaPagar > 0 ? 'text-expense font-semibold' : 'text-income'
                    )}>
                      {formatCurrencyWithSymbol(category.faltaPagar, category.moeda || 'BRL')}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">
                    <EditableCell
                      value={category.vencimento ? formatDate(category.vencimento) : ''}
                      onChange={(v) => handleDateChange(category.id, v)}
                      type="date"
                      placeholder="—"
                    />
                  </td>
                  <td className="p-3">
                    <PersonBadge 
                      person={category.pessoa} 
                      editable 
                      onChange={(pessoa) => onUpdateCategory(category.id, { pessoa })}
                    />
                  </td>
                  <td className="p-3">
                    <ProgressBar value={category.pago} max={category.total} />
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense hover:bg-expense/10"
                      onClick={() => setDeleteConfirm({ open: true, id: category.id, categoria: category.categoria || 'esta categoria' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {displayCategories.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td className="p-3">Total</td>
                <td className="p-3"></td>
                <td className="p-3 text-right font-mono">{formatCurrency(totals.total)}</td>
                <td className="p-3 text-right font-mono text-income">{formatCurrency(totals.pago)}</td>
                <td className="p-3 text-right font-mono text-expense">{formatCurrency(totals.faltaPagar)}</td>
                <td className="p-3"></td>
                <td className="p-3"></td>
                <td className="p-3">
                  <ProgressBar value={totals.pago} max={totals.total} />
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Remover Categoria"
        description={`Tem certeza que deseja remover "${deleteConfirm.categoria}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={() => {
          onDeleteCategory(deleteConfirm.id);
          toast({
            title: "Categoria removida",
            description: `"${deleteConfirm.categoria}" foi removida com sucesso.`,
          });
          setDeleteConfirm({ open: false, id: '', categoria: '' });
        }}
      />

      <ConfirmDialog
        open={addConfirm.open}
        onOpenChange={(open) => {
          if (!open) {
            cancelCategory(addConfirm.id);
          }
          setAddConfirm({ ...addConfirm, open });
        }}
        title="Confirmar Saída"
        description={addConfirm.category 
          ? `Confirmar a adição de "${addConfirm.category.categoria}" no valor de ${formatCurrency(addConfirm.category.total)}?`
          : 'Confirmar a adição desta categoria?'
        }
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={() => {
          confirmCategory(addConfirm.id);
          setAddConfirm({ open: false, id: '', category: null });
        }}
      />
    </div>
  );
}
