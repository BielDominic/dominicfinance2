import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { IncomeEntry, ExpenseCategory, Investment, FinancialSummary } from '@/types/financial';
import { formatCurrency } from '@/utils/formatters';
import ReactMarkdown from 'react-markdown';

interface AIChatModalProps {
  incomeEntries: IncomeEntry[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  summary: FinancialSummary;
  metaEntradas: number;
  targetDate: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatModal({
  incomeEntries,
  expenseCategories,
  investments,
  summary,
  metaEntradas,
  targetDate,
}: AIChatModalProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Build financial context for the AI
  const buildFinancialContext = () => {
    const totalEntradas = incomeEntries.filter(e => e.status === 'Entrada').reduce((sum, e) => sum + e.valor, 0);
    const totalFuturos = incomeEntries.filter(e => e.status === 'Futuros').reduce((sum, e) => sum + e.valor, 0);
    const totalInvestimentos = investments.reduce((sum, i) => sum + i.valor, 0);
    
    const entriesInfo = incomeEntries.map(e => ({
      descricao: e.descricao,
      valor: e.valor,
      pessoa: e.pessoa,
      status: e.status,
      data: e.data,
    }));

    const expensesInfo = expenseCategories.map(c => ({
      categoria: c.categoria,
      total: c.total,
      pago: c.pago,
      faltaPagar: c.faltaPagar,
      vencimento: c.vencimento,
      pessoa: c.pessoa,
      metaOrcamento: c.metaOrcamento,
    }));

    const investmentsInfo = investments.map(i => ({
      categoria: i.categoria,
      valor: i.valor,
    }));

    return {
      resumo: {
        totalEntradas: formatCurrency(totalEntradas),
        totalFuturos: formatCurrency(totalFuturos),
        totalSaidas: formatCurrency(summary.totalSaidas),
        totalPago: formatCurrency(summary.totalPago),
        totalAPagar: formatCurrency(summary.totalAPagar),
        saldoAtual: formatCurrency(summary.saldoAtual),
        saldoFinalPrevisto: formatCurrency(summary.saldoFinalPrevisto),
        saldoComFuturos: formatCurrency(summary.saldoFinalComFuturos),
        totalInvestimentos: formatCurrency(totalInvestimentos),
        metaEntradas: formatCurrency(metaEntradas),
        progressoMeta: `${((totalEntradas / metaEntradas) * 100).toFixed(1)}%`,
      },
      dataAlvo: targetDate,
      entradas: entriesInfo,
      saidas: expensesInfo,
      investimentos: investmentsInfo,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const financialContext = buildFinancialContext();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          financialContext,
        }),
      });

      if (response.status === 429) {
        setError('Limite de requisições excedido. Tente novamente em alguns segundos.');
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        setError('Créditos de IA esgotados. A plataforma continua funcionando normalmente.');
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('Erro ao conectar com o assistente');
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === 'assistant') {
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error('AI Chat error:', err);
      setError('Erro ao conectar com o assistente. A plataforma continua funcionando normalmente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "Analise minha situação financeira atual",
    "Quais gastos posso reduzir?",
    "Como economizar para a viagem?",
    "Quais contas vencem em breve?",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="gap-2 shadow-lg bg-gradient-to-r from-ireland-green to-ireland-green/80 hover:from-ireland-green/90 hover:to-ireland-green/70 text-white px-6"
        >
          <Sparkles className="h-5 w-5" />
          Assistente IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] p-0 flex flex-col gap-0">
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-ireland-green/10 to-ireland-orange/10">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-ireland-green/20">
              <Bot className="h-5 w-5 text-ireland-green" />
            </div>
            <div>
              <span className="text-lg">Assistente Financeiro IA</span>
              <p className="text-xs text-muted-foreground font-normal">
                Powered by Lovable AI • Gemini Flash
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
              <div className="p-4 rounded-full bg-ireland-green/10">
                <Sparkles className="h-12 w-12 text-ireland-green" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Olá! Sou seu assistente financeiro</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Posso analisar seus gastos, sugerir economias e ajudar no planejamento da sua viagem para a Irlanda.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {quickPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 p-2 rounded-full bg-ireland-green/20 h-fit">
                      <Bot className="h-4 w-4 text-ireland-green" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-ireland-green text-white rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 p-2 rounded-full bg-ireland-orange/20 h-fit">
                      <User className="h-4 w-4 text-ireland-orange" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 p-2 rounded-full bg-ireland-green/20 h-fit">
                    <Bot className="h-4 w-4 text-ireland-green" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {error && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-ireland-green hover:bg-ireland-green/90 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Pressione Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
