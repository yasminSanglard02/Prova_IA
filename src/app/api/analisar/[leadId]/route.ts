import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { analises, leads } from "@/db/schema";
import { analisarLead } from "@/lib/analisarLead";

export async function POST(_req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  try {
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return NextResponse.json({ erro: "Lead não encontrado" }, { status: 404 });

    const { analise, modelo } = await analisarLead(lead);
    const [salva] = await db
      .insert(analises)
      .values({
        leadId,
        score: analise.score,
        classificacao: analise.classificacao,
        justificativa: analise.justificativa,
        respostaSugerida: analise.resposta_sugerida,
        modelo,
      })
      .returning();
    return NextResponse.json(salva);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Erro ao analisar o lead" }, { status: 500 });
  }
}
