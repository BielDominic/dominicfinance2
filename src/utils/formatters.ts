export const formatCurrency = (value: number, currency: 'BRL' | 'EUR' = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString.trim() === '') return '—';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

export const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseDateInput = (value: string): string | null => {
  if (!value || value === '—') return null;
  
  // Try to parse DD/MM/YYYY format
  const parts = value.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  return null;
};
