import { createContext, useContext, useState, ReactNode } from 'react';

export type DisplayCurrency = 'ALL' | 'BRL' | 'USD' | 'EUR';

interface CurrencyFilterContextType {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  resetFilter: () => void;
  convertValue: (value: number, fromCurrency: string, exchangeRate: number) => number;
  formatWithSymbol: (value: number, originalCurrency?: string) => string;
}

const CurrencyFilterContext = createContext<CurrencyFilterContextType | undefined>(undefined);

// Exchange rates relative to BRL (approximate, will be overridden by actual rate)
const RATES_TO_BRL: Record<string, number> = {
  BRL: 1,
  USD: 5.5,
  EUR: 6.0,
};

export function CurrencyFilterProvider({ 
  children, 
  exchangeRate = 6.0 
}: { 
  children: ReactNode;
  exchangeRate?: number;
}) {
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('ALL');

  const resetFilter = () => {
    setDisplayCurrency('ALL');
  };

  // Convert a value from its original currency to the display currency
  const convertValue = (value: number, fromCurrency: string = 'BRL', eurRate: number = exchangeRate): number => {
    // If showing ALL (original), return value as-is
    if (displayCurrency === 'ALL') {
      return value;
    }

    // First convert to BRL
    let valueInBRL = value;
    if (fromCurrency === 'EUR') {
      valueInBRL = value * eurRate;
    } else if (fromCurrency === 'USD') {
      valueInBRL = value * (eurRate / 1.1); // Approximate USD/EUR ratio
    }

    // Then convert from BRL to display currency
    if (displayCurrency === 'BRL') {
      return valueInBRL;
    } else if (displayCurrency === 'EUR') {
      return valueInBRL / eurRate;
    } else if (displayCurrency === 'USD') {
      return valueInBRL / (eurRate / 1.1);
    }
    return valueInBRL;
  };

  const formatWithSymbol = (value: number, originalCurrency?: string): string => {
    const symbols: Record<DisplayCurrency, string> = {
      ALL: originalCurrency === 'EUR' ? '€' : originalCurrency === 'USD' ? '$' : 'R$',
      BRL: 'R$',
      USD: '$',
      EUR: '€',
    };
    const symbol = displayCurrency === 'ALL' && originalCurrency 
      ? symbols.ALL 
      : symbols[displayCurrency] || 'R$';
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyFilterContext.Provider value={{ 
      displayCurrency, 
      setDisplayCurrency, 
      resetFilter,
      convertValue,
      formatWithSymbol 
    }}>
      {children}
    </CurrencyFilterContext.Provider>
  );
}

export function useCurrencyFilter() {
  const context = useContext(CurrencyFilterContext);
  if (context === undefined) {
    throw new Error('useCurrencyFilter must be used within a CurrencyFilterProvider');
  }
  return context;
}
