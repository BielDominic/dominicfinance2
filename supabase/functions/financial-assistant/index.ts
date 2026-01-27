import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um assistente financeiro especializado em planejamento de viagens internacionais, especialmente para a Irlanda. 
    
Você receberá dados financeiros de um casal (Gabriel e Myrelle) que está planejando uma viagem para a Irlanda.

Suas responsabilidades:
1. Analisar a situação financeira atual
2. Identificar pontos de atenção (gastos excessivos, vencimentos próximos, metas não atingidas)
3. Sugerir otimizações e economias
4. Dar dicas práticas para a viagem à Irlanda
5. Motivar o casal a continuar economizando

Seja direto, prático e encorajador. Use emojis moderadamente para tornar a resposta mais amigável.
Responda SEMPRE em português brasileiro.

Formato da resposta:
- Use títulos claros com emojis
- Liste pontos importantes
- Destaque números relevantes
- Termine com uma dica motivacional`;

    const userPrompt = `Analise os seguintes dados financeiros e forneça insights e sugestões:

${JSON.stringify(financialData, null, 2)}

Por favor, forneça:
1. Uma análise geral da situação
2. Alertas sobre vencimentos próximos ou gastos excessivos
3. Sugestões de economia
4. Dicas específicas para a viagem à Irlanda
5. Uma mensagem motivacional`;

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
          { role: "user", content: userPrompt },
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
    console.error("Financial assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
