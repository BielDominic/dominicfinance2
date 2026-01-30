import { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { IncomeEntry, ExpenseCategory, Person, Currency } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { formatCurrencyWithSymbol } from './CurrencySelect';

interface PersonSummaryProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
}

interface PersonStats {
  person: Person;
  totalEntradas: number;
  totalFuturos: number;
  totalSaidas: number;
  totalPago: number;
  saldo: number;
}

export function PersonSummary({ incomeEntries, expenseCategories }: PersonSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const calculatePersonStats = (person: Person): PersonStats => {
    // For individual person, include their entries + shared (Ambos) entries split by 2
    const isIndividual = person !== 'Ambos';
    
    const totalEntradas = incomeEntries
      .filter(e => e.status === 'Entrada')
      .filter(e => {
        if (isIndividual) {
          return e.pessoa === person;
        }
        return e.pessoa === 'Ambos';
      })
      .reduce((sum, e) => sum + e.valor, 0);

    const totalFuturos = incomeEntries
      .filter(e => e.status === 'Futuros')
      .filter(e => {
        if (isIndividual) {
          return e.pessoa === person;
        }
        return e.pessoa === 'Ambos';
      })
      .reduce((sum, e) => sum + e.valor, 0);

    const totalSaidas = expenseCategories
      .filter(c => {
        if (isIndividual) {
          return c.pessoa === person;
        }
        return c.pessoa === 'Ambos';
      })
      .reduce((sum, c) => sum + c.total, 0);

    const totalPago = expenseCategories
      .filter(c => {
        if (isIndividual) {
          return c.pessoa === person;
        }
        return c.pessoa === 'Ambos';
      })
      .reduce((sum, c) => sum + c.pago, 0);

    const saldo = totalEntradas - totalSaidas;

    return {
      person,
      totalEntradas,
      totalFuturos,
      totalSaidas,
      totalPago,
      saldo,
    };
  };

  const gabrielStats = calculatePersonStats('Gabriel');
  const myrelleStats = calculatePersonStats('Myrelle');
  const ambosStats = calculatePersonStats('Ambos');

  const getPersonColor = (person: Person) => {
    switch (person) {
      case 'Gabriel':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Myrelle':
        return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30';
      case 'Ambos':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
    }
  };

  const getPersonIcon = (person: Person) => {
    if (person === 'Ambos') {
      return <Users className="h-5 w-5" />;
    }
    return <User className="h-5 w-5" />;
  };

  const PersonCard = ({ stats }: { stats: PersonStats }) => (
    <div className={`rounded-xl border-2 p-4 ${getPersonColor(stats.person)}`}>
      <div className="flex items-center gap-2 mb-4">
        {getPersonIcon(stats.person)}
        <h3 className="font-semibold text-lg">{stats.person}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Entradas</span>
          </div>
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalEntradas)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-future" />
            <span>Futuros</span>
          </div>
          <span className="font-mono font-medium text-future">
            {formatCurrency(stats.totalFuturos)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <span>Saídas</span>
          </div>
          <span className="font-mono font-medium text-red-600 dark:text-red-400">
            {formatCurrency(stats.totalSaidas)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 text-emerald-500" />
            <span>Pago</span>
          </div>
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalPago)}
          </span>
        </div>

        <div className="pt-2 border-t border-current/20">
          <div className="flex items-center justify-between">
            <span className="font-medium">Saldo</span>
            <span className={`font-mono font-bold text-lg ${stats.saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(stats.saldo)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Resumo por Pessoa
            </h2>
            <p className="text-sm text-muted-foreground">
              Visão individual das finanças
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PersonCard stats={gabrielStats} />
            <PersonCard stats={myrelleStats} />
            <PersonCard stats={ambosStats} />
          </div>
        </div>
      )}
    </div>
  );
}
