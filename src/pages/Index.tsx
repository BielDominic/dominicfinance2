import { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { IncomeTable } from '@/components/IncomeTable';
import { ExpenseTable } from '@/components/ExpenseTable';
import { FinancialSummary } from '@/components/FinancialSummary';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { PasswordScreen } from '@/components/PasswordScreen';
import { IncomeEntry, ExpenseCategory, FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { 
  initialIncomeEntries, 
  initialExpenseCategories, 
  initialSummary 
} from '@/data/initialData';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('financial-auth') === 'true';
  });
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(initialIncomeEntries);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [summary] = useState<FinancialSummaryType>(initialSummary);
  const [metaEntradas, setMetaEntradas] = useState(35000);

  // Calculate totals from income entries
  const calculatedTotals = useMemo(() => {
    const totalEntradas = incomeEntries.reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    return { totalEntradas, totalSaidas, totalPago };
  }, [incomeEntries, expenseCategories]);

  const handleUpdateIncomeEntry = useCallback((id: string, updates: Partial<IncomeEntry>) => {
    setIncomeEntries(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  }, []);

  const handleAddIncomeEntry = useCallback((status: 'Entrada' | 'Futuros') => {
    const newEntry: IncomeEntry = {
      id: `new-${Date.now()}`,
      valor: 0,
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      pessoa: 'Gabriel',
      status: status,
    };
    setIncomeEntries(prev => [...prev, newEntry]);
  }, []);

  const handleDeleteIncomeEntry = useCallback((id: string) => {
    setIncomeEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const handleUpdateExpenseCategory = useCallback((id: string, updates: Partial<ExpenseCategory>) => {
    setExpenseCategories(prev =>
      prev.map(category =>
        category.id === id ? { ...category, ...updates } : category
      )
    );
  }, []);

  const handleAddExpenseCategory = useCallback(() => {
    const newCategory: ExpenseCategory = {
      id: `new-${Date.now()}`,
      categoria: '',
      total: 0,
      pago: 0,
      faltaPagar: 0,
    };
    setExpenseCategories(prev => [...prev, newCategory]);
  }, []);

  const handleDeleteExpenseCategory = useCallback((id: string) => {
    setExpenseCategories(prev => prev.filter(category => category.id !== id));
  }, []);

  if (!isAuthenticated) {
    return <PasswordScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Global Progress Bar */}
        <GlobalProgressBar 
          totalEntradas={calculatedTotals.totalEntradas}
          totalSaidas={calculatedTotals.totalSaidas}
          totalPago={calculatedTotals.totalPago}
          metaEntradas={metaEntradas}
          onMetaChange={setMetaEntradas}
        />

        {/* Main Grid - Income and Expenses */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Income Table - Takes 2 columns on XL */}
          <div className="xl:col-span-2">
            <IncomeTable
              entries={incomeEntries}
              onUpdateEntry={handleUpdateIncomeEntry}
              onAddEntry={handleAddIncomeEntry}
              onDeleteEntry={handleDeleteIncomeEntry}
            />
          </div>
          
          {/* Expense Table - Takes 1 column on XL */}
          <div className="xl:col-span-1">
            <ExpenseTable
              categories={expenseCategories}
              onUpdateCategory={handleUpdateExpenseCategory}
              onAddCategory={handleAddExpenseCategory}
              onDeleteCategory={handleDeleteExpenseCategory}
            />
          </div>
        </div>

        {/* Summary Section */}
        <FinancialSummary summary={summary} />

        {/* Currency Converter */}
        <CurrencyConverter 
          saldoFinal={summary.saldoFinalPrevisto} 
          saldoAtual={summary.saldoAtual}
        />

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>
            Planejamento Financeiro • Viagem 2025/2026 • Gabriel & Myrelle
          </p>
          <p className="mt-1 text-xs">
            Todos os valores são editáveis • Clique em qualquer campo para modificar
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
