"use client";

import Link from "next/link";
import { useState } from "react";

type Resultado = { score: number; classificacao: string };

export default function Home() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState<Resultado | null>(null);

  async function enviar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const dados = Object.fromEntries(new FormData(form));
    setEnviando(true);
    setErro("");
    try {
      const r1 = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!r1.ok) throw new Error("Confira os campos e tente novamente.");
      const lead = await r1.json();
      const r2 = await fetch(`/api/analisar/${lead.id}`, { method: "POST" });
      if (!r2.ok) throw new Error("Lead salvo, mas a análise falhou. Reanalise pelo painel.");
      setOk(await r2.json());
      form.reset();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30";

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fale com a gente</h1>
      <p className="mt-2 text-slate-600">Conte o que você precisa e respondemos o quanto antes.</p>

      <form onSubmit={enviar} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Nome
          <input name="nome" required className={campo} />
        </label>
        <label className="block text-sm font-medium text-slate-700">E-mail
          <input name="email" type="email" required className={campo} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Empresa
            <input name="empresa" className={campo} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Segmento
            <input name="segmento" placeholder="Ex.: varejo, clínica" className={campo} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Mensagem
          <textarea name="mensagem" required rows={5} className={campo} />
        </label>
        <button
          disabled={enviando}
          className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {enviando ? "Enviando e analisando..." : "Enviar mensagem"}
        </button>
        {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
        {ok && (
          <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
            Mensagem enviada! Lead classificado como <b>{ok.classificacao}</b> (nota {ok.score}).
          </p>
        )}
      </form>

      <Link href="/painel" className="mt-8 inline-block text-sm text-teal-800 underline">Ir para o painel do vendedor</Link>
    </main>
  );
}
