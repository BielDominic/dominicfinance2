export const formatCurrency = (value: number, currency: 'BRL' | 'EUR' = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Parse any date format and return a valid Date object or null
const parseAnyDate = (value: string | number | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;
  
  // Handle Excel serial date numbers
  if (typeof value === 'number') {
    // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  const str = String(value).trim();
  if (!str || str === '—' || str === '-') return null;
  
  // Try ISO format first: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const date = new Date(str + 'T00:00:00');
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmyMatch) {
    const [, day, month, yearStr] = dmyMatch;
    const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try MM/DD/YYYY (American format) - only if day > 12
  const mdyMatch = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (mdyMatch) {
    const [, first, second, yearStr] = mdyMatch;
    // If first number > 12, it's definitely a day (DD/MM/YYYY already handled above)
    // If second number > 12, try MM/DD/YYYY
    if (parseInt(second) > 12) {
      const year = yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr);
      const date = new Date(year, parseInt(first) - 1, parseInt(second));
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try native Date parsing as last resort
  const nativeDate = new Date(str);
  if (!isNaN(nativeDate.getTime())) return nativeDate;
  
  return null;
};

export const formatDate = (dateString: string | number | null | undefined): string => {
  try {
    const date = parseAnyDate(dateString);
    if (!date) return '—';
    
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
  // Remove currency symbols and text (R$, $, €, USD, EUR, BRL, etc.)
  const cleaned = value
    .replace(/[A-Za-z$€£¥₹₽₿]+/g, '') // Remove currency symbols and letters
    .replace(/\s+/g, '') // Remove spaces
    .trim();
  
  // Handle different decimal separators
  // If has both . and ,: determine which is decimal separator
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Last separator is the decimal one
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Comma is decimal separator (Brazilian/European format: 1.234,56)
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    } else {
      // Dot is decimal separator (US format: 1,234.56)
      return parseFloat(cleaned.replace(/,/g, '')) || 0;
    }
  } else if (cleaned.includes(',')) {
    // Only comma: could be decimal or thousands separator
    // If there are exactly 2 digits after comma, treat as decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return parseFloat(cleaned.replace(',', '.')) || 0;
    }
    // Otherwise treat as thousands separator
    return parseFloat(cleaned.replace(/,/g, '')) || 0;
  }
  
  // Only dots or no separators
  return parseFloat(cleaned.replace(/,/g, '')) || 0;
};

export const parseDateInput = (value: string | number | null | undefined): string | null => {
  try {
    const date = parseAnyDate(value);
    if (!date) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};
