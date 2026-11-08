import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HardHat,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";
import { Panel } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { portalHead } from "@/lib/page-head";
import { sponsorQuery, useMe } from "@/lib/portal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/faq")({
  head: () => portalHead("Manual & FAQ", "Manual de operações e perguntas frequentes do Planeta Atlântida."),
  component: FaqPage,
});

type FaqCategory =
  | "todas"
  | "montagem"
  | "seguranca"
  | "estrutura"
  | "eletrica"
  | "ativacoes"
  | "festival"
  | "convidados";

interface FaqItem {
  id: string;
  category: FaqCategory;
  categoryLabel: string;
  question: string;
  answer: string;
  details?: string[];
  alert?: string;
  tags: string[];
  reference?: string;
}

const FAQ_CATEGORIES: { id: FaqCategory; label: string; icon: any } = [
  { id: "todas", label: "Todas as Dúvidas", icon: HelpCircle },
  { id: "montagem", label: "Montagem & Logística", icon: Calendar },
  { id: "seguranca", label: "Segurança & Credenciamento", icon: HardHat },
  { id: "estrutura", label: "Estruturas & PPCI", icon: Building2 },
  { id: "eletrica", label: "Elétrica & Geradores", icon: Zap },
  { id: "ativacoes", label: "Ativações, Brindes & Som", icon: Sparkles },
  { id: "festival", label: "Dias de Festival & Abastecimento", icon: Clock },
  { id: "convidados", label: "Cortesias & Público Geral", icon: Ticket },
];

