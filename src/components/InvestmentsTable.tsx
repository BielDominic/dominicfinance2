import { useState } from 'react';
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, parseCurrencyInput } from '@/utils/formatters';
import { Investment } from '@/types/financial';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InvestmentsTableProps {
  investments: Investment[];
  onUpdateInvestment: (id: string, updates: Partial<Investment>) => void;
  onAddInvestment: () => void;
  onDeleteInvestment: (id: string) => void;
}

export function InvestmentsTable({
  investments,
  onUpdateInvestment,
  onAddInvestment,
  onDeleteInvestment,
}: InvestmentsTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const totalInvestido = investments.reduce((sum, inv) => sum + inv.valor, 0);

  const handleStartEdit = (id: string, field: string, currentValue: string | number) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = (id: string, field: string) => {
    if (field === 'valor') {
      onUpdateInvestment(id, { [field]: parseCurrencyInput(editValue) });
    } else {
      onUpdateInvestment(id, { [field]: editValue });
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="financial-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-ireland-orange" />
          Onde o Dinheiro Está Aplicado
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Aplicado</p>
            <p className="font-mono font-bold text-ireland-green">{formatCurrency(totalInvestido)}</p>
          </div>
          <Button size="sm" onClick={onAddInvestment} className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Categoria / Local</TableHead>
              <TableHead className="text-right">Valor (R$)</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => (
              <TableRow key={investment.id} className="group">
                <TableCell>
                  {editingCell?.id === investment.id && editingCell?.field === 'categoria' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit(investment.id, 'categoria')}
                      onKeyDown={(e) => handleKeyDown(e, investment.id, 'categoria')}
                      className="h-8"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => handleStartEdit(investment.id, 'categoria', investment.categoria)}
                      className="cursor-pointer hover:bg-muted px-2 py-1 rounded inline-block min-w-[100px]"
                    >
                      {investment.categoria || 'Clique para editar'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editingCell?.id === investment.id && editingCell?.field === 'valor' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit(investment.id, 'valor')}
                      onKeyDown={(e) => handleKeyDown(e, investment.id, 'valor')}
                      className="h-8 text-right font-mono"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => handleStartEdit(investment.id, 'valor', investment.valor)}
                      className="cursor-pointer hover:bg-muted px-2 py-1 rounded font-mono font-semibold text-ireland-green"
                    >
                      {formatCurrency(investment.valor)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-expense hover:text-expense hover:bg-expense-light"
                    onClick={() => onDeleteInvestment(investment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {investments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhuma aplicação cadastrada. Clique em "Adicionar" para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
