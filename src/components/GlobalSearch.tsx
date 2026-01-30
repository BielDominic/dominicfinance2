import { useState, useMemo } from 'react';
import { Search, X, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { IncomeEntry, ExpenseCategory, Investment } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';

interface GlobalSearchProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
}

interface SearchResult {
  type: 'income' | 'expense' | 'investment';
  id: string;
  title: string;
  subtitle: string;
  value: number;
  status?: string;
  pessoa?: string;
}

export function GlobalSearch({ incomeEntries, expenseCategories, investments }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search income entries
    incomeEntries.forEach(entry => {
      if (
        entry.descricao.toLowerCase().includes(searchTerm) ||
        entry.pessoa.toLowerCase().includes(searchTerm) ||
        entry.status.toLowerCase().includes(searchTerm) ||
        entry.valor.toString().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'income',
          id: entry.id,
          title: entry.descricao || 'Sem descrição',
          subtitle: `${entry.pessoa} • ${entry.data}`,
          value: entry.valor,
          status: entry.status,
          pessoa: entry.pessoa,
        });
      }
    });

    // Search expense categories
    expenseCategories.forEach(cat => {
      if (
        cat.categoria.toLowerCase().includes(searchTerm) ||
        (cat.pessoa && cat.pessoa.toLowerCase().includes(searchTerm)) ||
        cat.total.toString().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'expense',
          id: cat.id,
          title: cat.categoria || 'Sem categoria',
          subtitle: `${cat.pessoa || 'Ambos'} • Pago: ${formatCurrency(cat.pago)}`,
          value: cat.total,
          pessoa: cat.pessoa,
        });
      }
    });

    // Search investments
    investments.forEach(inv => {
      if (
        inv.categoria.toLowerCase().includes(searchTerm) ||
        inv.valor.toString().includes(searchTerm)
      ) {
        searchResults.push({
          type: 'investment',
          id: inv.id,
          title: inv.categoria || 'Sem categoria',
          subtitle: 'Investimento',
          value: inv.valor,
        });
      }
    });

    return searchResults.slice(0, 20); // Limit results
  }, [query, incomeEntries, expenseCategories, investments]);

  const getIcon = (type: 'income' | 'expense' | 'investment') => {
    switch (type) {
      case 'income':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'investment':
        return <Briefcase className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: 'income' | 'expense' | 'investment') => {
    switch (type) {
      case 'income':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Entrada</Badge>;
      case 'expense':
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Saída</Badge>;
      case 'investment':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Investimento</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-ireland-green" />
            Pesquisar
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar entradas, saídas, investimentos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px] border-t">
          {query && results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum resultado encontrado</p>
              <p className="text-sm">Tente buscar por descrição, pessoa ou valor</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{result.title}</span>
                      {getTypeBadge(result.type)}
                      {result.status === 'Futuros' && (
                        <Badge variant="outline" className="text-xs">Futuro</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`font-mono font-semibold ${
                      result.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(result.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Digite para buscar em entradas, saídas e investimentos</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
