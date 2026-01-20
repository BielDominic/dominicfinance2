import { useState, useMemo } from 'react';
import { ArrowUpDown, Plus, User, CalendarDays, Sparkles, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { IncomeEntry, Person, EntryStatus } from '@/types/financial';
import { formatCurrency, formatDate, parseCurrencyInput, parseDateInput } from '@/utils/formatters';
import { EditableCell } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { PersonBadge } from './PersonBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [filterPerson, setFilterPerson] = useState<Person | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeTab, setActiveTab] = useState<'Entrada' | 'Futuros'>('Entrada');
  const [isExpanded, setIsExpanded] = useState(true);

  const getFilteredAndSortedEntries = (status: 'Entrada' | 'Futuros') => {
    let result = entries.filter(e => e.status === status);

    // Filter by person
    if (filterPerson !== 'all') {
      result = result.filter(e => e.pessoa === filterPerson);
    }

    // Sort
    result.sort((a, b) => {
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

    return result;
  };

  const entradasEntries = useMemo(() => getFilteredAndSortedEntries('Entrada'), [entries, filterPerson, sortField, sortDirection]);
  const futurosEntries = useMemo(() => getFilteredAndSortedEntries('Futuros'), [entries, filterPerson, sortField, sortDirection]);

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

  const renderTable = (tableEntries: IncomeEntry[], status: 'Entrada' | 'Futuros') => {
    const total = status === 'Entrada' ? totalEntradas : totalFuturos;
    const showCheckbox = status === 'Futuros';

    return (
      <>
        <div className="overflow-x-auto scrollbar-thin">
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
                      'font-mono font-medium rounded px-2 py-1 inline-block',
                      'bg-highlight-light text-highlight-foreground'
                    )}>
                      <EditableCell
                        value={formatCurrency(entry.valor)}
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
                      onChange={(pessoa) => onUpdateEntry(entry.id, { pessoa })}
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
                      onClick={() => onDeleteEntry(entry.id)}
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
              <Select value={filterPerson} onValueChange={(v) => setFilterPerson(v as Person | 'all')}>
                <SelectTrigger className="w-[130px] h-9">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Pessoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Gabriel">Gabriel</SelectItem>
                  <SelectItem value="Myrelle">Myrelle</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => onAddEntry(activeTab)} size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          )}
        </div>
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
    </div>
  );
}

