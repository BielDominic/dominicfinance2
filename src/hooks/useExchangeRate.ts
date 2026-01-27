import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rate: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

export function useExchangeRate(baseCurrency: string = 'EUR', targetCurrency: string = 'BRL') {
  const [data, setData] = useState<ExchangeRateData>({
    rate: 0,
    lastUpdated: null,
    isLoading: false,
    error: null,
  });

  const fetchRate = useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${targetCurrency}`
      );
      
      if (!response.ok) {
        throw new Error('Falha ao buscar cotação');
      }
      
      const result = await response.json();
      const rate = result.rates[targetCurrency];
      
      if (rate) {
        setData({
          rate,
          lastUpdated: new Date(),
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error('Cotação não encontrada');
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }));
    }
  }, [baseCurrency, targetCurrency]);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return {
    ...data,
    refetch: fetchRate,
  };
}
