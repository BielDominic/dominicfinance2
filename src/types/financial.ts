export type Person = 'Gabriel' | 'Myrelle';
export type EntryStatus = 'Entrada' | 'Futuros';
export type EntryTag = 'urgente' | 'opcional' | 'confirmado' | 'pendente' | 'recorrente';

export interface IncomeEntry {
  id: string;
  valor: number;
  descricao: string;
  data: string | null;
  pessoa: Person;
  status: EntryStatus;
  tags: EntryTag[];
  notas: string | null;
}

export interface ExpenseCategory {
  id: string;
  categoria: string;
  total: number;
  pago: number;
  faltaPagar: number;
  metaOrcamento: number | null;
  vencimento: string | null;
  notas: string | null;
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
  totalFuturos: number;
  saldoFinalPrevisto: number;
  saldoFinalComFuturos: number;
  saldoAtual: number;
  saldoAposCambioEUR: number;
  taxaCambio: number;
}

export interface AppConfig {
  darkMode: boolean;
  headerTitle: string;
  headerSubtitle: string;
}
