import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Define available tools for data modification - pessoa will be dynamically populated
const createTools = (personNames: string[]) => [
  {
    type: "function",
    function: {
      name: "add_income_entry",
      description: "Adiciona uma nova entrada de receita. USE APENAS quando o usuário EXPLICITAMENTE solicitar adicionar uma entrada.",
      parameters: {
        type: "object",
        properties: {
          valor: { type: "number", description: "Valor da entrada em reais" },
          descricao: { type: "string", description: "Descrição da entrada" },
          pessoa: { type: "string", enum: personNames.length > 0 ? personNames : ["Pessoa"], description: "Pessoa responsável" },
          status: { type: "string", enum: ["Entrada", "Futuros"], description: "Status: Entrada (confirmada) ou Futuros (prevista)" },
          data: { type: "string", description: "Data no formato YYYY-MM-DD" },
        },
        required: ["valor", "descricao", "pessoa", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_expense",
      description: "Adiciona uma nova categoria de despesa. USE APENAS quando o usuário EXPLICITAMENTE solicitar adicionar uma despesa.",
      parameters: {
        type: "object",
        properties: {
          categoria: { type: "string", description: "Nome da categoria de despesa" },
          total: { type: "number", description: "Valor total da despesa" },
          pago: { type: "number", description: "Valor já pago" },
          pessoa: { type: "string", enum: personNames.length > 0 ? [...personNames, "Ambos"] : ["Ambos"], description: "Pessoa responsável" },
          vencimento: { type: "string", description: "Data de vencimento no formato YYYY-MM-DD" },
        },
        required: ["categoria", "total"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_income_entry",
      description: "Remove uma entrada de receita pelo ID ou descrição. USE APENAS quando o usuário EXPLICITAMENTE solicitar remover uma entrada.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da entrada (UUID)" },
          descricao: { type: "string", description: "Descrição parcial para encontrar a entrada" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_expense",
      description: "Remove uma categoria de despesa pelo ID ou nome. USE APENAS quando o usuário EXPLICITAMENTE solicitar remover uma despesa.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID da categoria (UUID)" },
          categoria: { type: "string", description: "Nome parcial da categoria para encontrar" },
        },
        required: [],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, financialContext, executeToolCall } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // If this is a tool execution request
    if (executeToolCall) {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Supabase credentials not configured");
      }

      // Get user from authorization header
      const authHeader = req.headers.get("authorization");
      let userId: string | null = null;
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const anonClient = createClient(SUPABASE_URL, authHeader.split(" ")[1]);
          const { data: userData } = await anonClient.auth.getUser();
          userId = userData?.user?.id || null;
        } catch (e) {
          console.error("Error getting user:", e);
        }
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { toolName, toolArgs } = executeToolCall;
      let result: any = { success: false, message: "Função não reconhecida" };

      // For data modifications, we need a user_id
      if (!userId && (toolName === "add_income_entry" || toolName === "add_expense")) {
        result = { success: false, message: "Usuário não autenticado. Faça login novamente." };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      switch (toolName) {
        case "add_income_entry": {
          const { data, error } = await supabase.from("income_entries").insert({
            valor: toolArgs.valor,
            descricao: toolArgs.descricao,
            pessoa: toolArgs.pessoa,
            status: toolArgs.status,
            data: toolArgs.data || new Date().toISOString().split('T')[0],
            user_id: userId,
          }).select().single();
          
          if (error) {
            result = { success: false, message: `Erro ao adicionar entrada: ${error.message}` };
          } else {
            result = { success: true, message: `Entrada "${toolArgs.descricao}" de R$ ${toolArgs.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionada com sucesso!`, data };
          }
          break;
        }

        case "add_expense": {
          const faltaPagar = (toolArgs.total || 0) - (toolArgs.pago || 0);
          const { data, error } = await supabase.from("expense_categories").insert({
            categoria: toolArgs.categoria,
            total: toolArgs.total,
            pago: toolArgs.pago || 0,
            falta_pagar: faltaPagar,
            pessoa: toolArgs.pessoa || "Ambos",
            vencimento: toolArgs.vencimento || null,
            user_id: userId,
          }).select().single();
          
          if (error) {
            result = { success: false, message: `Erro ao adicionar despesa: ${error.message}` };
          } else {
            result = { success: true, message: `Despesa "${toolArgs.categoria}" de R$ ${toolArgs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionada com sucesso!`, data };
          }
          break;
        }

        case "delete_income_entry": {
          let query = supabase.from("income_entries").delete();
          
          if (toolArgs.id) {
            query = query.eq("id", toolArgs.id);
          } else if (toolArgs.descricao) {
            query = query.ilike("descricao", `%${toolArgs.descricao}%`);
          } else {
            result = { success: false, message: "Forneça o ID ou descrição da entrada a remover" };
            break;
          }

          const { data, error, count } = await query.select();
          
          if (error) {
            result = { success: false, message: `Erro ao remover entrada: ${error.message}` };
          } else if (!data || data.length === 0) {
            result = { success: false, message: "Nenhuma entrada encontrada com esses critérios" };
          } else {
            result = { success: true, message: `${data.length} entrada(s) removida(s) com sucesso!` };
          }
          break;
        }

        case "delete_expense": {
          let query = supabase.from("expense_categories").delete();
          
          if (toolArgs.id) {
            query = query.eq("id", toolArgs.id);
          } else if (toolArgs.categoria) {
            query = query.ilike("categoria", `%${toolArgs.categoria}%`);
          } else {
            result = { success: false, message: "Forneça o ID ou nome da categoria a remover" };
            break;
          }

          const { data, error } = await query.select();
          
          if (error) {
            result = { success: false, message: `Erro ao remover despesa: ${error.message}` };
          } else if (!data || data.length === 0) {
            result = { success: false, message: "Nenhuma despesa encontrada com esses critérios" };
          } else {
            result = { success: true, message: `${data.length} despesa(s) removida(s) com sucesso!` };
          }
          break;
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch dashboard people for this user to create dynamic tools
    let personNames: string[] = [];
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Get user from auth header to find their people
      const authHeader = req.headers.get("authorization");
      let currentUserId: string | null = null;
      
      if (authHeader && authHeader.startsWith("Bearer ") && SUPABASE_ANON_KEY) {
        try {
          const userToken = authHeader.split(" ")[1];
          const tempClient = createClient(SUPABASE_URL, userToken);
          const { data: userData } = await tempClient.auth.getUser();
          currentUserId = userData?.user?.id || null;
        } catch (e) {
          console.error("Error getting user for people lookup:", e);
        }
      }

      // Fetch people for this user (RLS handles filtering)
      if (currentUserId) {
        const { data: peopleData } = await supabaseAdmin
          .from("dashboard_people")
          .select("name")
          .eq("user_id", currentUserId)
          .eq("is_active", true)
          .neq("name", "Ambos")
          .order("display_order", { ascending: true });
        
        if (peopleData && peopleData.length > 0) {
          personNames = peopleData.map((p: any) => p.name);
        }
      }
    }

    // Create tools with dynamic person names
    const tools = createTools(personNames);

    const systemPrompt = `Você é DOMINIC, um assistente financeiro especializado e sofisticado para planejamento de viagens internacionais.

IDENTIDADE:
- Seu nome é Dominic
- Você é direto, analítico e encorajador
- Use emojis moderadamente para ser amigável
- Responda SEMPRE em português brasileiro
- Use formatação Markdown para melhor legibilidade

DADOS FINANCEIROS ATUAIS (ESTRUTURADOS):
${JSON.stringify(financialContext, null, 2)}

PESSOAS CADASTRADAS NO SISTEMA:
${personNames.length > 0 ? personNames.join(", ") : "Nenhuma pessoa cadastrada ainda"}

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
6. Use APENAS as pessoas cadastradas no sistema (listadas acima) ao adicionar entradas ou despesas

CAPACIDADES:
1. Análise financeira detalhada
2. Identificação de padrões de gastos
3. Alertas de vencimentos próximos
4. Simulações ("e se...")
5. Sugestões de economia
6. Comparação de cenários
7. Análise de progresso de metas
8. Dicas específicas para viagens internacionais
9. **MODIFICAR DADOS**: Você pode adicionar ou remover entradas/despesas APENAS quando o usuário EXPLICITAMENTE solicitar

REGRAS PARA MODIFICAÇÃO DE DADOS:
- NUNCA modifique dados sem solicitação EXPLÍCITA do usuário
- Pergunte confirmação antes de fazer alterações
- Informe claramente o que será alterado
- Use APENAS as pessoas cadastradas no sistema
- Exemplos de solicitações válidas:
  - "Adicione uma entrada de R$ 500 de freelance"
  - "Remova a despesa de academia"
  - "Cadastre R$ 1000 como entrada futura"

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
        tools,
        tool_choice: "auto",
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
