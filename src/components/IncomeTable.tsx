import { useState, useMemo } from 'react';
import { ArrowUpDown, Plus, Filter, User, CalendarDays } from 'lucide-react';
import { IncomeEntry, Person, EntryStatus } from '@/types/financial';
import { formatCurrency, formatDate, parseCurrencyInput, parseDateInput } from '@/utils/formatters';
import { EditableCell } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { PersonBadge } from './PersonBadge';
import { Button } from '@/components/ui/button';
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
  onAddEntry: () => void;
}

type SortField = 'data' | 'valor' | 'pessoa';
type SortDirection = 'asc' | 'desc';

export function IncomeTable({ entries, onUpdateEntry, onAddEntry }: IncomeTableProps) {
  const [filterPerson, setFilterPerson] = useState<Person | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<EntryStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];

    // Filter by person
    if (filterPerson !== 'all') {
      result = result.filter(e => e.pessoa === filterPerson);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus);
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
  }, [entries, filterPerson, filterStatus, sortField, sortDirection]);

  const totalValue = useMemo(() => {
    return filteredAndSortedEntries.reduce((sum, e) => sum + e.valor, 0);
  }, [filteredAndSortedEntries]);

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

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-income" />
              Entradas
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedEntries.length} registros • Total: <span className="font-mono font-semibold text-income">{formatCurrency(totalValue)}</span>
            </p>
          </div>
          
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

            {/* Filter by Status */}
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as EntryStatus | 'all')}>
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Entrada">Entrada</SelectItem>
                <SelectItem value="Futuros">Futuros</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onAddEntry} size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="table-header">
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
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEntries.map((entry, index) => (
              <tr 
                key={entry.id}
                className={cn(
                  'border-b border-border/50 hover:bg-muted/30 transition-colors',
                  index % 2 === 0 && 'bg-muted/10'
                )}
                style={{ animationDelay: `${index * 20}ms` }}
              >
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
                  <PersonBadge person={entry.pessoa} />
                </td>
                <td className="p-3">
                  <StatusBadge status={entry.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Soma dos valores filtrados
          </span>
          <span className="font-mono text-lg font-bold text-income">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>
    </div>
  );
}
