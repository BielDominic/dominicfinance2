import { useState, useCallback, useMemo } from 'react';
import { Header } from '@/components/Header';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { IncomeTable } from '@/components/IncomeTable';
import { ExpenseTable } from '@/components/ExpenseTable';
import { FinancialSummary } from '@/components/FinancialSummary';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { PasswordScreen } from '@/components/PasswordScreen';
import { InvestmentsTable, Investment } from '@/components/InvestmentsTable';
import { IncomeEntry, ExpenseCategory, FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { 
  initialIncomeEntries, 
  initialExpenseCategories, 
  initialSummary 
} from '@/data/initialData';

const initialInvestments: Investment[] = [
  { id: '1', categoria: 'Nubank', valor: 5000 },
  { id: '2', categoria: 'XP Investimentos', valor: 3500 },
  { id: '3', categoria: 'Wise (EUR)', valor: 2000 },
  { id: '4', categoria: 'C6 Bank', valor: 1500 },
];

const STORAGE_KEY = 'financial-data-ireland';

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return null;
};

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('financial-auth') === 'true';
  });
  
  const [savedData] = useState(() => loadFromStorage());
  
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(
    savedData?.incomeEntries || initialIncomeEntries
  );
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(
    savedData?.expenseCategories || initialExpenseCategories
  );
  const [summary] = useState<FinancialSummaryType>(initialSummary);
  const [metaEntradas, setMetaEntradas] = useState(savedData?.metaEntradas || 35000);
  const [investments, setInvestments] = useState<Investment[]>(
    savedData?.investments || initialInvestments
  );
  const [isSaving, setIsSaving] = useState(false);

  // Calculate totals from income entries
  const calculatedTotals = useMemo(() => {
    const totalEntradas = incomeEntries.reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    return { totalEntradas, totalSaidas, totalPago };
  }, [incomeEntries, expenseCategories]);

  const handleSaveData = useCallback(() => {
    setIsSaving(true);
    try {
      const dataToSave = {
        incomeEntries,
        expenseCategories,
        metaEntradas,
        investments,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      toast.success('Dados salvos com sucesso!', {
        description: 'Todas as informações foram armazenadas.',
      });
    } catch (e) {
      toast.error('Erro ao salvar dados', {
        description: 'Tente novamente.',
      });
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [incomeEntries, expenseCategories, metaEntradas, investments]);

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

  const handleUpdateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setInvestments(prev =>
      prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
    );
  }, []);

  const handleAddInvestment = useCallback(() => {
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      categoria: '',
      valor: 0,
    };
    setInvestments(prev => [...prev, newInvestment]);
  }, []);

  const handleDeleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  if (!isAuthenticated) {
    return <PasswordScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={handleLogout} />
      
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

        {/* Investments Section */}
        <InvestmentsTable
          investments={investments}
          onUpdateInvestment={handleUpdateInvestment}
          onAddInvestment={handleAddInvestment}
          onDeleteInvestment={handleDeleteInvestment}
        />

        {/* Summary Section */}
        <FinancialSummary summary={summary} />

        {/* Currency Converter */}
        <CurrencyConverter 
          saldoFinal={summary.saldoFinalPrevisto} 
          saldoAtual={summary.saldoAtual}
        />

        {/* Save Button - Fixed */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={handleSaveData}
            disabled={isSaving}
            className="gap-2 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            {isSaving ? (
              <>
                <Check className="h-5 w-5" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Dados
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>
            🇮🇪 Planejamento Financeiro • Viagem Irlanda 2025/2026 • Gabriel & Myrelle
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
