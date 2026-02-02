import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GlobalProgressBar } from '@/components/GlobalProgressBar';
import { IncomeTable } from '@/components/IncomeTable';
import { ExpenseTable } from '@/components/ExpenseTable';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { EvolutionChart } from '@/components/EvolutionChart';
import { FinancialSummary } from '@/components/FinancialSummary';
import { PersonSummary } from '@/components/PersonSummary';
import { UpcomingDueDates } from '@/components/UpcomingDueDates';
import { SmartFinancialAssistant } from '@/components/SmartFinancialAssistant';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { InvestmentsTable } from '@/components/InvestmentsTable';
import { DayCounter } from '@/components/DayCounter';
import { DayCounterSettings, getBackgroundClasses } from '@/components/DayCounterSettings';
import { GlobalSearch } from '@/components/GlobalSearch';
import { AIChatModal } from '@/components/AIChatModal';
import { FinancialSnapshots } from '@/components/FinancialSnapshots';
import { DecisionVault } from '@/components/DecisionVault';
import { SmartAlerts } from '@/components/SmartAlerts';
import { DecisionSimulator } from '@/components/DecisionSimulator';
import { PeopleManager } from '@/components/PeopleManager';
import { ReadOnlyProvider, useReadOnly } from '@/components/ReadOnlyToggle';
import { CurrencyFilterProvider } from '@/contexts/CurrencyFilterContext';
import { FinancialSummary as FinancialSummaryType } from '@/types/financial';
import { Loader2 } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const IndexContent = () => {
  const { signOut, profile } = useAuth();
  const { isReadOnly } = useReadOnly();
  
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
    handleCounterBackgroundChange,
    handleCounterIconChange,
    handleCounterColorChange
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
    const totalEntradas = incomeEntries.filter(e => e.status === 'Entrada').reduce((sum, e) => sum + e.valor, 0);
    const totalSaidas = expenseCategories.reduce((sum, c) => sum + c.total, 0);
    const totalPago = expenseCategories.reduce((sum, c) => sum + c.pago, 0);
    return {
      totalEntradas,
      totalSaidas,
      totalPago
    };
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
    const totalEntradas = incomeEntries.filter(e => e.status === 'Entrada').reduce((sum, e) => sum + e.valor, 0);
    const totalFuturos = incomeEntries.filter(e => e.status === 'Futuros').reduce((sum, e) => sum + e.valor, 0);
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
      taxaCambio: taxaEfetiva
    };
  }, [incomeEntries, expenseCategories, taxaEfetiva]);
  
  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-ireland-green mx-auto" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header onLogout={handleLogout} incomeEntries={incomeEntries} expenseCategories={expenseCategories} investments={investments} metaEntradas={metaEntradas} onImportData={handleImportData} title={appConfig.headerTitle} subtitle={appConfig.headerSubtitle} onTitleChange={handleTitleChange} onSubtitleChange={handleSubtitleChange} darkMode={darkMode} onDarkModeChange={handleDarkModeChange}>
        <GlobalSearch incomeEntries={incomeEntries} expenseCategories={expenseCategories} investments={investments} />
      </Header>
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Smart Alerts - Always on top */}
        <SmartAlerts expenseCategories={expenseCategories} incomeEntries={incomeEntries} summary={summary} />
        {/* Day Counter - Customizable Theme Section */}
        <div className={cn(
          "relative overflow-hidden rounded-xl border-2 border-primary/20",
          getBackgroundClasses(appConfig.counterBackground)
        )}>
          {/* Decorative elements - only for ireland theme */}
          {appConfig.counterBackground === 'ireland' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-ireland-green/10 blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-ireland-orange/10 blur-2xl" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ireland-green via-white to-ireland-orange" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-ireland-green via-white to-ireland-orange" />
            </div>
          )}
          
          <div className="relative flex flex-col items-center justify-center p-6 sm:p-8">
            {/* Settings button - top right */}
            <div className="absolute top-3 right-3">
              <DayCounterSettings 
                currentBackground={appConfig.counterBackground}
                onBackgroundChange={handleCounterBackgroundChange}
                currentIcon={appConfig.counterIcon}
                onIconChange={handleCounterIconChange}
                currentColor={appConfig.counterColor}
                onColorChange={handleCounterColorChange}
              />
            </div>

            {/* Irish flag decorative corners - only for ireland theme */}
            {appConfig.counterBackground === 'ireland' && (
              <>
                <div className="absolute top-3 left-3 flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-ireland-green" />
                  <div className="w-3 h-3 rounded-full bg-white border border-border" />
                  <div className="w-3 h-3 rounded-full bg-ireland-orange" />
                </div>
              </>
            )}
            
            <DayCounter 
              targetDate={appConfig.targetDate} 
              onDateChange={handleTargetDateChange} 
              title={appConfig.counterTitle} 
              onTitleChange={handleCounterTitleChange}
              icon={appConfig.counterIcon}
              color={appConfig.counterColor}
            />
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <UpcomingDueDates expenseCategories={expenseCategories} />

        {/* Global Progress Bar */}
        <GlobalProgressBar totalEntradas={calculatedTotals.totalEntradas} totalSaidas={calculatedTotals.totalSaidas} totalPago={calculatedTotals.totalPago} totalFuturos={summary.totalFuturos} metaEntradas={metaEntradas} onMetaChange={handleMetaChange} />

        {/* Income and Expenses - Stacked Layout */}
        <div className="space-y-6">
          <IncomeTable entries={incomeEntries} onUpdateEntry={isReadOnly ? undefined : handleUpdateIncomeEntry} onAddEntry={isReadOnly ? undefined : handleAddIncomeEntry} onDeleteEntry={isReadOnly ? undefined : handleDeleteIncomeEntry} />
          
          <ExpenseTable categories={expenseCategories} onUpdateCategory={isReadOnly ? undefined : handleUpdateExpenseCategory} onAddCategory={isReadOnly ? undefined : handleAddExpenseCategory} onDeleteCategory={isReadOnly ? undefined : handleDeleteExpenseCategory} />
        </div>

        {/* Expense Charts */}
        <ExpenseCharts categories={expenseCategories} />

        {/* Evolution Chart */}
        <EvolutionChart incomeEntries={incomeEntries} expenseCategories={expenseCategories} />

        {/* Investments Section */}
        <InvestmentsTable investments={investments} onUpdateInvestment={isReadOnly ? undefined : handleUpdateInvestment} onAddInvestment={isReadOnly ? undefined : handleAddInvestment} onDeleteInvestment={isReadOnly ? undefined : handleDeleteInvestment} />

        {/* Person Summary */}
        <PersonSummary incomeEntries={incomeEntries} expenseCategories={expenseCategories} />

        {/* Summary Section */}
        <FinancialSummary summary={summary} />

        {/* Smart Financial Assistant (No limits) */}
        <SmartFinancialAssistant incomeEntries={incomeEntries} expenseCategories={expenseCategories} investments={investments} summary={summary} metaEntradas={metaEntradas} targetDate={appConfig.targetDate} />

        {/* Decision Simulator */}
        <DecisionSimulator summary={summary} exchangeRate={appConfig.taxaCambio} />

        {/* Financial Snapshots */}
        <FinancialSnapshots summary={summary} incomeEntries={incomeEntries} expenseCategories={expenseCategories} investments={investments} />

        {/* Decision Vault */}
        <DecisionVault />

        {/* People Manager */}
        <PeopleManager />

        {/* Currency Converter */}
        <CurrencyConverter saldoFinal={summary.saldoFinalPrevisto} saldoFinalComFuturos={summary.saldoFinalComFuturos} saldoAtual={summary.saldoAtual} exchangeRate={appConfig.taxaCambio} onExchangeRateChange={handleTaxaCambioChange} spread={appConfig.spread} onSpreadChange={handleSpreadChange} />

        {/* AI Assistant Chat - Fixed */}
        <div className="fixed bottom-6 right-6 z-50">
          <AIChatModal
            incomeEntries={incomeEntries}
            expenseCategories={expenseCategories}
            investments={investments}
            summary={summary}
            metaEntradas={metaEntradas}
            targetDate={appConfig.targetDate}
          />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-muted-foreground">
          <p>Dominic Planejamento Financeiro - Developed by Gabriel Carvalho </p>
          
        </footer>
      </main>
    </div>;
};

const Index = () => {
  return (
    <ReadOnlyProvider>
      <CurrencyFilterProvider>
        <IndexContent />
      </CurrencyFilterProvider>
    </ReadOnlyProvider>
  );
};

export default Index;