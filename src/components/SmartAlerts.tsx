import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, X, Check, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { ExpenseCategory, IncomeEntry, FinancialSummary } from '@/types/financial';

interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  is_read: boolean;
  is_dismissed: boolean;
  related_table: string | null;
  related_id: string | null;
  created_at: string;
}

interface SmartAlertsProps {
  expenseCategories: ExpenseCategory[];
  incomeEntries: IncomeEntry[];
  summary: FinancialSummary;
}

export function SmartAlerts({ expenseCategories, incomeEntries, summary }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Generate smart alerts based on financial data
  useEffect(() => {
    generateAlerts();
  }, [expenseCategories, incomeEntries, summary]);

  const generateAlerts = async () => {
    const newAlerts: Omit<Alert, 'id' | 'created_at'>[] = [];
    const today = new Date();

    // Check for upcoming due dates (within 7 days)
    expenseCategories.forEach((cat) => {
      if (cat.vencimento && cat.faltaPagar > 0) {
        const dueDate = new Date(cat.vencimento);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          newAlerts.push({
            title: `Vencimento próximo: ${cat.categoria}`,
            message: `Falta pagar ${formatCurrency(cat.faltaPagar)} em ${daysUntilDue === 0 ? 'hoje' : `${daysUntilDue} dias`}`,
            alert_type: 'due_date',
            severity: daysUntilDue <= 2 ? 'error' : 'warning',
            is_read: false,
            is_dismissed: false,
            related_table: 'expense_categories',
            related_id: cat.id,
          });
        } else if (daysUntilDue < 0) {
          newAlerts.push({
            title: `Vencimento atrasado: ${cat.categoria}`,
            message: `${formatCurrency(cat.faltaPagar)} está ${Math.abs(daysUntilDue)} dias atrasado!`,
            alert_type: 'overdue',
            severity: 'error',
            is_read: false,
            is_dismissed: false,
            related_table: 'expense_categories',
            related_id: cat.id,
          });
        }
      }
    });

    // Check if expenses are higher than income
    if (summary.totalSaidas > summary.totalEntradas) {
      newAlerts.push({
        title: 'Despesas excedem entradas',
        message: `Suas despesas (${formatCurrency(summary.totalSaidas)}) são maiores que as entradas (${formatCurrency(summary.totalEntradas)})`,
        alert_type: 'budget_warning',
        severity: 'error',
        is_read: false,
        is_dismissed: false,
        related_table: null,
        related_id: null,
      });
    }

    // Check for categories with high spending (> 80% of budget if set)
    expenseCategories.forEach((cat) => {
      if (cat.metaOrcamento && cat.total > cat.metaOrcamento * 0.8) {
        const percentage = Math.round((cat.total / cat.metaOrcamento) * 100);
        newAlerts.push({
          title: `Orçamento alto: ${cat.categoria}`,
          message: `${percentage}% do orçamento foi utilizado (${formatCurrency(cat.total)} de ${formatCurrency(cat.metaOrcamento)})`,
          alert_type: 'budget_limit',
          severity: percentage >= 100 ? 'error' : 'warning',
          is_read: false,
          is_dismissed: false,
          related_table: 'expense_categories',
          related_id: cat.id,
        });
      }
    });

    // Check for low balance
    if (summary.saldoAtual < 1000 && summary.saldoAtual > 0) {
      newAlerts.push({
        title: 'Saldo baixo',
        message: `Seu saldo atual é de apenas ${formatCurrency(summary.saldoAtual)}`,
        alert_type: 'low_balance',
        severity: 'warning',
        is_read: false,
        is_dismissed: false,
        related_table: null,
        related_id: null,
      });
    }

    // Positive alert: Good savings ratio
    const savingsRatio = summary.totalEntradas > 0 ? (summary.saldoFinalPrevisto / summary.totalEntradas) * 100 : 0;
    if (savingsRatio >= 20) {
      newAlerts.push({
        title: 'Ótima economia!',
        message: `Você está guardando ${savingsRatio.toFixed(0)}% das suas entradas`,
        alert_type: 'positive',
        severity: 'info',
        is_read: false,
        is_dismissed: false,
        related_table: null,
        related_id: null,
      });
    }

    // Convert to Alert format with generated IDs
    const formattedAlerts: Alert[] = newAlerts.map((alert, index) => ({
      ...alert,
      id: `generated-${index}`,
      created_at: new Date().toISOString(),
    }));

    setAlerts(formattedAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const markAsRead = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)));
  };

  const unreadCount = alerts.filter((a) => !a.is_read && !a.is_dismissed).length;
  const activeAlerts = alerts.filter((a) => !a.is_dismissed);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'text-ireland-orange bg-ireland-orange/10 border-ireland-orange/30';
      case 'info':
        return 'text-ireland-green bg-ireland-green/10 border-ireland-green/30';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSeverityIcon = (severity: string, type: string) => {
    if (type === 'positive') return <TrendingUp className="h-4 w-4" />;
    if (severity === 'error') return <AlertTriangle className="h-4 w-4" />;
    if (type === 'due_date' || type === 'overdue') return <Calendar className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-l-4 border-l-ireland-orange">
      <CardHeader className="cursor-pointer py-3" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-ireland-orange" />
            Alertas Inteligentes
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-all',
                getSeverityColor(alert.severity),
                !alert.is_read && 'ring-1 ring-offset-1'
              )}
              onClick={() => markAsRead(alert.id)}
            >
              <div className="mt-0.5">{getSeverityIcon(alert.severity, alert.alert_type)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs opacity-80">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
