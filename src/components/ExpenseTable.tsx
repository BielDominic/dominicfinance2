import { Plus, Plane, Trash2 } from 'lucide-react';
import { ExpenseCategory } from '@/types/financial';
import { formatCurrency, parseCurrencyInput } from '@/utils/formatters';
import { EditableCell } from './EditableCell';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpenseTableProps {
  categories: ExpenseCategory[];
  onUpdateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  onAddCategory: () => void;
  onDeleteCategory: (id: string) => void;
}

export function ExpenseTable({ categories, onUpdateCategory, onAddCategory, onDeleteCategory }: ExpenseTableProps) {
  const totals = categories.reduce(
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

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plane className="h-5 w-5 text-expense" />
              Saídas (Viagem)
            </h2>
            <p className="text-sm text-muted-foreground">
              {categories.length} categorias • Falta: <span className="font-mono font-semibold text-expense">{formatCurrency(totals.faltaPagar)}</span>
            </p>
          </div>
          
          <Button onClick={onAddCategory} size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">Categoria</th>
              <th className="text-right p-3 whitespace-nowrap">Total (R$)</th>
              <th className="text-right p-3 whitespace-nowrap">Pago (R$)</th>
              <th className="text-right p-3 whitespace-nowrap">Falta (R$)</th>
              <th className="text-left p-3 w-32">Progresso</th>
              <th className="text-center p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
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
                <td className="p-3 text-right font-mono">
                  <EditableCell
                    value={formatCurrency(category.total)}
                    onChange={(v) => handleValueChange(category.id, 'total', v)}
                    type="currency"
                    className="text-right"
                  />
                </td>
                <td className="p-3 text-right font-mono">
                  <span className="text-income">
                    <EditableCell
                      value={formatCurrency(category.pago)}
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
                    {formatCurrency(category.faltaPagar)}
                  </span>
                </td>
                <td className="p-3">
                  <ProgressBar value={category.pago} max={category.total} />
                </td>
                <td className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-expense hover:bg-expense/10"
                    onClick={() => onDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Nenhuma categoria encontrada
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td className="p-3">Total</td>
              <td className="p-3 text-right font-mono">{formatCurrency(totals.total)}</td>
              <td className="p-3 text-right font-mono text-income">{formatCurrency(totals.pago)}</td>
              <td className="p-3 text-right font-mono text-expense">{formatCurrency(totals.faltaPagar)}</td>
              <td className="p-3">
                <ProgressBar value={totals.pago} max={totals.total} />
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
