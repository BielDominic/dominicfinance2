import { IncomeEntry, ExpenseCategory, FinancialSummary } from '@/types/financial';

export const initialIncomeEntries: IncomeEntry[] = [
  { id: '1', valor: 2500.00, descricao: 'Décimo 1 Parcela + ?', data: '2025-11-25', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '2', valor: 300.00, descricao: 'Sobra Salário', data: '2025-12-01', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '3', valor: 334.00, descricao: 'Relógio 1', data: '2025-12-01', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '4', valor: 119.00, descricao: '?', data: '2025-12-20', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '5', valor: 612.00, descricao: '?', data: '2025-12-31', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '6', valor: 20.00, descricao: 'Sobra Salário', data: '2025-12-31', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '7', valor: 310.00, descricao: 'Sobra Salário', data: '2025-12-31', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '8', valor: 333.00, descricao: 'Relógio 1', data: '2026-01-01', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '9', valor: 652.00, descricao: 'Salário Parcela 1', data: '2026-01-01', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '10', valor: 652.00, descricao: 'Salário Parcela 2', data: '2026-02-01', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '11', valor: 1500.00, descricao: 'FGTS', data: '2026-01-06', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '12', valor: 200.00, descricao: 'Relógio 3', data: '2026-01-15', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '13', valor: 1300.00, descricao: 'Décimo 2 Parcela', data: '2025-02-18', pessoa: 'Myrelle', status: 'Entrada' },
  { id: '14', valor: 2100.00, descricao: 'Décimo 1 Parcela', data: '2025-11-25', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '15', valor: 587.00, descricao: 'Wise', data: '2025-12-01', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '16', valor: 648.00, descricao: 'Sobra Sal', data: '2025-12-01', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '17', valor: 185.00, descricao: 'XP', data: '2025-12-20', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '18', valor: 150.00, descricao: 'Extra', data: '2025-12-31', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '19', valor: 331.00, descricao: 'XP', data: null, pessoa: 'Gabriel', status: 'Entrada' },
  { id: '20', valor: 1696.00, descricao: 'Limite C6', data: null, pessoa: 'Gabriel', status: 'Entrada' },
  { id: '21', valor: 486.00, descricao: 'XP', data: null, pessoa: 'Gabriel', status: 'Entrada' },
  { id: '22', valor: 652.00, descricao: 'Salário Parcela 1', data: '2026-01-01', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '23', valor: 1400.00, descricao: 'Décimo 2 Parcela', data: '2025-12-18', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '24', valor: 273.00, descricao: 'Milha', data: null, pessoa: 'Gabriel', status: 'Entrada' },
  { id: '25', valor: 100.00, descricao: 'Barra Fixa', data: '2025-06-01', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '26', valor: 1118.00, descricao: 'VR', data: '2026-01-01', pessoa: 'Gabriel', status: 'Entrada' },
  { id: '27', valor: 110.00, descricao: 'Relógio', data: null, pessoa: 'Gabriel', status: 'Entrada' },
  { id: '28', valor: 500.00, descricao: 'Reserva Emergência', data: '2026-02-01', pessoa: 'Gabriel', status: 'Futuros' },
  { id: '29', valor: 800.00, descricao: 'Freelance Previsto', data: '2026-01-15', pessoa: 'Myrelle', status: 'Futuros' },
  { id: '30', valor: 350.00, descricao: 'Venda Equipamento', data: '2026-02-10', pessoa: 'Gabriel', status: 'Futuros' },
];

export const initialExpenseCategories: ExpenseCategory[] = [
  { id: '1', categoria: 'Passagens Pernada 1', total: 7825.86, pago: 1883.00, faltaPagar: 5942.86 },
  { id: '2', categoria: 'Passagens Pernada 2', total: 2227.00, pago: 2227.00, faltaPagar: 0 },
  { id: '3', categoria: 'Hospedagem', total: 1100.00, pago: 1100.00, faltaPagar: 0 },
  { id: '4', categoria: 'Seguro Viagem', total: 200.00, pago: 200.00, faltaPagar: 0 },
  { id: '5', categoria: 'ETA', total: 220.00, pago: 220.00, faltaPagar: 0 },
];

export const initialSummary: FinancialSummary = {
  totalEntradas: 31348.97,
  totalSaidas: 11572.86,
  totalPago: 5630.00,
  totalAPagar: 5942.86,
  totalAntecipado: 12680.97,
  totalFuturos: 1650.00,
  saldoFinalPrevisto: 19776.11,
  saldoAtual: 12725.14,
  saldoAposCambio: 19084.11,
};
