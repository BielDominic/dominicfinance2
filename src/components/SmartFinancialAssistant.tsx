import { useState, useMemo } from 'react';
import { Bot, Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Target, Calendar, Lightbulb, PiggyBank, Euro, RefreshCw, Wallet, BarChart3, Clock, Flame, Shield, Plane, Users, CreditCard, CalendarClock, AlertCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IncomeEntry, ExpenseCategory, Investment, FinancialSummary } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import { differenceInDays, parseISO, isValid, format, differenceInMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
interface SmartFinancialAssistantProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  summary: FinancialSummary;
  metaEntradas: number;
  targetDate?: string;
}
interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info' | 'tip';
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
  priority?: number;
}
export function SmartFinancialAssistant({
  incomeEntries,
  expenseCategories,
  investments,
  summary,
  metaEntradas,
  targetDate
}: SmartFinancialAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const insights = useMemo(() => {
    const result: Insight[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Meta de Entradas Progress
    const metaProgress = summary.totalEntradas / metaEntradas * 100;
    if (metaProgress >= 100) {
      result.push({
        type: 'success',
        icon: <Target className="h-5 w-5" />,
        title: 'Meta Atingida! 🎉',
        description: `Parabéns! Vocês ultrapassaram a meta de entradas em ${(metaProgress - 100).toFixed(1)}%`,
        value: formatCurrency(summary.totalEntradas),
        priority: 1
      });
    } else if (metaProgress >= 80) {
      result.push({
        type: 'success',
        icon: <Target className="h-5 w-5" />,
        title: 'Quase lá!',
        description: `Faltam apenas ${formatCurrency(metaEntradas - summary.totalEntradas)} para atingir a meta`,
        value: `${metaProgress.toFixed(1)}%`,
        priority: 2
      });
    } else if (metaProgress >= 50) {
      result.push({
        type: 'info',
        icon: <Target className="h-5 w-5" />,
        title: 'Progresso na Meta',
        description: `Vocês já alcançaram metade da meta. Continuem assim!`,
        value: `${metaProgress.toFixed(1)}%`,
        priority: 3
      });
    } else {
      result.push({
        type: 'warning',
        icon: <Target className="h-5 w-5" />,
        title: 'Meta de Entradas',
        description: `Faltam ${formatCurrency(metaEntradas - summary.totalEntradas)} para atingir a meta`,
        value: `${metaProgress.toFixed(1)}%`,
        priority: 2
      });
    }

    // 2. Overdue payments (HIGHEST PRIORITY)
    const overduePayments = expenseCategories.filter(c => {
      if (!c.vencimento || c.faltaPagar <= 0) return false;
      const dueDate = parseISO(c.vencimento);
      return isValid(dueDate) && differenceInDays(dueDate, today) < 0;
    });
    if (overduePayments.length > 0) {
      const totalOverdue = overduePayments.reduce((sum, c) => sum + c.faltaPagar, 0);
      const oldestOverdue = overduePayments.reduce((oldest, c) => {
        const days = Math.abs(differenceInDays(parseISO(c.vencimento!), today));
        return days > oldest.days ? {
          days,
          categoria: c.categoria
        } : oldest;
      }, {
        days: 0,
        categoria: ''
      });
      result.push({
        type: 'danger',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `🚨 ${overduePayments.length} Pagamento${overduePayments.length > 1 ? 's' : ''} Atrasado${overduePayments.length > 1 ? 's' : ''}!`,
        description: `${overduePayments.map(c => c.categoria || 'Sem nome').join(', ')}. Mais antigo: ${oldestOverdue.days} dias`,
        value: formatCurrency(totalOverdue),
        priority: 0
      });
    }

    // 3. Urgent payments (next 7 days)
    const urgentPayments = expenseCategories.filter(c => {
      if (!c.vencimento || c.faltaPagar <= 0) return false;
      const dueDate = parseISO(c.vencimento);
      if (!isValid(dueDate)) return false;
      const days = differenceInDays(dueDate, today);
      return days >= 0 && days <= 7;
    });
    if (urgentPayments.length > 0) {
      const totalUrgent = urgentPayments.reduce((sum, c) => sum + c.faltaPagar, 0);
      result.push({
        type: 'warning',
        icon: <Calendar className="h-5 w-5" />,
        title: `⏰ ${urgentPayments.length} Vencimento${urgentPayments.length > 1 ? 's' : ''} Próximo${urgentPayments.length > 1 ? 's' : ''}`,
        description: `Pagamentos nos próximos 7 dias: ${urgentPayments.map(c => c.categoria || 'Sem nome').join(', ')}`,
        value: formatCurrency(totalUrgent),
        priority: 1
      });
    }

    // 4. Balance analysis
    if (summary.saldoFinalPrevisto > 0) {
      result.push({
        type: 'success',
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Saldo Positivo Previsto ✓',
        description: 'Ótimo! As entradas cobrem todas as despesas planejadas.',
        value: formatCurrency(summary.saldoFinalPrevisto),
        priority: 3
      });
    } else if (summary.saldoFinalPrevisto < 0) {
      result.push({
        type: 'danger',
        icon: <TrendingDown className="h-5 w-5" />,
        title: '⚠️ Atenção: Saldo Negativo',
        description: 'As despesas superam as entradas. Revise os gastos ou busque entradas adicionais.',
        value: formatCurrency(summary.saldoFinalPrevisto),
        priority: 0
      });
    }

    // 5. Future income potential
    if (summary.totalFuturos > 0) {
      result.push({
        type: 'info',
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Entradas Futuras Previstas',
        description: 'Com as entradas futuras, o saldo final será ainda melhor!',
        value: formatCurrency(summary.saldoFinalComFuturos),
        priority: 4
      });
    }

    // 6. Payment progress
    const paymentProgress = summary.totalSaidas > 0 ? summary.totalPago / summary.totalSaidas * 100 : 0;
    if (paymentProgress >= 80) {
      result.push({
        type: 'success',
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: 'Pagamentos Quase Completos! 🎯',
        description: `${paymentProgress.toFixed(0)}% das despesas já foram pagas!`,
        value: formatCurrency(summary.totalPago),
        priority: 3
      });
    } else if (paymentProgress >= 50) {
      result.push({
        type: 'info',
        icon: <PiggyBank className="h-5 w-5" />,
        title: 'Progresso nos Pagamentos',
        description: `Metade das despesas já pagas. Faltam ${formatCurrency(summary.totalAPagar)}`,
        value: `${paymentProgress.toFixed(0)}%`,
        priority: 4
      });
    }

    // 7. EUR conversion insight
    if (summary.saldoAposCambioEUR > 0) {
      result.push({
        type: 'info',
        icon: <Euro className="h-5 w-5" />,
        title: 'Saldo em Euros 🇪🇺',
        description: `Com a taxa atual (1 EUR = R$ ${summary.taxaCambio.toFixed(2)}), seu saldo será aproximadamente:`,
        value: `€${summary.saldoAposCambioEUR.toLocaleString('pt-BR', {
          minimumFractionDigits: 2
        })}`,
        priority: 5
      });
    }

    // 8. Days until trip with detailed planning
    if (targetDate) {
      const tripDate = parseISO(targetDate);
      if (isValid(tripDate)) {
        const daysUntilTrip = differenceInDays(tripDate, today);
        const monthsUntilTrip = differenceInMonths(tripDate, today);
        if (daysUntilTrip > 0) {
          const remainingToSave = summary.totalAPagar;

          // Weekly savings calculation
          const weeksUntilTrip = Math.floor(daysUntilTrip / 7);
          const weeklySavingNeeded = weeksUntilTrip > 0 ? remainingToSave / weeksUntilTrip : remainingToSave;

          // Monthly savings calculation
          const monthlySavingNeeded = monthsUntilTrip > 0 ? remainingToSave / monthsUntilTrip : remainingToSave;
          if (remainingToSave > 0 && monthsUntilTrip > 0) {
            result.push({
              type: 'tip',
              icon: <CalendarClock className="h-5 w-5" />,
              title: `📅 ${daysUntilTrip} dias para a viagem`,
              description: `Economize ${formatCurrency(monthlySavingNeeded)}/mês ou ${formatCurrency(weeklySavingNeeded)}/semana para quitar tudo até ${format(tripDate, "dd/MM/yyyy")}`,
              value: `${monthsUntilTrip} meses`,
              priority: 2
            });
          }

          // Milestone alerts
          if (daysUntilTrip === 30) {
            result.push({
              type: 'warning',
              icon: <Flame className="h-5 w-5" />,
              title: '🔥 Último mês antes da viagem!',
              description: 'Falta apenas 1 mês! Hora de finalizar os preparativos.',
              priority: 1
            });
          } else if (daysUntilTrip <= 7) {
            result.push({
              type: 'warning',
              icon: <Plane className="h-5 w-5" />,
              title: '✈️ Viagem na próxima semana!',
              description: 'Confira se tudo está pago e preparado para a viagem!',
              priority: 0
            });
          }
        }
      }
    }

    // 9. Person balance analysis
    const gabrielEntries = incomeEntries.filter(e => e.pessoa === 'Gabriel' && e.status === 'Entrada');
    const myrelleEntries = incomeEntries.filter(e => e.pessoa === 'Myrelle' && e.status === 'Entrada');
    const gabrielTotal = gabrielEntries.reduce((sum, e) => sum + e.valor, 0);
    const myrelleTotal = myrelleEntries.reduce((sum, e) => sum + e.valor, 0);
    const ambosTotal = incomeEntries.filter(e => e.pessoa === 'Ambos' && e.status === 'Entrada').reduce((sum, e) => sum + e.valor, 0);
    if (gabrielTotal > 0 && myrelleTotal > 0) {
      const diff = Math.abs(gabrielTotal - myrelleTotal);
      const total = gabrielTotal + myrelleTotal;
      const diffPercent = diff / total * 100;
      const gabrielPercent = gabrielTotal / total * 100;
      const myrellePercent = myrelleTotal / total * 100;
      result.push({
        type: 'info',
        icon: <Users className="h-5 w-5" />,
        title: '👥 Contribuição Individual',
        description: `Gabriel: ${gabrielPercent.toFixed(0)}% (${formatCurrency(gabrielTotal)}) • Myrelle: ${myrellePercent.toFixed(0)}% (${formatCurrency(myrelleTotal)})`,
        value: ambosTotal > 0 ? `+${formatCurrency(ambosTotal)} compartilhado` : undefined,
        priority: 5
      });
    }

    // 10. Investment tracking
    const totalInvestments = investments.reduce((sum, i) => sum + i.valor, 0);
    if (totalInvestments > 0) {
      const investmentPercent = (totalInvestments / summary.totalEntradas * 100).toFixed(0);
      result.push({
        type: 'success',
        icon: <PiggyBank className="h-5 w-5" />,
        title: '💰 Reservas e Investimentos',
        description: `Vocês têm reservas em ${investments.length} categoria${investments.length > 1 ? 's' : ''}. Isso representa ${investmentPercent}% das entradas.`,
        value: formatCurrency(totalInvestments),
        priority: 4
      });
    }

    // 11. Expense categories analysis
    const categoriesWithBudget = expenseCategories.filter(c => c.metaOrcamento && c.metaOrcamento > 0);
    const overBudgetCategories = categoriesWithBudget.filter(c => c.total > (c.metaOrcamento || 0));
    if (overBudgetCategories.length > 0) {
      const totalOverBudget = overBudgetCategories.reduce((sum, c) => sum + (c.total - (c.metaOrcamento || 0)), 0);
      result.push({
        type: 'warning',
        icon: <BarChart3 className="h-5 w-5" />,
        title: '📊 Orçamento Excedido',
        description: `${overBudgetCategories.length} categoria${overBudgetCategories.length > 1 ? 's ultrapassaram' : ' ultrapassou'} o orçamento: ${overBudgetCategories.map(c => c.categoria).join(', ')}`,
        value: `+${formatCurrency(totalOverBudget)}`,
        priority: 2
      });
    }

    // 12. Large upcoming expenses alert
    const largeExpenses = expenseCategories.filter(c => c.faltaPagar > 1000);
    if (largeExpenses.length > 0) {
      const largest = largeExpenses.reduce((max, c) => c.faltaPagar > max.faltaPagar ? c : max, largeExpenses[0]);
      result.push({
        type: 'info',
        icon: <CreditCard className="h-5 w-5" />,
        title: '💳 Despesas Significativas',
        description: `${largeExpenses.length} despesa${largeExpenses.length > 1 ? 's' : ''} acima de R$ 1.000. Maior: ${largest.categoria || 'Sem nome'}`,
        value: formatCurrency(largest.faltaPagar),
        priority: 4
      });
    }

    // 13. Fully paid categories celebration
    const fullyPaidCategories = expenseCategories.filter(c => c.total > 0 && c.faltaPagar === 0);
    if (fullyPaidCategories.length > 0 && fullyPaidCategories.length >= 3) {
      result.push({
        type: 'success',
        icon: <Star className="h-5 w-5" />,
        title: '⭐ Categorias Quitadas!',
        description: `${fullyPaidCategories.length} categorias 100% pagas: ${fullyPaidCategories.slice(0, 3).map(c => c.categoria).join(', ')}${fullyPaidCategories.length > 3 ? '...' : ''}`,
        priority: 4
      });
    }

    // 14. Emergency fund recommendation
    if (result.filter(r => r.type === 'danger').length === 0 && summary.saldoFinalPrevisto > 1000) {
      const emergencyFund = summary.saldoFinalPrevisto * 0.15;
      result.push({
        type: 'tip',
        icon: <Shield className="h-5 w-5" />,
        title: '🛡️ Reserva de Emergência',
        description: 'Considere manter 15% do saldo como reserva para imprevistos na viagem',
        value: formatCurrency(emergencyFund),
        priority: 6
      });
    }

    // 15. No due dates warning
    const categoriesWithoutDueDate = expenseCategories.filter(c => !c.vencimento && c.faltaPagar > 0);
    if (categoriesWithoutDueDate.length > 3) {
      result.push({
        type: 'tip',
        icon: <AlertCircle className="h-5 w-5" />,
        title: '📝 Organize as Datas',
        description: `${categoriesWithoutDueDate.length} despesas sem vencimento definido. Adicione datas para melhor controle!`,
        priority: 5
      });
    }

    // 16. Cash flow projection
    if (summary.totalAPagar > 0 && summary.saldoAtual > 0) {
      const coverageRatio = summary.saldoAtual / summary.totalAPagar * 100;
      if (coverageRatio >= 100) {
        result.push({
          type: 'success',
          icon: <Wallet className="h-5 w-5" />,
          title: '💵 Cobertura Total',
          description: 'O saldo atual cobre 100% das despesas pendentes!',
          value: `${coverageRatio.toFixed(0)}%`,
          priority: 3
        });
      } else if (coverageRatio >= 50) {
        result.push({
          type: 'info',
          icon: <Wallet className="h-5 w-5" />,
          title: '💵 Cobertura Parcial',
          description: `O saldo atual cobre ${coverageRatio.toFixed(0)}% das despesas pendentes`,
          value: formatCurrency(summary.saldoAtual),
          priority: 4
        });
      }
    }

    // 17. Pending future entries reminder
    const pendingFutures = incomeEntries.filter(e => e.status === 'Futuros');
    if (pendingFutures.length > 0) {
      const totalPendingFutures = pendingFutures.reduce((sum, e) => sum + e.valor, 0);
      result.push({
        type: 'tip',
        icon: <Clock className="h-5 w-5" />,
        title: '⏳ Entradas Pendentes',
        description: `${pendingFutures.length} entrada${pendingFutures.length > 1 ? 's' : ''} futura${pendingFutures.length > 1 ? 's' : ''} aguardando confirmação`,
        value: formatCurrency(totalPendingFutures),
        priority: 5
      });
    }

    // Sort by priority (lower number = higher priority)
    return result.sort((a, b) => (a.priority || 5) - (b.priority || 5));
  }, [incomeEntries, expenseCategories, investments, summary, metaEntradas, targetDate, refreshKey]);
  const getTypeStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400';
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400';
      case 'danger':
        return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400';
      case 'tip':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400';
    }
  };
  const successCount = insights.filter(i => i.type === 'success').length;
  const warningCount = insights.filter(i => i.type === 'warning' || i.type === 'danger').length;
  const tipCount = insights.filter(i => i.type === 'tip').length;
  return <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left">
          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-primary" />
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              Assistente Financeiro Inteligente
              
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {insights.length} insights • 
              <span className="text-emerald-600 dark:text-emerald-400">{successCount} positivos</span> • 
              <span className="text-orange-600 dark:text-orange-400">{warningCount} alertas</span> •
              <span className="text-purple-600 dark:text-purple-400">{tipCount} dicas</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => {
          e.stopPropagation();
          setRefreshKey(k => k + 1);
        }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </button>
      </div>

      {/* Content */}
      {isExpanded && <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, index) => <div key={index} className={cn("flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:scale-[1.01]", getTypeStyles(insight.type))}>
                <div className="shrink-0 mt-0.5">
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{insight.title}</p>
                    {insight.value && <span className="font-mono font-bold text-sm whitespace-nowrap">
                        {insight.value}
                      </span>}
                  </div>
                  <p className="text-sm opacity-80 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>)}
          </div>

          {insights.length === 0 && <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Adicione mais dados para receber insights personalizados!</p>
            </div>}
        </div>}
    </div>;
}