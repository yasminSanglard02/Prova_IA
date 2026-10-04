import { db } from "../src/db";
import { analises, leads } from "../src/db/schema";
import { analisarLead } from "../src/lib/analisarLead";

const exemplos = [
  { nome: "Carla Mendes", email: "carla@padariaflor.com", empresa: "Padaria Flor", segmento: "alimentação", mensagem: "Sou dona da padaria e preciso de um sistema de pedidos até o fim da semana. Tenho orçamento de R$ 5 mil. Podem enviar proposta hoje?" },
  { nome: "Roberto Alves", email: "roberto@clinicavida.com", empresa: "Clínica Vida", segmento: "saúde", mensagem: "Sou sócio da clínica e queremos agendamento online. Urgente, vamos fechar com alguém nos próximos 5 dias. Qual o valor?" },
  { nome: "Juliana Prado", email: "ju@modabela.com", empresa: "Moda Bela", segmento: "varejo", mensagem: "Gostaria de um orçamento para loja virtual. Queremos lançar no próximo mês." },
  { nome: "Marcos Lima", email: "marcos@oficinalima.com", empresa: "Oficina Lima", segmento: "automotivo", mensagem: "Estou pesquisando opções de sistema para a oficina, talvez contrate no segundo semestre." },
  { nome: "Fernanda Costa", email: "fe@studiofit.com", empresa: "Studio Fit", segmento: "fitness", mensagem: "Vi o site de vocês e queria entender como funciona o serviço e os planos disponíveis." },
  { nome: "Paulo Reis", email: "paulo@gmail.com", mensagem: "Só curiosidade, estou apenas olhando o que vocês fazem." },
  { nome: "Ana Souza", email: "ana@escolaabc.com", empresa: "Escola ABC", segmento: "educação", mensagem: "Sou diretora e preciso de um sistema de matrículas. Orçamento aprovado, queremos começar em 15 dias." },
  { nome: "Diego Rocha", email: "diego@rocha.com", segmento: "serviços", mensagem: "Me mandem informações por e-mail quando tiverem tempo, sem previsão de compra." },
  { nome: "Luciana Ferraz", email: "lu@petshopamigo.com", empresa: "Pet Shop Amigo", segmento: "pet", mensagem: "Somos 3 funcionários e queremos organizar a agenda de banho e tosa. Podemos conversar esta semana?" },
  { nome: "Thiago Nunes", email: "thiago@nunesadv.com", empresa: "Nunes Advocacia", segmento: "jurídico", mensagem: "Sou sócio do escritório. Preciso de CRM para 8 advogados, urgente, tenho verba definida. Preço e prazo?" },
];

async function main() {
  for (const ex of exemplos) {
    const [lead] = await db.insert(leads).values({ ...ex, origem: "seed" }).returning();
    const { analise, modelo } = await analisarLead(lead);
    await db.insert(analises).values({
      leadId: lead.id,
      score: analise.score,
      classificacao: analise.classificacao,
      justificativa: analise.justificativa,
      respostaSugerida: analise.resposta_sugerida,
      modelo,
    });
    console.log(`${lead.nome}: ${analise.score} (${analise.classificacao})`);
  }
  console.log("Seed concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
