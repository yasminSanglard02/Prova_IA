import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { leads } from "@/db/schema";

const leadSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("E-mail inválido"),
  empresa: z.string().trim().optional(),
  segmento: z.string().trim().optional(),
  mensagem: z.string().trim().min(10, "Descreva sua necessidade (mín. 10 caracteres)"),
  origem: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = leadSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ erro: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const [lead] = await db.insert(leads).values(parsed.data).returning();
    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erro: "Erro ao salvar o lead" }, { status: 500 });
  }
}
