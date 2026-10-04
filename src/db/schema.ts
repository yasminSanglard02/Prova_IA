import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  empresa: text("empresa"),
  segmento: text("segmento"),
  mensagem: text("mensagem").notNull(),
  origem: text("origem").default("site"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Tabela separada: permite reanalisar um lead e manter o histórico da IA.
export const analises = pgTable(
  "analises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    score: integer("score"),
    classificacao: text("classificacao"),
    justificativa: text("justificativa"),
    respostaSugerida: text("resposta_sugerida"),
    modelo: text("modelo"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    check("score_range", sql`${t.score} BETWEEN 0 AND 100`),
    check("classificacao_valida", sql`${t.classificacao} IN ('quente','morno','frio')`),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type Analise = typeof analises.$inferSelect;
