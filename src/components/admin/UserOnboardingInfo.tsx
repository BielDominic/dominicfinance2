import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Target, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  FileText,
  Plane,
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingData {
  destination_country: string | null;
  destination_city: string | null;
  travel_date: string | null;
  financial_goal: number | null;
  monthly_income_estimate: number | null;
  monthly_expense_estimate: number | null;
  goal_description: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
}

interface UserOnboardingInfoProps {
  userId: string;
}

export function UserOnboardingInfo({ userId }: UserOnboardingInfoProps) {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOnboarding = async () => {
      setIsLoading(true);
      try {
        const { data: onboarding, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching onboarding:', error);
        }
        setData(onboarding);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboarding();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center">
          <Plane className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Usuário não completou o formulário de onboarding
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Status do Onboarding</span>
        <Badge variant={data.has_completed_onboarding ? 'default' : 'secondary'}>
          {data.has_completed_onboarding ? '✅ Completo' : '⏳ Pendente'}
        </Badge>
      </div>

      {/* Destination */}
      {(data.destination_country || data.destination_city) && (
        <Card className="border-muted">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="font-semibold truncate">
                  {data.destination_city && `${data.destination_city}, `}
                  {data.destination_country || 'Não informado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Travel Date */}
      {data.travel_date && (
        <Card className="border-muted">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Data Prevista</p>
                <p className="font-semibold">
                  {format(new Date(data.travel_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Goal */}
      {data.financial_goal && (
        <Card className="border-muted">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Meta Financeira</p>
                <p className="font-semibold text-lg">
                  R$ {data.financial_goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Estimates */}
      {(data.monthly_income_estimate || data.monthly_expense_estimate) && (
        <div className="grid grid-cols-2 gap-2">
          {data.monthly_income_estimate && (
            <Card className="border-muted">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-income" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Renda Mensal Est.</p>
                    <p className="font-semibold text-sm text-income">
                      R$ {data.monthly_income_estimate.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {data.monthly_expense_estimate && (
            <Card className="border-muted">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-expense" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Gastos Mensais Est.</p>
                    <p className="font-semibold text-sm text-expense">
                      R$ {data.monthly_expense_estimate.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Goal Description */}
      {data.goal_description && (
        <Card className="border-muted">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Descrição do Objetivo</p>
                <p className="text-sm">{data.goal_description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Date */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Onboarding realizado em {format(new Date(data.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </div>
    </div>
  );
}