const FAQ_ITEMS: FaqItem[] = [
  // 1. MONTAGEM & LOGÍSTICA
  {
    id: "acesso-portao-2",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Onde fica o acesso de montagem, desmontagem e entregas?",
    answer:
      "Todo o acesso de prestadores, caminhões e materiais nas fases de montagem, evento e desmontagem é realizado exclusivamente pelo Portão 02 da SABA Campestre.",
    details: [
      "Endereço: Rua Adão Serra Mariano, esquina com Av. Renato Sirotsky.",
      "Acesso controlado e setorizado por bolsões de carga e descarga.",
      "É terminantemente proibida a entrada de veículos particulares no parque.",
    ],
    tags: ["endereço", "portão 2", "saba", "acesso", "montagem", "local"],
    reference: "Manual de Operações - Cap. 5.1",
  },
  {
    id: "endereco-oficial-art",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Qual o endereço oficial para emissão de ART, RRT, Contratos e Notas Fiscais?",
    answer:
      "Para todos os documentos fiscais, laudos técnicos e anotações de responsabilidade técnica de engenharia e arquitetura, deve constar o endereço oficial:",
    details: [
      "Razão/Local: S.A. Beneficente e Amadora de Atlântida (SABA Campestre)",
      "Endereço: Av. Interbalneários, nº 413, Xangri-Lá / RS - CEP: 95588-000",
      "Vias físicas originais assinadas devem ser entregues no Grupo RBS (Av. Érico Veríssimo, 400, 4º andar, Porto Alegre - aos cuidados de Adriano Barboza ou Jaciane Martins).",
    ],
    tags: ["endereço oficial", "art", "rrt", "nota fiscal", "contrato", "crea"],
    reference: "Manual de Operações - Cap. 3.2",
  },
  {
    id: "horarios-expediente-montagem",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Quais são os horários de trabalho e entrada de caminhões na montagem?",
    answer:
      "A circulação de equipes e caminhões de carga obedece rigorosamente às leis de postura municipal de Xangri-Lá:",
    details: [
      "Expediente de trabalho: Manhã (8h às 12h) e Tarde (13h às 20h).",
      "Entrada de veículos de carga: 8h30 às 11h30 e 14h às 19h.",
      "Extensão noturna até 22h: apenas em datas expressamente liberadas pela produção (22 e 23 de janeiro).",
      "Fora dos horários estabelecidos, os acessos são fechados.",
    ],
    alert: "Após o descarregamento nos bolsões, os veículos devem ser imediatamente retirados do parque.",
    tags: ["horários", "expediente", "caminhão", "descarga", "noite"],
    reference: "Manual de Operações - Cap. 4.1",
  },
  {
    id: "prazo-entrega-espacos",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Qual é o prazo final e horário para entrega dos estandes 100% prontos?",
    answer:
      "Os espaços e estandes devem ser entregues completamente finalizados, limpos e sem ferramentas até o dia 25 de janeiro, às 18h.",
    details: [
      "25/01 (18h): Vistoria prévia do Comitê de Produção para ajustes finais.",
      "26/01 (12h): Vistoria Geral Oficial do Corpo de Bombeiros Militar (CBMRS). Durante a vistoria dos bombeiros, todas as obras e atividades são suspensas.",
      "28/01 (14h às 20h): Testes oficiais de Som, Luz e LED.",
      "29/01 (16h): Evento Teste com convidados e patrocinadores.",
    ],
    alert: "Não será permitida nenhuma atividade de montagem durante os dias de festival.",
    tags: ["prazo", "entrega", "vistoria", "bombeiros", "data final"],
    reference: "Manual de Operações - Cap. 4.1",
  },
  {
    id: "agendamento-carga-descarga",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Como agendar a entrada de materiais e veículos pesados?",
    answer:
      "É obrigatório o envio com antecedência mínima de 12 horas do Formulário Padrão de Entrada de Materiais (Anexo 3 do Manual).",
    details: [
      "Canal de envio: WhatsApp da Logística de Portão 2 (54 99630-7058).",
      "Informações obrigatórias: Nome da empresa, placa do veículo, lista nominal e CPF dos funcionários.",
      "Equipamentos pesados (empilhadeiras, guindastes, munck e plataformas elevatórias): exigem envio prévio do cronograma, Plano de Içamento de Cargas e ART específica com isolamento da área.",
    ],
    tags: ["agendamento", "carga", "descarga", "anexo 3", "guindaste", "munck"],
    reference: "Manual de Operações - Cap. 5.3 e 5.4",
  },
  {
    id: "cronograma-desmontagem",
    category: "montagem",
    categoryLabel: "Montagem & Logística",
    question: "Como funciona o cronograma de desmontagem após o encerramento do festival?",
    answer:
      "A desmontagem segue um plano escalonado para preservar a segurança das equipes:",
    details: [
      "Domingo (01/02): O parque entra em isolamento às 5h da manhã. Ocorre a saída de materiais críticos do evento (médico, tv, segurança). É proibida a circulação externa com ruído antes das 12h (cumprimento a TAC com MP/RS).",
      "Segunda-feira (02/02 a partir das 8h): Início da desmontagem geral dos estandes de patrocinadores e retirada de bebidas/cenografia.",
      "Prazo final de desmontagem: até 15 de fevereiro.",
    ],
    tags: ["desmontagem", "retirada", "domingo", "segunda", "pós-evento"],
    reference: "Manual de Operações - Cap. 4.1 e 4.3",
  },

  // 2. SEGURANÇA DO TRABALHO & CREDENCIAMENTO
  {
    id: "prazo-sistema-openstaff",
    category: "seguranca",
    categoryLabel: "Segurança & Credenciamento",
    question: "Qual o prazo limite para credenciar funcionários e prestadores no sistema Openstaff?",
    answer:
      "O sistema digital Openstaff fecha automaticamente e impreterivelmente às 23:59 do dia 26 de janeiro de 2026.",
    details: [
      "Cada agência e patrocinador é responsável por cadastrar todos os colaboradores.",
      "Após esse horário, o sistema não será reaberto sob nenhuma hipótese.",
      "Nos dias de festival, o patrocinador deve manter cópias físicas ou digitais de todos os documentos das equipes no estande.",
    ],
    alert: "Pessoas sem credenciamento prévio homologado não terão permissão de acesso ao parque.",
    tags: ["openstaff", "credenciamento", "prazo", "sistema", "crachá"],
    reference: "Manual de Operações - Cap. 6",
  },
  {
    id: "epis-obrigatorios-montagem",
    category: "seguranca",
    categoryLabel: "Segurança & Credenciamento",
    question: "Quais são os EPIs obrigatórios para acessar o parque durante as obras?",
    answer:
      "O acesso de qualquer colaborador à área de montagem e desmontagem só é liberado com o uso completo do kit essencial de EPI:",
    details: [
      "Capacete de proteção com jugular fixada (expressamente proibido o uso de boné por baixo do capacete).",
      "Sapato fechado ou bota de segurança (proibido o uso de chinelos, sandálias ou calçados abertos).",
      "Calça comprida e camiseta com manga (curta ou longa). Proibido regata ou bermuda.",
      "Óculos de proteção, luvas e protetores auriculares conforme a atividade específica executada.",
    ],
    tags: ["epi", "capacete", "bota", "vestimenta", "sapato", "segurança"],
    reference: "Manual de Operações - Cap. 7.1 e 7.7",
  },
  {
    id: "trabalho-altura-nr35",
    category: "seguranca",
    categoryLabel: "Segurança & Credenciamento",
    question: "Quais são as exigências para trabalhos em altura superior a 2 metros?",
    answer:
      "Atividades acima de 2,00m exigem cumprimento integral da NR-35 e apresentação documental prévia:",
    details: [
      "Cinto de segurança tipo paraquedista com talabartes de progressão duplos e mosquetões de 55mm com dupla trava.",
      "Conexão obrigatória em linha de vida ou ponto de ancoragem dimensionado com ART emitida por engenheiro.",
      "Certificado válido de treinamento de NR-35 (validade de 1 ano) e ASO com aptidão expressa para trabalho em altura.",
      "Procedimento Operacional e Permissão de Trabalho (PT) emitidos antes de iniciar o serviço.",
    ],
    alert: "Trabalhos sobre andaimes exigem guarda-corpo, rodapé de 20cm e piso completamente forrado e travado.",
    tags: ["altura", "nr-35", "cinto", "andaime", "ancoragem", "queda"],
    reference: "Manual de Operações - Cap. 7.3 e Anexo 1",
  },
  {
    id: "menores-de-idade-proibicao",
    category: "seguranca",
    categoryLabel: "Segurança & Credenciamento",
    question: "É permitida a contratação de menores de 18 anos para atuar no festival?",
    answer:
      "Não. É terminantemente proibida a contratação de menores de 18 anos para qualquer função ou atividade durante montagem, realização ou desmontagem do festival.",
    details: [
      "A restrição abrange funcionários diretos, terceirizados, promotores de marca e estagiários.",
      "O evento é fiscalizado pelo Ministério do Trabalho e Delegacia Regional do Trabalho (DRT).",
    ],
    tags: ["menores", "18 anos", "idade", "proibição", "trabalho"],
    reference: "Manual de Operações - Cap. 7.0",
  },
  {
    id: "integracao-seguranca-primeiro-dia",
    category: "seguranca",
    categoryLabel: "Segurança & Credenciamento",
    question: "Como funciona a integração de segurança antes de iniciar o trabalho?",
    answer:
      "Todo trabalhador deve passar por uma integração presencial de aproximadamente 30 minutos com a equipe de Segurança do Trabalho do Planeta Atlântida antes de iniciar as atividades.",
    details: [
      "O responsável pela empresa deve assinar o Termo de Responsabilidade (Anexo 2).",
      "Após a conferência dos documentos e da área de risco, é emitida a Permissão de Trabalho (PT).",
      "Treinamento prévio de NR-18 fornecido pela contratante é obrigatório (mínimo de 4 horas).",
    ],
    tags: ["integração", "permissão de trabalho", "pt", "anexo 2", "nr-18"],
    reference: "Manual de Operações - Cap. 7.5 e 7.6",
  },

  // 3. NORMAS CONSTRUTIVAS & PPCI
  {
    id: "especificacao-piso-modular",
    category: "estrutura",
    categoryLabel: "Estruturas & PPCI",
    question: "Quais são as especificações obrigatórias para o piso dos estandes?",
    answer:
      "É obrigatório o uso de piso de madeira modular padronizado:",
    details: [
      "Sistema de módulos de 1,00m x 1,00m em quadros de aço ASTM A36 galvanizado.",
      "Acabamento em chapas de madeirite antiderrapante.",
      "Sapatas ajustáveis para nivelamento perfeito com altura de até 0,30m.",
      "A frente do estande deve estar nivelada sem degraus em relação ao piso pavimentado da Via Planeta.",
    ],
    tags: ["piso", "modular", "madeira", "nivelamento", "sapatas"],
    reference: "Manual de Operações - Cap. 10.4",
  },
  {
    id: "alturas-maximas-estandes",
    category: "estrutura",
    categoryLabel: "Estruturas & PPCI",
    question: "Quais são as metragens e alturas máximas permitidas para estandes?",
    answer:
      "Cada setor possui diretrizes construtivas específicas para garantir a harmonia e segurança do festival:",
    details: [
      "Arena 150m² (Via Planeta): 10m frente x 15m fundo (+ 5m de backstage). Altura mínima lateral 4m; cumeeira/eixo máximo de 7m.",
      "Arena 16m²: altura máxima de 7m. / Arena 9m² e 6m²: altura máxima de 4m.",
      "Baixo Camarote (18m², 16m², 9m², 4m²): altura máxima de 3,5m.",
      "Alto Camarote (39,6m²): 6m frente x 6,6m fundo, altura máxima de 4m a partir do piso do camarote. Piso com capacidade de 500 kg/m² (NBR 6120). Proibido mezanino.",
      "Premium by Destemperados: altura máxima de 3m. Estandes devem ser autoportantes (proibido amarrar em estruturas aéreas do evento).",
    ],
    tags: ["altura", "metragem", "camarote", "arena", "mezanino", "dimensões"],
    reference: "Manual de Operações - Cap. 9 e 10",
  },
  {
    id: "bombeiro-civil-socorrista",
    category: "estrutura",
    categoryLabel: "Estruturas & PPCI",
    question: "É obrigatório contratar Bombeiro Civil para o meu estande?",
    answer:
      "Sim, dependendo do porte e do tipo de atividade desenvolvida na ativação:",
    details: [
      "Estandes de 150m² da Via Planeta: OBRIGATÓRIO prever 2 Bombeiros Socorristas durante os dois dias de festival (enquadramento F-6 pelo CBMRS).",
      "Ativações com brinquedos, esportes, altura, suspensão ou esforço físico: OBRIGATÓRIO 1 Bombeiro Civil dedicado.",
      "A contratação do profissional de bombeiro civil é de inteira responsabilidade do patrocinador.",
    ],
    alert: "Todos os desníveis e degraus do estande devem ser obrigatoriamente sinalizados com fitas fotoluminescentes.",
    tags: ["bombeiro civil", "socorrista", "150m2", "brinquedo", "ppci"],
    reference: "Manual de Operações - Cap. 13.0",
  },
  {
    id: "saidas-emergencia-portas",
    category: "estrutura",
    categoryLabel: "Estruturas & PPCI",
    question: "Quais são as exigências de portas, saídas de emergência e rampas?",
    answer:
      "Em conformidade com as Resoluções Técnicas do CBMRS e normas de acessibilidade NBR 9050:",
    details: [
      "Estandes de 150m² da Via Planeta devem conter no mínimo 2 saídas de emergência instaladas em paredes opostas afastadas.",
      "Cada porta de saída deve possuir no mínimo duas unidades de passagem (mínimo 1,10m de largura livre).",
      "Havendo desnível entre o estande e o solo, é obrigatória a instalação de rampa de acessibilidade em toda a extensão com inclinação máxima de 5º (8,33%).",
      "Guardas-corpos devem ter altura mínima de 1,10m (interno) e 1,30m (externo).",
    ],
    tags: ["saída de emergência", "porta", "rampa", "acessibilidade", "nbr 9050"],
    reference: "Manual de Operações - Cap. 13.1 a 13.3",
  },
  {
    id: "projeto-executivo-laudos",
    category: "estrutura",
    categoryLabel: "Estruturas & PPCI",
    question: "Quais documentos devem ser entregues para aprovação do projeto estrutural?",
    answer:
      "O projeto executivo completo deve ser entregue em formato DWG, PDF e 3D contemplando:",
    details: [
      "Plantas baixas, cortes, elevações e memorial descritivo dos materiais.",
      "Memória de cálculo estrutural e cálculo de resistência à ação dos ventos (NBR 6123).",
      "ART/RRT de projeto e montagem registradas no CREA/CAU do Rio Grande do Sul.",
      "Laudo CMAR (Anexo M3) comprovando que tecidos, lonas e revestimentos possuem propriedades retardantes de chama.",
    ],
    tags: ["dwg", "projeto executivo", "laudo", "vento", "crea-rs", "art"],
    reference: "Manual de Operações - Cap. 8.1 e 10.3",
  },

  // 4. ELÉTRICA & GERADORES
  {
    id: "padrao-eletrico-tomadas",
    category: "eletrica",
    categoryLabel: "Elétrica & Geradores",
    question: "Qual é a voltagem e o padrão de tomadas industriais do festival?",
    answer:
      "A rede elétrica do Planeta Atlântida opera com tensão trifásica e conexões industriais padronizadas:",
    details: [
      "Tensão: Trifásica de 380V/220V, configuração 3F + N + T (sistema de 5 fios).",
      "Tomadas: Padrão industrial IEC de 5 pinos vermelha (3F+N+T).",
      "O fornecimento dos plugues industriais correspondentes é de responsabilidade de cada patrocinador (caso não possua, o festival aluga com custo baseado em kVA).",
      "Cada estande deve prever disjuntores compatíveis e dispositivo DR com sensibilidade de 30mA.",
    ],
    tags: ["voltagem", "380v", "220v", "iec 5 pinos", "tomada", "dr"],
    reference: "Manual de Operações - Cap. 11.2",
  },
  {
    id: "custo-kva-energia",
    category: "eletrica",
    categoryLabel: "Elétrica & Geradores",
    question: "Qual o custo e como é cobrada a energia elétrica nos dias de festival?",
    answer:
      "Para os estandes alimentados pelas ilhas de geradores do festival, o custo é de R$ 275,00 por kVA contratado.",
    details: [
      "A potência é calculada com base na Tabela de Cargas apresentada no projeto elétrico aprovado.",
      "A equipe de engenharia do festival realiza medições térmicas e de corrente durante o evento. Havendo discordância, é faturado o maior valor entre projeto e medição.",
      "Pontos adicionais dependem de aprovação técnica e sofrem acréscimo de taxa sobre a carga.",
    ],
    tags: ["kva", "custo", "gerador", "preço", "medição", "energia"],
    reference: "Manual de Operações - Cap. 12.3",
  },
  {
    id: "uso-geradores-proprios",
    category: "eletrica",
    categoryLabel: "Elétrica & Geradores",
    question: "Posso utilizar gerador próprio no meu estande?",
    answer:
      "Apenas os estandes da Arena Via Planeta (150m²) estão autorizados a contratar geradores próprios externos, cumprindo normas estritas:",
    details: [
      "Tanques de combustível e geradores devem ficar a no mínimo 5 metros de distância de edificações e possuir bacia de contenção para 100% do diesel.",
      "Exigência da PATRAM: Não podem ficar direto sobre o solo. Devem estar sobre lona plástica e dispor de Kit de Mitigação de Vazamentos (estopa, serragem, pá e tambor hermético).",
      "O abastecimento deve ser feito dentro dos horários permitidos pelo festival.",
      "No Camarote e Premium é proibido gerador próprio; a energia vem exclusivamente da ilha compartilhada do festival.",
    ],
    tags: ["gerador próprio", "diesel", "bacia de contenção", "patram", "arena"],
    reference: "Manual de Operações - Cap. 12.4",
  },
  {
    id: "aterramento-estruturas-metalicas",
    category: "eletrica",
    categoryLabel: "Elétrica & Geradores",
    question: "O aterramento das estruturas do estande é responsabilidade do patrocinador?",
    answer:
      "Sim. É obrigatório que todas as estruturas metálicas autoportantes e instalações elétricas do estande sejam equipotencializadas e aterradas pelo patrocinador.",
    details: [
      "Recomenda-se o aterramento em triângulo com três hastes interligadas para escoamento de descargas atmosféricas.",
      "Caso o aterramento não seja executado até a entrega do estande, a produção executará o serviço compulsoriamente com taxa de R$ 300 por haste ou cobrança emergencial.",
    ],
    alert: "Em caso de risco elétrico, a engenharia do festival tem autorização para desligar cargas sem aviso prévio.",
    tags: ["aterramento", "raios", "haste", "multa", "spda"],
    reference: "Manual de Operações - Cap. 11.6 e 11.8",
  },

  // 5. ATIVAÇÕES, BRINDES & SOM
  {
    id: "venda-alimentos-bebidas",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Posso comercializar alimentos ou bebidas dentro do estande do patrocinador?",
    answer:
      "Não. É expressamente proibida a comercialização e venda de alimentos e bebidas nos estandes dos patrocinadores.",
    details: [
      "A alimentação comercial do público é exclusiva das operações oficiais das Praças de Alimentação do festival.",
      "Apenas é permitida a distribuição gratuita (degustação/sampling) previamente homologada com a organização.",
    ],
    tags: ["comercialização", "venda", "bebidas", "alimentos", "estande"],
    reference: "Manual de Operações - Cap. 8.0",
  },
  {
    id: "regras-distribuicao-brindes",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Quais são as regras para distribuição de brindes e sampling?",
    answer:
      "Todos os brindes e mecânicas de distribuição devem ser submetidos à aprovação prévia do Marketing da RBS:",
    details: [
      "Distribuição restrita: Os brindes devem ser entregues obrigatoriamente dentro dos limites do estande do patrocinador.",
      "Proibição de 'paredão': Não é permitida a formação de barreiras humanas de promotores na abertura dos portões obstruindo o público.",
      "Sampling itinerante: Para distribuir brindes em filas ou no fluxo do parque, é necessária contratação de cota específica de sampling.",
      "Bebidas: Proibidas latas ou garrafas de vidro. Apenas copos plásticos reutilizáveis. Proibida entrega de álcool para menores de 18 anos.",
    ],
    tags: ["brindes", "sampling", "copos", "promotores", "distribuição"],
    reference: "Manual de Operações - Cap. 8.3",
  },
  {
    id: "regras-drones-proibicao",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Posso operar drones para captação de imagens ou shows no festival?",
    answer:
      "É terminantemente proibido o uso de drones próprios durante os dias de festival. Qualquer captação aérea deve ser contratada pelo fornecedor homologado da RBS.",
    details: [
      "Multa por infração: R$ 50.000,00 aplicados à marca infratora.",
      "Em caso de risco ou lesão a terceiros, a multa é de R$ 100.000,00 mais sanções do Código Brasileiro de Aeronáutica e apreensão do equipamento.",
      "Nos dias de montagem: drones para registro de obras e timelapse só são liberados mediante homologação prévia da Anatel, ANAC, DECEA e Plano de Voo aprovado.",
    ],
    alert: "Shows de drones de marcas só podem ser executados pelo operador oficial homologado pelo Planeta.",
    tags: ["drone", "multa", "filmagem", "aéreo", "anac", "proibição"],
    reference: "Manual de Operações - Cap. 8.4",
  },
  {
    id: "som-djs-pocket-shows",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Posso colocar DJs, pocket shows ou música mecânica no meu estande?",
    answer:
      "Atividades sonoras são rigorosamente controladas para não interferir nos shows dos palcos principais:",
    details: [
      "Arena Via Planeta: Som projetado externamente é restrito a uma única cota master previamente comercializada pela RBS.",
      "Camarote: Atrações musicais ou DJs no estande devem ser autorizadas pela produção e só podem ocorrer durante o intervalo entre os shows do Palco Planeta (após os vídeos institucionais).",
      "O festival tem o direito de interromper e desligar o som de qualquer estande que ultrapasse os limites de decibéis permitidos.",
    ],
    tags: ["som", "dj", "pocket show", "música", "decibéis", "palco"],
    reference: "Manual de Operações - Cap. 8.8",
  },
  {
    id: "beneficios-patrocinador-master",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Quais são os benefícios de ativação exclusivos da Cota Master?",
    answer:
      "Os Patrocinadores Master contam com oportunidades exclusivas de impacto:",
    details: [
      "Ação de Telão no Palco Planeta: 1 vídeo/ação de até 1 minuto por noite nos telões principais (mediante aprovação prévia do roteiro).",
      "Tour de Convidados no Palco: 1 grupo de até 10 convidados selecionados pela marca por noite para assistir a 3 músicas na área VIP em frente ao palco, com acesso posterior ao camarote geral.",
      "Shuttle Meeting Point: Espaço de 2m x 2m coberto na saída das vans de transporte para ativação ou distribuição de kits.",
    ],
    tags: ["master", "telão", "palco planeta", "tour convidados", "shuttle"],
    reference: "Manual de Operações - Cap. 8.5, 8.6 e 9.7",
  },
  {
    id: "uso-marca-redes-sociais",
    category: "ativacoes",
    categoryLabel: "Ativações, Brindes & Som",
    question: "Posso postar imagens dos palcos e estruturas nas redes sociais durante a montagem?",
    answer:
      "Não. É proibido divulgar imagens das estruturas inacabadas, montagem de palcos e áreas exclusivas do festival antes da abertura oficial dos portões.",
    details: [
      "O uso do nome e logotipo oficial do 'Planeta Atlântida' em campanhas publicitárias, embalagens e ações comerciais deve ser submetido à aprovação do Marketing do Grupo RBS.",
      "Durante o festival, a cobertura em tempo real das ativações nos estandes é amplamente incentivada.",
    ],
    tags: ["redes sociais", "fotos", "marca", "logo", "marketing rbs"],
    reference: "Manual de Operações - Cap. 8.4",
  },

  // 6. DIAS DE FESTIVAL & ABASTECIMENTO
  {
    id: "abastecimento-dias-evento",
    category: "festival",
    categoryLabel: "Dias de Festival & Abastecimento",
    question: "Em quais horários posso abastecer e limpar o meu estande na sexta e sábado?",
    answer:
      "O abastecimento e limpeza de estandes nos dois dias de show (30 e 31 de janeiro) ocorrem estritamente pela manhã:",
    details: [
      "Horário permitido para abastecimento: exclusivamente das 7h às 12h.",
      "Horário limite para entrada de caminhões de serviço: até às 9h da manhã.",
      "Saída obrigatória de veículos: todos os veículos de abastecimento devem deixar o parque até às 11h.",
      "Varredura de segurança do evento: das 12h às 13h.",
    ],
    alert: "No período da tarde e durante o festival é terminantemente proibida a circulação de veículos de carga no parque.",
    tags: ["abastecimento", "reposição", "horário", "limpeza", "caminhão"],
    reference: "Manual de Operações - Cap. 7.0 e 8.9",
  },
  {
    id: "horario-abertura-portoes",
    category: "festival",
    categoryLabel: "Dias de Festival & Abastecimento",
    question: "A que horas os portões abrem e até que horas o estande deve operar?",
    answer:
      "A operação do estande deve acompanhar a programação oficial do festival:",
    details: [
      "Abertura dos portões para o público: 16h em ambos os dias.",
      "Início dos shows nos palcos: a partir das 17h.",
      "Horário de funcionamento dos estandes: das 16h até o encerramento do evento (aproximadamente 4h da manhã).",
      "Cada patrocinador é responsável pelo fechamento e desligamento de equipamentos do seu estande após o último show.",
    ],
    tags: ["abertura dos portões", "16h", "shows", "fechamento", "madrugada"],
    reference: "Manual de Operações - Cap. 7.0 e 8.7",
  },
  {
    id: "seguranca-privada-estande",
    category: "festival",
    categoryLabel: "Dias de Festival & Abastecimento",
    question: "Posso contratar empresa de segurança privada para o meu estande?",
    answer:
      "Sim, porém é obrigatório utilizar empresas credenciadas e homologadas na Polícia Federal:",
    details: [
      "Apresentação da documentação da empresa de segurança com antecedência mínima de 30 dias.",
      "Todos os vigilantes contratados devem possuir Certificado do Curso de Capacitação em Grandes Eventos.",
      "Apresentação da comprovação no Posto da Polícia Federal no Portão 02 do festival.",
      "Vigilantes não credenciados ou sem comprovação serão barrados e impedidos de atuar.",
    ],
    tags: ["segurança", "polícia federal", "vigilante", "grandes eventos"],
    reference: "Manual de Operações - Cap. 8.10",
  },

  // 7. CORTESIAS & PÚBLICO GERAL (CONVIDADOS)
  {
    id: "classificacao-etaria-publico",
    category: "convidados",
    categoryLabel: "Cortesias & Público Geral",
    question: "Qual a classificação etária para convidados e contemplados com cortesias?",
    answer:
      "As regras de acesso ao festival são regulamentadas pelo Juizado da Infância e Juventude:",
    details: [
      "Arena e Setores Comuns: Classificação indicativa de 14 anos (menores de 14 anos não entram, mesmo acompanhados por pais ou responsáveis).",
      "Camarotes, Espaço Premium e Áreas Open Bar: Classificação estrita de 18 anos completos (proibida a entrada de menores de 18 anos, mesmo acompanhados).",
      "Apresentação de documento oficial com foto (RG, CNH, Passaporte ou CNH Digital) é indispensável para entrar.",
    ],
    tags: ["idade", "classificação", "menores", "14 anos", "18 anos", "open bar"],
    reference: "Regras Gerais do Festival Planeta Atlântida",
  },
  {
    id: "como-funciona-cashless",
    category: "convidados",
    categoryLabel: "Cortesias & Público Geral",
    question: "Como funciona a Pulseira Cashless para consumo dentro do festival?",
    answer:
      "A pulseira do festival é tanto o seu ingresso de acesso quanto a carteira digital oficial do evento:",
    details: [
      "Não é aceito dinheiro em espécie nem cartão direto nos balcões de bares e lanchonetes.",
      "A carga de créditos pode ser realizada antecipadamente pelo site oficial ou em caixas móveis e totens no festival.",
      "Saldos remanescentes não utilizados após o festival podem ser estornados seguindo o regulamento divulgado no site oficial.",
    ],
    tags: ["cashless", "pulseira", "consumo", "saldo", "estorno", "bebidas"],
    reference: "Site Oficial do Festival (planetaatlantida.com.br)",
  },
  {
    id: "itens-permitidos-proibidos-publico",
    category: "convidados",
    categoryLabel: "Cortesias & Público Geral",
    question: "O que os convidados do patrocinador PODEM e NÃO PODEM levar ao festival?",
    answer:
      "Oriente seus convidados para evitar retenção de pertences na revista dos portões:",
    details: [
      "ITENS PERMITIDOS: Até 5 alimentos lacrados de fábrica (barras de cereal, biscoitos, chicletes), capa de chuva, protetor solar, repelente, agasalho, canga/toalha, carregador portátil/powerbank, óculos escuros e leque sem ponta.",
      "ITENS PROIBIDOS: Cigarros eletrônicos (vapes, pods), garrafas ou copos de vidro e térmicos, latas, bebidas alcoólicas, capacetes, guarda-chuvas, cadeiras, bastões de selfie, correntes pesadas, armas e máquinas fotográficas profissionais com lentes intercambiáveis.",
    ],
    alert: "Cigarros eletrônicos e vapes são proibidos por regulamentação da Anvisa e serão retidos na portaria.",
    tags: ["o que levar", "permitido", "proibido", "vape", "mochila", "revista"],
    reference: "Site Oficial do Festival (planetaatlantida.com.br)",
  },
];

