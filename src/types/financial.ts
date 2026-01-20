export type Person = 'Gabriel' | 'Myrelle';
export type EntryStatus = 'Entrada' | 'Futuros';

export interface IncomeEntry {
  id: string;
  valor: number;
  descricao: string;
  data: string | null;
  pessoa: Person;
  status: EntryStatus;
}

export interface ExpenseCategory {
  id: string;
  categoria: string;
  total: number;
  pago: number;
  faltaPagar: number;
}

export interface Investment {
  id: string;
  categoria: string;
  valor: number;
}

export interface FinancialSummary {
  totalEntradas: number;
  totalSaidas: number;
  totalPago: number;
  totalAPagar: number;
  totalAntecipado: number;
  saldoFinalPrevisto: number;
  saldoAtual: number;
  saldoAposCambio: number;
}
