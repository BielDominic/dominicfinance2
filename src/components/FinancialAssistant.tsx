import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IncomeEntry, ExpenseCategory, Investment, FinancialSummary } from '@/types/financial';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface FinancialAssistantProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  summary: FinancialSummary;
  metaEntradas: number;
}

export function FinancialAssistant({ 
  incomeEntries, 
  expenseCategories, 
  investments, 
  summary,
  metaEntradas 
}: FinancialAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const analyzeFinances = async () => {
    setIsLoading(true);
    setResponse('');

    const financialData = {
      resumo: {
        totalEntradas: summary.totalEntradas,
        totalFuturos: summary.totalFuturos,
        totalSaidas: summary.totalSaidas,
        totalPago: summary.totalPago,
        totalAPagar: summary.totalAPagar,
        saldoAtual: summary.saldoAtual,
        saldoFinalPrevisto: summary.saldoFinalPrevisto,
        saldoFinalComFuturos: summary.saldoFinalComFuturos,
        taxaCambio: summary.taxaCambio,
        saldoEmEuros: summary.saldoAposCambioEUR,
        metaEntradas: metaEntradas,
        progressoMeta: ((summary.totalEntradas / metaEntradas) * 100).toFixed(1) + '%',
      },
      entradas: incomeEntries.map(e => ({
        descricao: e.descricao,
        valor: e.valor,
        pessoa: e.pessoa,
        status: e.status,
        data: e.data,
      })),
      despesas: expenseCategories.map(c => ({
        categoria: c.categoria,
        total: c.total,
        pago: c.pago,
        faltaPagar: c.faltaPagar,
        vencimento: c.vencimento,
        pessoa: c.pessoa,
      })),
      investimentos: investments.map(i => ({
        categoria: i.categoria,
        valor: i.valor,
      })),
    };

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ financialData }),
      });

      if (resp.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
        setIsLoading(false);
        return;
      }

      if (resp.status === 402) {
        toast.error("Créditos de IA esgotados.");
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Falha ao iniciar análise");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setResponse(fullResponse);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao analisar finanças");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="financial-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-primary" />
                <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              Assistente Financeiro IA
            </h2>
            <p className="text-sm text-muted-foreground">
              Análise inteligente e sugestões personalizadas
            </p>
          </div>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          {!response && !isLoading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pronto para analisar suas finanças!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                O assistente vai analisar suas entradas, saídas, investimentos e metas para fornecer insights personalizados para sua viagem à Irlanda.
              </p>
              <Button 
                onClick={analyzeFinances}
                size="lg"
                className="gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Analisar Finanças
              </Button>
            </div>
          )}

          {isLoading && !response && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Analisando seus dados financeiros...</p>
              </div>
            </div>
          )}

          {response && (
            <div className="space-y-4">
              <div 
                ref={responseRef}
                className="bg-muted/30 rounded-lg p-4 sm:p-6 max-h-[500px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
              >
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={analyzeFinances}
                  variant="outline"
                  className="gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Analisar Novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