const CONTACT_LIST = [
  { role: "Atendimento aos Patrocinadores", name: "Adriano Barboza", phone: "(51) 98465-6868", num: "5551984656868" },
  { role: "Implantação e Montagens", name: "Eng. Régis Flores", phone: "(51) 98561-6675", num: "5551985616675" },
  { role: "Engenharia Elétrica", name: "Eng. Lucas Endres", phone: "(51) 99599-2051", num: "5551995992051" },
  { role: "Credenciamento (Openstaff)", name: "Tatiana Zandavalli", phone: "(54) 99191-7001", num: "5554991917001" },
  { role: "Coordenação Arena & Via Planeta", name: "Fiorella Agrifoglio", phone: "(51) 98429-9902", num: "5551984299902" },
  { role: "Camarotes e Espaço Premium", name: "Doda Bedin", phone: "(51) 98152-0254", num: "5551981520254" },
  { role: "Segurança do Trabalho", name: "Robson Oliveira", phone: "(51) 99163-5209", num: "5551991635209" },
  { role: "PPCI & Bombeiros", name: "Thiago Vianna / Jéssica", phone: "(51) 99702-7887", num: "5551997027887" },
  { role: "Agendamento Carga e Descarga Portão 2", name: "Logística Portão 2 (WhatsApp)", phone: "(54) 99630-7058", num: "5554996307058" },
];

