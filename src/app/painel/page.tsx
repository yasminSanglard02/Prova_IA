import { desc } from "drizzle-orm";
import CopyButton from "@/components/CopyButton";
import { db } from "@/db";
import { analises, leads } from "@/db/schema";

export const dynamic = "force-dynamic";

const cores: Record<string, string> = {
  quente: "bg-red-100 text-red-800",
  morno: "bg-amber-100 text-amber-800",
  frio: "bg-sky-100 text-sky-800",
};

export default async function Painel() {
  const todosLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
  const todas = await db.select().from(analises).orderBy(desc(analises.createdAt));

  // análise mais recente de cada lead (lista já vem ordenada)
  const ultima = new Map<string, (typeof todas)[number]>();
  for (const a of todas) if (!ultima.has(a.leadId)) ultima.set(a.leadId, a);

  const itens = todosLeads
    .map((l) => ({ lead: l, analise: ultima.get(l.id) }))
    .sort((a, b) => (b.analise?.score ?? -1) - (a.analise?.score ?? -1));

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Painel de leads</h1>
      <p className="mt-1 text-slate-600">Ordenado por nota: comece pelo topo.</p>

      {itens.length === 0 && (
        <p className="mt-8 text-slate-600">Nenhum lead ainda. Envie um pelo formulário ou rode o seed.</p>
      )}

      <ul className="mt-6 space-y-4">
        {itens.map(({ lead, analise }) => (
          <li key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{lead.nome}</p>
                <p className="text-sm text-slate-600">
                  {[lead.empresa, lead.segmento, lead.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              {analise ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">{analise.score}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cores[analise.classificacao ?? "frio"]}`}>
                    {analise.classificacao}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">sem análise</span>
              )}
            </div>
            <p className="mt-3 text-sm text-slate-700">{lead.mensagem}</p>
            {analise && (
              <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-slate-600"><b>Por quê:</b> {analise.justificativa}</p>
                <p className="text-slate-800"><b>Resposta sugerida:</b> {analise.respostaSugerida}</p>
                <CopyButton texto={analise.respostaSugerida ?? ""} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
