const TABLE: Record<string, string> = {
  sponsors: "Perfil",
  sponsor_members: "Acesso",
  sponsor_files: "Arquivo",
  media_items: "Mídia",
  media_material_replies: "Resposta RBS ao material",
  survey_questions: "Perguntas da pesquisa",
  survey_results: "Resultado da pesquisa",
  contract_signers: "Signatário",
  sponsor_courtesies: "Cortesias",
};
const ACTION: Record<string, string> = { insert: "adicionou", update: "atualizou", delete: "removeu" };

export function auditDescription(entry?: { table_name?: string; action?: string; summary?: string | null }) {
  if (!entry || !entry.table_name || !entry.action) return "Ação registrada no sistema";
  if (entry.table_name === "sponsors" && entry.action === "insert") {
    return `cadastrou o patrocinador${entry.summary ? `: ${entry.summary}` : ""}`;
  }
  if (entry.table_name === "sponsor_files" && entry.summary?.startsWith("Plano comercial: ")) {
    const action = entry.action === "insert" ? "enviou" : ACTION[entry.action] ?? entry.action;
    return `${action} o plano comercial: ${entry.summary.slice("Plano comercial: ".length)}`;
  }
  return `${ACTION[entry.action] ?? entry.action} ${TABLE[entry.table_name] ?? entry.table_name}${entry.summary ? `: ${entry.summary}` : ""}`;
}