function FaqPage() {
  const { id } = Route.useParams();
  const me = useMe();
  const sponsor = useQuery(sponsorQuery(id));

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("todas");

  // Filtering FAQ
  const filteredFaq = useMemo(() => {
    const s = search.toLowerCase().trim();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === "todas" || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!s) return true;

      return (
        item.question.toLowerCase().includes(s) ||
        item.answer.toLowerCase().includes(s) ||
        item.categoryLabel.toLowerCase().includes(s) ||
        (item.details && item.details.some((d) => d.toLowerCase().includes(s))) ||
        item.tags.some((t) => t.toLowerCase().includes(s))
      );
    });
  }, [search, selectedCategory]);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  }

  return (
    <TabGate
      id={id}
      tab="faq"
      title="Manual & Perguntas Frequentes"
      intro="Guia de operações oficial, normas técnicas, regras de ativação e perguntas frequentes do Planeta Atlântida 2026."
    >
      {sponsor.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Banner / Fast Info */}
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" /> Guia Oficial do Patrocinador
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    · Planeta Atlântida 2026
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Manual de Operações & FAQ B2B
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
                  Encontre orientações imediatas sobre prazos de montagem, credenciamento no Openstaff, normas elétricas, diretrizes de PPCI, regras de ativação e informações de apoio aos seus convidados.
                </p>
              </div>

              {/* Botão de contato direto */}
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                >
                  <a
                    href="https://wa.me/5551984656868?text=Ol%C3%A1%2C%20sou%20patrocinador%20do%20Planeta%20Atl%C3%A2ntida%20e%20preciso%20de%20suporte."
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Falar com Atendimento RBS
                  </a>
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  Adriano Barboza · (51) 98465-6868
                </p>
              </div>
            </div>
          </div>

          {/* Quick Access Documents & Addresses */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Panel className="p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Acesso de Montagem & Cargas
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Portão 02 da SABA Campestre</strong><br />
                  Rua Adão Serra Mariano, esquina Av. Renato Sirotsky - Xangri-Lá / RS.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-[11px] h-7 self-start"
                onClick={() =>
                  copyToClipboard(
                    "Portão 02 SABA Campestre: Rua Adão Serra Mariano, esquina Av. Renato Sirotsky, Xangri-Lá - RS",
                    "Endereço do Portão 2"
                  )
                }
              >
                Copiar endereço
              </Button>
            </Panel>

            <Panel className="p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  Endereço Oficial (ART/Contratos)
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>SABA Campestre</strong><br />
                  Av. Interbalneários, nº 413, Xangri-Lá / RS - CEP: 95588-000.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-[11px] h-7 self-start"
                onClick={() =>
                  copyToClipboard(
                    "Av. Interbalneários, nº 413, Xangri-Lá / RS - CEP: 95588-000",
                    "Endereço oficial para ART"
                  )
                }
              >
                Copiar dados fiscais
              </Button>
            </Panel>

            <Panel className="p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Canal de Ética e Integridade
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Código de conduta corporativa e denúncias confidenciais do Grupo RBS.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="mt-3 text-[11px] h-7 self-start"
              >
                <a
                  href="https://www.contatoseguro.com.br/gruporbs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Acessar canal de ética <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </Panel>
          </div>

          {/* Search Bar & Category Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Pesquise por termo ou dúvida (ex: drone, kva, credenciamento, horário, bombeiros, pulseira)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 text-sm bg-card"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FAQ_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="h-8 text-xs shrink-0 gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <Panel
            flush
            title={
              <div className="flex items-center justify-between gap-3">
                <span>Perguntas Frequentes ({filteredFaq.length})</span>
                {selectedCategory !== "todas" && (
                  <Badge variant="outline" className="text-xs font-normal">
                    Filtro: {FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                  </Badge>
                )}
              </div>
            }
            description="Clique sobre a pergunta para expandir a resposta técnica detalhada."
          >
            {filteredFaq.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                Nenhuma resposta encontrada para "{search}". Tente buscar por outros termos ou selecione outra categoria.
              </div>
            ) : (
              <Accordion type="multiple" className="w-full divide-y border-t">
                {filteredFaq.map((item) => (
                  <AccordionItem key={item.id} value={item.id} className="px-5 border-none">
                    <AccordionTrigger className="hover:no-underline py-4 text-left">
                      <div className="space-y-1 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                            {item.categoryLabel}
                          </Badge>
                          {item.reference && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {item.reference}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-snug">
                          {item.question}
                        </h3>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-0 pb-4 text-xs leading-relaxed text-muted-foreground space-y-3">
                      <p className="text-foreground font-normal">{item.answer}</p>

                      {item.details && item.details.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1.5">
                          {item.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}

                      {item.alert && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-destructive flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{item.alert}</span>
                        </div>
                      )}

                      <div className="pt-1 flex flex-wrap items-center gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </Panel>

          {/* Key Contacts Table Panel */}
          <Panel
            flush
            title="Contatos Chave da Produção RBS"
            description="Lista de profissionais responsáveis pelas áreas operacionais do festival."
          >
            <div className="divide-y border-t">
              {CONTACT_LIST.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{c.role}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {c.name} · <span className="font-mono">{c.phone}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard(c.phone, c.name)}
                    >
                      Copiar
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <a
                        href={`https://wa.me/${c.num}?text=Ol%C3%A1%20${encodeURIComponent(c.name)}%2C%20sou%20patrocinador%20do%20Planeta%20Atl%C3%A2ntida.`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="mr-1 h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </TabGate>
  );
}
