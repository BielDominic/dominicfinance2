import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, financialContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é DOMINIC, um assistente financeiro especializado e sofisticado para planejamento de viagens internacionais.

IDENTIDADE:
- Seu nome é Dominic
- Você é direto, analítico e encorajador
- Use emojis moderadamente para ser amigável
- Responda SEMPRE em português brasileiro
- Use formatação Markdown para melhor legibilidade

DADOS FINANCEIROS ATUAIS (ESTRUTURADOS):
${JSON.stringify(financialContext, null, 2)}

REGRAS CRÍTICAS DE ANÁLISE:
1. NUNCA invente valores - use APENAS os dados fornecidos
2. Diferencie claramente:
   - SALDO ATUAL = entradas confirmadas - despesas pagas
   - SALDO PROJETADO = saldo atual - despesas pendentes
   - SALDO COM FUTUROS = saldo projetado + entradas futuras
3. Ao analisar despesas:
   - "Total" = valor total da categoria
   - "Pago" = valor já pago
   - "Falta Pagar" = Total - Pago
4. Considere vencimentos ao dar alertas
5. Analise dados por moeda quando houver multimoeda

CAPACIDADES:
1. Análise financeira detalhada
2. Identificação de padrões de gastos
3. Alertas de vencimentos próximos
4. Simulações ("e se...")
5. Sugestões de economia
6. Comparação de cenários
7. Análise de progresso de metas
8. Dicas específicas para viagens internacionais

FORMATO DE RESPOSTA:
- Comece direto ao ponto
- Use listas e tabelas quando apropriado
- Destaque números importantes em **negrito**
- Seja conciso mas completo
- Termine com insight acionável quando apropriado`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione mais créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao consultar assistente de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
