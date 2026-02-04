import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useOnboarding, OnboardingData } from '@/hooks/useOnboarding';
import { toast } from 'sonner';
import { Plane, Target, Calendar, DollarSign, ArrowRight, ArrowLeft, Sparkles, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo', icon: Sparkles },
  { id: 'destination', title: 'Destino', icon: MapPin },
  { id: 'date', title: 'Data', icon: Calendar },
  { id: 'goals', title: 'Metas', icon: Target },
  { id: 'finish', title: 'Finalizar', icon: Plane },
];

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { completeOnboarding, skipOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    destination_country: '',
    destination_city: '',
    travel_date: '',
    financial_goal: null,
    monthly_income_estimate: null,
    monthly_expense_estimate: null,
    goal_description: '',
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    const { error } = await skipOnboarding();
    setIsSubmitting(false);

    if (error) {
      toast.error('Erro ao pular configuração');
      return;
    }

    toast.success('Configuração pulada. Você pode configurar depois!');
    onComplete();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const { error } = await completeOnboarding(formData);
    setIsSubmitting(false);

    if (error) {
      toast.error('Erro ao salvar configuração');
      return;
    }

    toast.success('Dashboard configurado com sucesso!');
    onComplete();
  };

  const updateFormData = (field: keyof OnboardingData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Bem-vindo ao Dominic Finance!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Vamos configurar seu dashboard financeiro em poucos passos para 
                ajudá-lo a alcançar seus objetivos.
              </p>
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={handleNext} className="gap-2">
                Começar Configuração
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                Pular e configurar depois
              </Button>
            </div>
          </div>
        );

      case 'destination':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Qual é seu destino?</h2>
              <p className="text-muted-foreground text-sm">
                Informe o local do seu objetivo (viagem, intercâmbio, mudança)
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">País de destino</Label>
                <Input
                  id="country"
                  placeholder="Ex: Irlanda, Portugal, Canadá..."
                  value={formData.destination_country || ''}
                  onChange={(e) => updateFormData('destination_country', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade (opcional)</Label>
                <Input
                  id="city"
                  placeholder="Ex: Dublin, Lisboa, Toronto..."
                  value={formData.destination_city || ''}
                  onChange={(e) => updateFormData('destination_city', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Quando é a data prevista?</h2>
              <p className="text-muted-foreground text-sm">
                Configure a data alvo para o contador regressivo
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="travel_date">Data da viagem/objetivo</Label>
                <Input
                  id="travel_date"
                  type="date"
                  value={formData.travel_date || ''}
                  onChange={(e) => updateFormData('travel_date', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Defina suas metas</h2>
              <p className="text-muted-foreground text-sm">
                Quanto você precisa economizar para seu objetivo?
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="financial_goal">Meta financeira total (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="financial_goal"
                    type="number"
                    placeholder="Ex: 50000"
                    className="pl-9"
                    value={formData.financial_goal || ''}
                    onChange={(e) => updateFormData('financial_goal', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_income">Renda mensal estimada (R$)</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="Ex: 5000"
                  value={formData.monthly_income_estimate || ''}
                  onChange={(e) => updateFormData('monthly_income_estimate', e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_expense">Gastos mensais estimados (R$)</Label>
                <Input
                  id="monthly_expense"
                  type="number"
                  placeholder="Ex: 3000"
                  value={formData.monthly_expense_estimate || ''}
                  onChange={(e) => updateFormData('monthly_expense_estimate', e.target.value ? Number(e.target.value) : null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal_description">Descrição do objetivo (opcional)</Label>
                <Textarea
                  id="goal_description"
                  placeholder="Descreva seu objetivo em poucas palavras..."
                  value={formData.goal_description || ''}
                  onChange={(e) => updateFormData('goal_description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 'finish':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Tudo pronto!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Seu dashboard será configurado com base nas informações fornecidas. 
                Você pode alterar tudo a qualquer momento.
              </p>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 text-left max-w-sm mx-auto space-y-2">
              {formData.destination_country && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.destination_city ? `${formData.destination_city}, ` : ''}{formData.destination_country}</span>
                </div>
              )}
              {formData.travel_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(formData.travel_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
              {formData.financial_goal && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Meta: R$ {formData.financial_goal.toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>

            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting}
              className="gap-2"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Configurando...
                </>
              ) : (
                <>
                  Finalizar Configuração
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Passo {currentStep + 1} de {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : index < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          {/* Navigation buttons */}
          {currentStep > 0 && currentStep < STEPS.length - 1 && (
            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleNext} className="gap-2">
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep === STEPS.length - 1 && (
            <div className="flex justify-center">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar e editar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
