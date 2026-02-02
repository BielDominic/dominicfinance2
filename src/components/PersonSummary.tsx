import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface PersonSummaryProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
}

interface DashboardPerson {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

interface PersonStats {
  person: string;
  color: string;
  totalEntradas: number;
  totalFuturos: number;
  totalSaidas: number;
  totalPago: number;
  saldo: number;
}

export function PersonSummary({ incomeEntries, expenseCategories }: PersonSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [people, setPeople] = useState<DashboardPerson[]>([]);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await supabase
        .from('dashboard_people')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (data) {
        setPeople(data as DashboardPerson[]);
      }
    };

    fetchPeople();

    const channel = supabase
      .channel('person_summary_people')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_people' }, fetchPeople)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get number of individual people (excluding "Ambos")
  const individualPeople = people.filter(p => p.name !== 'Ambos');
  const peopleCount = individualPeople.length || 1;

  const calculatePersonStats = (person: DashboardPerson): PersonStats => {
    const isAmbos = person.name === 'Ambos';
    
    // For "Ambos", show the full shared amount (not divided)
    // For individual, show their entries + their share of "Ambos"
    
    if (isAmbos) {
      // Show total shared expenses
      const totalEntradas = incomeEntries
        .filter(e => e.status === 'Entrada' && e.pessoa === 'Ambos')
        .reduce((sum, e) => sum + e.valor, 0);

      const totalFuturos = incomeEntries
        .filter(e => e.status === 'Futuros' && e.pessoa === 'Ambos')
        .reduce((sum, e) => sum + e.valor, 0);

      const totalSaidas = expenseCategories
        .filter(c => c.pessoa === 'Ambos')
        .reduce((sum, c) => sum + c.total, 0);

      const totalPago = expenseCategories
        .filter(c => c.pessoa === 'Ambos')
        .reduce((sum, c) => sum + c.pago, 0);

      return {
        person: person.name,
        color: person.color,
        totalEntradas,
        totalFuturos,
        totalSaidas,
        totalPago,
        saldo: totalEntradas - totalSaidas,
      };
    }

    // Individual person: their entries + share of "Ambos" divided by number of people
    const ownEntradas = incomeEntries
      .filter(e => e.status === 'Entrada' && e.pessoa === person.name)
      .reduce((sum, e) => sum + e.valor, 0);

    const sharedEntradas = incomeEntries
      .filter(e => e.status === 'Entrada' && e.pessoa === 'Ambos')
      .reduce((sum, e) => sum + e.valor, 0);

    const ownFuturos = incomeEntries
      .filter(e => e.status === 'Futuros' && e.pessoa === person.name)
      .reduce((sum, e) => sum + e.valor, 0);

    const sharedFuturos = incomeEntries
      .filter(e => e.status === 'Futuros' && e.pessoa === 'Ambos')
      .reduce((sum, e) => sum + e.valor, 0);

    const ownSaidas = expenseCategories
      .filter(c => c.pessoa === person.name)
      .reduce((sum, c) => sum + c.total, 0);

    const sharedSaidas = expenseCategories
      .filter(c => c.pessoa === 'Ambos')
      .reduce((sum, c) => sum + c.total, 0);

    const ownPago = expenseCategories
      .filter(c => c.pessoa === person.name)
      .reduce((sum, c) => sum + c.pago, 0);

    const sharedPago = expenseCategories
      .filter(c => c.pessoa === 'Ambos')
      .reduce((sum, c) => sum + c.pago, 0);

    const totalEntradas = ownEntradas + (sharedEntradas / peopleCount);
    const totalFuturos = ownFuturos + (sharedFuturos / peopleCount);
    const totalSaidas = ownSaidas + (sharedSaidas / peopleCount);
    const totalPago = ownPago + (sharedPago / peopleCount);

    return {
      person: person.name,
      color: person.color,
      totalEntradas,
      totalFuturos,
      totalSaidas,
      totalPago,
      saldo: totalEntradas - totalSaidas,
    };
  };

  const personStats = people.map(calculatePersonStats);

  const getPersonStyles = (color: string) => ({
    background: `${color}15`,
    color: color,
    borderColor: `${color}50`,
  });

  const PersonCard = ({ stats }: { stats: PersonStats }) => {
    const styles = getPersonStyles(stats.color);
    
    return (
      <div 
        className="rounded-xl border-2 p-4"
        style={{ 
          backgroundColor: styles.background, 
          borderColor: styles.borderColor 
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          {stats.person === 'Ambos' ? (
            <Users className="h-5 w-5" style={{ color: stats.color }} />
          ) : (
            <User className="h-5 w-5" style={{ color: stats.color }} />
          )}
          <h3 className="font-semibold text-lg" style={{ color: stats.color }}>
            {stats.person}
          </h3>
          {stats.person !== 'Ambos' && peopleCount > 1 && (
            <span className="text-xs text-muted-foreground">
              (+ {(100 / peopleCount).toFixed(0)}% compartilhado)
            </span>
          )}
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

          <div className="pt-2 border-t" style={{ borderColor: styles.borderColor }}>
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
  };

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
              Visão individual das finanças (custos "Ambos" divididos por {peopleCount})
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          {people.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Carregando pessoas...</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${personStats.length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {personStats.map((stats) => (
                <PersonCard key={stats.person} stats={stats} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
