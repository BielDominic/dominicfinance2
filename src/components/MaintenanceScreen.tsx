import { AlertTriangle, Settings, Timer, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MaintenanceScreenProps {
  message?: string;
}

export function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-2 border-primary/20 shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Animated Icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center ring-4 ring-primary/20">
              <Settings className="h-12 w-12 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Sistema em Manutenção
            </h1>
            <p className="text-muted-foreground">
              {message || 'Estamos realizando melhorias no sistema. Tente novamente em alguns minutos.'}
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <Timer className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Previsão</p>
              <p className="text-xs text-muted-foreground">Em breve estaremos de volta</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <Mail className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Dúvidas?</p>
              <p className="text-xs text-muted-foreground">Entre em contato conosco</p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground pt-4 border-t border-border">
            Dominic Planejamento Financeiro
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
