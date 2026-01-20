import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { IncomeTable } from '@/components/IncomeTable';
import { ExpenseTable } from '@/components/ExpenseTable';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { EvolutionChart } from '@/components/EvolutionChart';
import { FinancialSummary } from '@/components/FinancialSummary';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { PasswordScreen } from '@/components/PasswordScreen';
import { InvestmentsTable } from '@/components/InvestmentsTable';
import { DayCounter } from '@/components/DayCounter';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Save, Check, Loader2 } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('financial-auth') === 'true';
  });

  // Dark mode is local per user (not synchronized)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('financial-dark-mode') === 'true';
  });

  const {
    incomeEntries,
    expenseCategories,
    investments,
    metaEntradas,
    isLoading,
    isSaving,
    appConfig,
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
    handleTitleChange,
    handleSubtitleChange,
    handleTaxaCambioChange,
    handleSpreadChange,
    handleTargetDateChange,
    handleCounterTitleChange,
  } = useFinancialData();

  // Handle dark mode change (local only)
  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('financial-dark-mode', enabled.toString());
  };

  // Apply dark mode on change (local per user)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Calculate totals from income entries (only confirmed entries, not "Futuros")
  const calculatedTotals = useMemo(() => {
    const totalEntradas = incomeEntries
      .filter(e => e.status === 'Entrada')
      .reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    return { totalEntradas, totalSaidas, totalPago };
  }, [incomeEntries, expenseCategories]);

  // Apply dark mode on change (local per user)
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Taxa efetiva com spread
  const taxaEfetiva = appConfig.taxaCambio * (1 + appConfig.spread / 100);
  
  const summary: FinancialSummaryType = useMemo(() => {
    const totalEntradas = incomeEntries
      .filter(e => e.status === 'Entrada')
      .reduce((sum, e) => sum + e.valor, 0);
    const totalFuturos = incomeEntries
      .filter(e => e.status === 'Futuros')
      .reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    const totalAPagar = totalSaidas - totalPago;
    const saldoFinalPrevisto = totalEntradas - totalSaidas;
    const saldoFinalComFuturos = totalEntradas + totalFuturos - totalSaidas;
    const saldoAtual = totalEntradas - totalPago;
    const saldoAposCambioEUR = saldoFinalPrevisto / taxaEfetiva;

    return {
      totalEntradas,
      totalSaidas,
      totalPago,
      totalAPagar,
      totalAntecipado: 0,
      totalFuturos,
      saldoFinalPrevisto,
      saldoFinalComFuturos,
      saldoAtual,
      saldoAposCambioEUR,
      taxaCambio: taxaEfetiva,
    };
  }, [incomeEntries, expenseCategories, taxaEfetiva]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('financial-auth');
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
        title={appConfig.headerTitle}
        subtitle={appConfig.headerSubtitle}
        onTitleChange={handleTitleChange}
        onSubtitleChange={handleSubtitleChange}
        darkMode={darkMode}
        onDarkModeChange={handleDarkModeChange}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Day Counter - Ireland Theme Section */}
        <div className="relative overflow-hidden rounded-xl border-2 border-ireland-green/30 bg-gradient-to-r from-ireland-green/5 via-white/50 to-ireland-orange/5 dark:from-ireland-green/10 dark:via-card dark:to-ireland-orange/10">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-ireland-green/10 blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-ireland-orange/10 blur-2xl" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ireland-green via-white to-ireland-orange" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-ireland-green via-white to-ireland-orange" />
          </div>
          
          <div className="relative flex flex-col items-center justify-center p-6 sm:p-8">
            {/* Irish flag decorative corners */}
            <div className="absolute top-3 left-3 flex gap-1">
              <div className="w-3 h-3 rounded-full bg-ireland-green" />
              <div className="w-3 h-3 rounded-full bg-white border border-border" />
              <div className="w-3 h-3 rounded-full bg-ireland-orange" />
            </div>
            <div className="absolute top-3 right-3 flex gap-1">
              <div className="w-3 h-3 rounded-full bg-ireland-green" />
              <div className="w-3 h-3 rounded-full bg-white border border-border" />
              <div className="w-3 h-3 rounded-full bg-ireland-orange" />
            </div>
            
            <DayCounter 
              targetDate={appConfig.targetDate}
              onDateChange={handleTargetDateChange}
              title={appConfig.counterTitle}
              onTitleChange={handleCounterTitleChange}
              progressPercentage={metaEntradas > 0 ? Math.min((calculatedTotals.totalEntradas / metaEntradas) * 100, 100) : 0}
            />
          </div>
        </div>

        {/* Global Progress Bar */}
        <GlobalProgressBar 
          totalEntradas={calculatedTotals.totalEntradas}
          totalSaidas={calculatedTotals.totalSaidas}
          totalPago={calculatedTotals.totalPago}
          totalFuturos={summary.totalFuturos}
          metaEntradas={metaEntradas}
          onMetaChange={handleMetaChange}
        />

        {/* Income and Expenses - Stacked Layout */}
        <div className="space-y-6">
          <IncomeTable
            entries={incomeEntries}
            onUpdateEntry={handleUpdateIncomeEntry}
            onAddEntry={handleAddIncomeEntry}
            onDeleteEntry={handleDeleteIncomeEntry}
          />
          
          <ExpenseTable
            categories={expenseCategories}
            onUpdateCategory={handleUpdateExpenseCategory}
            onAddCategory={handleAddExpenseCategory}
            onDeleteCategory={handleDeleteExpenseCategory}
          />
        </div>

        {/* Expense Charts */}
        <ExpenseCharts categories={expenseCategories} />

        {/* Evolution Chart */}
        <EvolutionChart incomeEntries={incomeEntries} expenseCategories={expenseCategories} />

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
          saldoFinalComFuturos={summary.saldoFinalComFuturos}
          saldoAtual={summary.saldoAtual}
          exchangeRate={appConfig.taxaCambio}
          onExchangeRateChange={handleTaxaCambioChange}
          spread={appConfig.spread}
          onSpreadChange={handleSpreadChange}
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
