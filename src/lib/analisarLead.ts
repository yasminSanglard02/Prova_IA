import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const MODELO = "gemini-3.8-flash";

export const analiseSchema = z.object({
  score: z.number().int().min(0).max(100),
  classificacao: z.enum(["quente", "morno", "frio"]),
  justificativa: z.string().min(1),
  resposta_sugerida: z.string().min(1),
});
export type Analise = z.infer<typeof analiseSchema>;

export type LeadEntrada = {
  nome: string;
  email: string;
  empresa?: string | null;
  segmento?: string | null;
  mensagem: string;
  origem?: string | null;
};

const SYSTEM_PROMPT = `Você é um especialista em vendas B2B para pequenas e médias empresas no Brasil.
Avalie o potencial de compra de um lead com base nos dados recebidos.

Critérios: intenção de compra explícita, urgência/prazo, orçamento mencionado,
poder de decisão, clareza da necessidade e adequação ao negócio.

Classificação: quente (score 70-100), morno (40-69), frio (0-39).

Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois e sem markdown:
{
  "score": <inteiro de 0 a 100>,
  "classificacao": "quente" | "morno" | "frio",
  "justificativa": "<2 a 3 frases explicando a nota>",
  "resposta_sugerida": "<mensagem de follow-up curta, cordial, em português, pronta para o vendedor enviar>"
}`;

function extrairJson(texto: string): unknown {
  const ini = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (ini === -1 || fim === -1) throw new Error("Resposta sem JSON");
  return JSON.parse(texto.slice(ini, fim + 1));
}

// Modo simulado: permite desenvolver o front sem chave da API.
function analisarMock(lead: LeadEntrada): Analise {
  const t = `${lead.mensagem} ${lead.empresa ?? ""}`.toLowerCase();
  let score = 30;
  if (/orçamento|orcamento|proposta|preço|preco|valor/.test(t)) score += 20;
  if (/urgente|esta semana|hoje|imediat|o quanto antes|\d+ dias/.test(t)) score += 20;
  if (/diretor|dono|sócio|socio|ceo|gerente/.test(t)) score += 15;
  if (/só curiosidade|apenas olhando|pesquisando|talvez|sem previsão/.test(t)) score -= 20;
  score = Math.max(0, Math.min(100, score));
  const classificacao = score >= 70 ? "quente" : score >= 40 ? "morno" : "frio";
  return {
    score,
    classificacao,
    justificativa: "Análise simulada (MOCK_IA) baseada em palavras-chave da mensagem.",
    resposta_sugerida: `Olá, ${lead.nome}! Obrigado pelo contato. Posso te ligar hoje para entender melhor sua necessidade?`,
  };
}

export async function analisarLead(
  lead: LeadEntrada,
): Promise<{ analise: Analise; modelo: string }> {
  if (process.env.MOCK_IA === "true" || !process.env.GEMINI_API_KEY) {
    return { analise: analisarMock(lead), modelo: "mock" };
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const dados = `Nome: ${lead.nome}
Empresa: ${lead.empresa || "não informada"}
Segmento: ${lead.segmento || "não informado"}
Origem: ${lead.origem || "site"}
Mensagem: ${lead.mensagem}`;

    let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const resp = await client.models.generateContent({
        model: MODELO,
        contents: dados,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          maxOutputTokens: 2000,
        },
      });
      if (!resp.text) throw new Error("Resposta vazia");
      return { analise: analiseSchema.parse(extrairJson(resp.text)), modelo: MODELO };
    } catch (e) {
      ultimoErro = e;
      // espera antes de tentar de novo (erro 503 costuma passar em segundos)
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 3000 * tentativa));
    }
  }

  // Gemini fora do ar: usa a análise simulada para o lead não ficar sem nota
  console.error("Gemini indisponível, usando mock:", String(ultimoErro));
  return { analise: analisarMock(lead), modelo: "mock (fallback)" };
}