import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { IncomeTable } from '@/components/IncomeTable';
import { ExpenseTable } from '@/components/ExpenseTable';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { FinancialSummary } from '@/components/FinancialSummary';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { PasswordScreen } from '@/components/PasswordScreen';
import { InvestmentsTable } from '@/components/InvestmentsTable';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Save, Check, Loader2 } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('financial-auth') === 'true';
  });

  const {
    incomeEntries,
    expenseCategories,
    investments,
    metaEntradas,
    isLoading,
    isSaving,
    handleUpdateIncomeEntry,
    handleAddIncomeEntry,
    handleDeleteIncomeEntry,
    handleUpdateExpenseCategory,
    handleAddExpenseCategory,
    handleDeleteExpenseCategory,
    handleUpdateInvestment,
    handleAddInvestment,
    handleDeleteInvestment,
    handleMetaChange,
    handleSaveData,
    handleImportData,
  } = useFinancialData();

  // Calculate totals from income entries
  const calculatedTotals = useMemo(() => {
    const totalEntradas = incomeEntries.reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    return { totalEntradas, totalSaidas, totalPago };
  }, [incomeEntries, expenseCategories]);

  // Dynamic summary based on current data
  const summary: FinancialSummaryType = useMemo(() => {
    const totalEntradas = incomeEntries.reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    const totalAPagar = totalSaidas - totalPago;
    const saldoFinalPrevisto = totalEntradas - totalSaidas;
    const saldoAtual = totalEntradas - totalPago;

    return {
      totalEntradas,
      totalSaidas,
      totalPago,
      totalAPagar,
      totalAntecipado: 0,
      saldoFinalPrevisto,
      saldoAtual,
      saldoAposCambio: saldoFinalPrevisto,
    };
  }, [incomeEntries, expenseCategories]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('financial-auth');
    setIsAuthenticated(false);
  }, []);

  if (!isAuthenticated) {
    return <PasswordScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-ireland-green mx-auto" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onLogout={handleLogout}
        incomeEntries={incomeEntries}
        expenseCategories={expenseCategories}
        investments={investments}
        metaEntradas={metaEntradas}
        onImportData={handleImportData}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Global Progress Bar */}
        <GlobalProgressBar 
          totalEntradas={calculatedTotals.totalEntradas}
          totalSaidas={calculatedTotals.totalSaidas}
          totalPago={calculatedTotals.totalPago}
          metaEntradas={metaEntradas}
          onMetaChange={handleMetaChange}
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

        {/* Expense Charts */}
        <ExpenseCharts categories={expenseCategories} />

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

        {/* Sync Indicator - Fixed */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={handleSaveData}
            disabled={isSaving}
            className="gap-2 shadow-lg bg-ireland-green hover:bg-ireland-green/90 text-white px-6"
          >
            {isSaving ? (
              <>
                <Check className="h-5 w-5" />
                Sincronizado!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Sincronizar
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
            Todos os valores são editáveis • Alterações sincronizam automaticamente
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
