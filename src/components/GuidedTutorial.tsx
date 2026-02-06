import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  TrendingUp,
  DollarSign,
  PiggyBank,
  BarChart3,
  Target,
  CheckCircle,
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Bem-vindo ao Dominic!',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades do seu planejamento financeiro pessoal.',
    icon: <Sparkles className="h-12 w-12 text-primary" />,
  },
  {
    title: 'Entradas de Renda',
    description: 'Registre todas as suas fontes de renda: salários, freelances, investimentos. Você pode categorizar por pessoa e adicionar notas.',
    icon: <TrendingUp className="h-12 w-12 text-income" />,
    highlight: 'entradas',
  },
  {
    title: 'Controle de Despesas',
    description: 'Organize seus gastos por categorias. Defina metas de orçamento e acompanhe quanto já foi pago e quanto falta.',
    icon: <DollarSign className="h-12 w-12 text-expense" />,
    highlight: 'despesas',
  },
  {
    title: 'Investimentos',
    description: 'Acompanhe sua carteira de investimentos. Registre diferentes tipos de aplicações e veja seu patrimônio crescer.',
    icon: <PiggyBank className="h-12 w-12 text-primary" />,
    highlight: 'investimentos',
  },
  {
    title: 'Gráficos e Análises',
    description: 'Visualize sua evolução financeira com gráficos interativos. Compare entradas vs despesas e identifique padrões.',
    icon: <BarChart3 className="h-12 w-12 text-primary" />,
    highlight: 'graficos',
  },
  {
    title: 'Metas Financeiras',
    description: 'Defina suas metas e acompanhe o progresso. A barra global mostra quanto falta para atingir seus objetivos.',
    icon: <Target className="h-12 w-12 text-primary" />,
    highlight: 'metas',
  },
  {
    title: 'Tudo Pronto!',
    description: 'Você está pronto para começar! Explore o dashboard e comece a organizar suas finanças. Qualquer dúvida, use o assistente de IA.',
    icon: <CheckCircle className="h-12 w-12 text-income" />,
  },
];

export function GuidedTutorial() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('app_config')
          .select('value')
          .eq('user_id', user.id)
          .eq('key', 'tutorial_completed')
          .maybeSingle();

        // Show tutorial if not completed
        if (!data || data.value !== 'true') {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkTutorialStatus();
  }, [user]);

  const completeTutorial = async () => {
    if (!user) return;

    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('app_config')
        .select('id')
        .eq('user_id', user.id)
        .eq('key', 'tutorial_completed')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('app_config')
          .update({ value: 'true' })
          .eq('user_id', user.id)
          .eq('key', 'tutorial_completed');
      } else {
        await supabase
          .from('app_config')
          .insert({ user_id: user.id, key: 'tutorial_completed', value: 'true' });
      }
    } catch (error) {
      console.error('Error saving tutorial status:', error);
    }

    setIsVisible(false);
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (isLoading || !isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-300">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {TUTORIAL_STEPS.length}
            </span>
            <Button variant="ghost" size="sm" onClick={skipTutorial} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" />
              Pular
            </Button>
          </div>

          {/* Progress */}
          <Progress value={progress} className="h-2" />

          {/* Content */}
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center">
              <div className="p-4 bg-muted/50 rounded-full">
                {step.icon}
              </div>
            </div>
            <h2 className="text-xl font-bold">{step.title}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={nextStep} className="gap-1">
              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
