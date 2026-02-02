import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign, Calendar, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';
import { FinancialSummary } from '@/types/financial';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface DecisionSimulatorProps {
  summary: FinancialSummary;
  exchangeRate: number;
}

export function DecisionSimulator({ summary, exchangeRate }: DecisionSimulatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Simulation states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [delayDays, setDelayDays] = useState('');
  const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());
  const [extraIncome, setExtraIncome] = useState('');

  // Calculate simulated results
  const simulatePaymentNow = () => {
    const amount = parseFloat(paymentAmount) || 0;
    return {
      newBalance: summary.saldoAtual - amount,
      newProjected: summary.saldoFinalPrevisto - amount,
      impact: -amount,
    };
  };

  const simulateExchangeChange = () => {
    const newRate = parseFloat(newExchangeRate) || exchangeRate;
    const currentEUR = summary.saldoFinalPrevisto / exchangeRate;
    const newEUR = summary.saldoFinalPrevisto / newRate;
    return {
      currentEUR,
      newEUR,
      difference: newEUR - currentEUR,
      percentChange: ((newRate - exchangeRate) / exchangeRate) * 100,
    };
  };

  const simulateExtraIncome = () => {
    const extra = parseFloat(extraIncome) || 0;
    return {
      newBalance: summary.saldoAtual + extra,
      newProjected: summary.saldoFinalPrevisto + extra,
      newEUR: (summary.saldoFinalPrevisto + extra) / exchangeRate,
    };
  };

  const getAIAnalysis = async (scenario: string, details: any) => {
    setIsSimulating(true);
    setAiAnalysis(null);

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: `Analise rapidamente este cenário financeiro e dê sua opinião em 2-3 frases:

Cenário: ${scenario}
Detalhes: ${JSON.stringify(details)}

Situação atual:
- Saldo atual: ${formatCurrency(summary.saldoAtual)}
- Saldo previsto: ${formatCurrency(summary.saldoFinalPrevisto)}
- Total a pagar: ${formatCurrency(summary.totalAPagar)}
- Taxa de câmbio: R$ ${exchangeRate.toFixed(2)}

Seja direto e prático.`,
            },
          ],
          financialContext: { summary },
        },
      });

      if (response.error) throw new Error(response.error.message);

      // Handle streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                result += content;
                setAiAnalysis(result);
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysis('Não foi possível obter análise da IA no momento.');
    }
    setIsSimulating(false);
  };

  const paymentSim = simulatePaymentNow();
  const exchangeSim = simulateExchangeChange();
  const incomeSim = simulateExtraIncome();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Simulador de Decisões
          </CardTitle>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment">Pagar Agora</TabsTrigger>
              <TabsTrigger value="exchange">Câmbio</TabsTrigger>
              <TabsTrigger value="income">Renda Extra</TabsTrigger>
            </TabsList>

            {/* Pay Now Simulation */}
            <TabsContent value="payment" className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Se eu pagar agora:</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                </div>

                {paymentAmount && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                      <p className={cn('font-mono font-bold', paymentSim.newBalance >= 0 ? 'text-income' : 'text-expense')}>
                        {formatCurrency(paymentSim.newBalance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo Previsto</p>
                      <p className={cn('font-mono font-bold', paymentSim.newProjected >= 0 ? 'text-income' : 'text-expense')}>
                        {formatCurrency(paymentSim.newProjected)}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => getAIAnalysis('Pagar antecipadamente', { amount: paymentAmount, impact: paymentSim })}
                  disabled={!paymentAmount || isSimulating}
                  className="w-full"
                  variant="outline"
                >
                  {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Análise da IA
                </Button>
              </div>
            </TabsContent>

            {/* Exchange Rate Simulation */}
            <TabsContent value="exchange" className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Se o Euro for para:</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-muted-foreground">1 EUR =</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExchangeRate}
                      onChange={(e) => setNewExchangeRate(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">BRL</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atual: R$ {exchangeRate.toFixed(2)} ({exchangeSim.percentChange >= 0 ? '+' : ''}{exchangeSim.percentChange.toFixed(1)}%)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo em EUR (atual)</p>
                    <p className="font-mono font-bold">€{exchangeSim.currentEUR.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo em EUR (novo)</p>
                    <p className={cn('font-mono font-bold', exchangeSim.difference >= 0 ? 'text-income' : 'text-expense')}>
                      €{exchangeSim.newEUR.toFixed(2)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={exchangeSim.difference >= 0 ? 'default' : 'destructive'}>
                      {exchangeSim.difference >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {exchangeSim.difference >= 0 ? '+' : ''}€{exchangeSim.difference.toFixed(2)}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={() => getAIAnalysis('Variação cambial', { current: exchangeRate, new: parseFloat(newExchangeRate), impact: exchangeSim })}
                  disabled={isSimulating}
                  className="w-full"
                  variant="outline"
                >
                  {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Análise da IA
                </Button>
              </div>
            </TabsContent>

            {/* Extra Income Simulation */}
            <TabsContent value="income" className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Se eu receber extra:</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={extraIncome}
                      onChange={(e) => setExtraIncome(e.target.value)}
                    />
                  </div>
                </div>

                {extraIncome && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Novo Saldo</p>
                      <p className="font-mono font-bold text-income">{formatCurrency(incomeSim.newBalance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Novo Previsto</p>
                      <p className="font-mono font-bold text-income">{formatCurrency(incomeSim.newProjected)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Em EUR</p>
                      <p className="font-mono font-bold text-primary">€{incomeSim.newEUR.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => getAIAnalysis('Renda extra', { amount: extraIncome, impact: incomeSim })}
                  disabled={!extraIncome || isSimulating}
                  className="w-full"
                  variant="outline"
                >
                  {isSimulating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Análise da IA
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* AI Analysis Result */}
          {aiAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Análise Dominic</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
