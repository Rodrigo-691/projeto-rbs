import type { Quota } from "@/lib/portal";

export interface DbSponsorRef {
  id?: string;
  name: string;
  cnpj?: string | null;
}

export interface ParsedSponsorItem {
  rowNumber: number;
  name: string;
  cnpj: string;
  quota: Quota;
  segment?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isDuplicate?: boolean;
  duplicateReason?: string;
  duplicateType?: "database" | "sheet";
}

export interface ParsedSponsorError {
  rowNumber: number;
  name: string;
  cnpj: string;
  reason: string;
}

export interface ParseSponsorSheetResult {
  valid: ParsedSponsorItem[];
  invalid: ParsedSponsorError[];
  dbDuplicatesCount: number;
  sheetDuplicatesCount: number;
  totalDuplicatesCount: number;
  missingHeaders?: string[];
}

export const digits = (s: string) => s.replace(/\D/g, "");

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function parseQuota(raw: string): Quota | null {
  const clean = norm(raw).replace(/[\s\-_]/g, "");
  if (clean === "master") return "master";
  if (clean === "subcotag" || clean === "subcotagrande") return "subcota_g";
  if (clean === "subcota") return "subcota";
  return null;
}

export function parseSponsorSheet(
  rows: unknown[][],
  dbSponsors: readonly DbSponsorRef[] = []
): ParseSponsorSheetResult {
  const valid: ParsedSponsorItem[] = [];
  const invalid: ParsedSponsorError[] = [];

  if (!rows || rows.length < 2) {
    return {
      valid,
      invalid: [{ rowNumber: 1, name: "", cnpj: "", reason: "Planilha vazia ou sem linhas de dados." }],
      dbDuplicatesCount: 0,
      sheetDuplicatesCount: 0,
      totalDuplicatesCount: 0,
    };
  }

  const headerRow = (rows[0] ?? []).map((h) => norm(String(h ?? "")));
  const findCol = (terms: string[]) => headerRow.findIndex((h) => terms.some((t) => h.includes(t)));

  const colNome = findCol(["nome", "marca", "razao"]);
  const colCnpj = findCol(["cnpj", "documento"]);
  const colCota = findCol(["cota", "categoria"]);
  const colSegmento = findCol(["segmento", "ramo", "setor"]);
  const colContato = findCol(["focal", "contato", "responsavel"]);
  const colTelefone = findCol(["telefone", "whatsapp", "celular", "fone"]);

  const missing: string[] = [];
  if (colNome === -1) missing.push("Nome");
  if (colCnpj === -1) missing.push("CNPJ");
  if (colCota === -1) missing.push("Cota");

  if (missing.length > 0) {
    return {
      valid,
      invalid: [{ rowNumber: 1, name: "", cnpj: "", reason: `Colunas obrigatórias ausentes: ${missing.join(", ")}` }],
      dbDuplicatesCount: 0,
      sheetDuplicatesCount: 0,
      totalDuplicatesCount: 0,
      missingHeaders: missing,
    };
  }

  // Mapas do banco de dados
  const dbByCnpj = new Map<string, string>();
  const dbByName = new Map<string, string>();
  for (const s of dbSponsors) {
    if (s.cnpj) {
      const d = digits(s.cnpj);
      if (d.length >= 8) dbByCnpj.set(d, s.name);
    }
    if (s.name) {
      dbByName.set(norm(s.name), s.name);
    }
  }

  // Mapas internos da planilha
  const sheetByCnpj = new Map<string, number>();
  const sheetByName = new Map<string, number>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;

    const nome = row[colNome] ? String(row[colNome]).trim() : "";
    const cnpj = row[colCnpj] ? String(row[colCnpj]).trim() : "";
    const cotaRaw = row[colCota] ? String(row[colCota]).trim() : "";
    const segmento = colSegmento !== -1 && row[colSegmento] ? String(row[colSegmento]).trim() : null;
    const contato = colContato !== -1 && row[colContato] ? String(row[colContato]).trim() : null;
    const telefone = colTelefone !== -1 && row[colTelefone] ? String(row[colTelefone]).trim() : null;

    const lineErrors: string[] = [];
    if (!nome) lineErrors.push("Campo obrigatório 'Nome' ausente.");
    if (!cnpj) lineErrors.push("Campo obrigatório 'CNPJ' ausente.");
    const quota = parseQuota(cotaRaw);
    if (!cotaRaw) {
      lineErrors.push("Campo obrigatório 'Cota' ausente.");
    } else if (!quota) {
      lineErrors.push(`Cota '${cotaRaw}' inválida. Use Master, Subcota G ou Subcota.`);
    }

    if (lineErrors.length > 0) {
      invalid.push({
        rowNumber: i + 1,
        name: nome || "(Não informado)",
        cnpj: cnpj || "(Não informado)",
        reason: lineErrors.join(" "),
      });
    } else if (quota) {
      const cleanCnpjDigits = digits(cnpj);
      const cleanNameNorm = norm(nome);

      let isDuplicate = false;
      let duplicateReason = "";
      let duplicateType: "database" | "sheet" | undefined = undefined;

      // 1. Verificação contra o banco de dados
      if (cleanCnpjDigits.length >= 8 && dbByCnpj.has(cleanCnpjDigits)) {
        const existingName = dbByCnpj.get(cleanCnpjDigits)!;
        isDuplicate = true;
        duplicateType = "database";
        duplicateReason = `Já cadastrado na plataforma (CNPJ coincide com '${existingName}')`;
      } else if (cleanNameNorm && dbByName.has(cleanNameNorm)) {
        const existingName = dbByName.get(cleanNameNorm)!;
        isDuplicate = true;
        duplicateType = "database";
        duplicateReason = `Já cadastrado na plataforma (marca com nome '${existingName}' já existe)`;
      }
      // 2. Verificação de repetição interna na planilha
      else if (cleanCnpjDigits.length >= 8 && sheetByCnpj.has(cleanCnpjDigits)) {
        const prevRow = sheetByCnpj.get(cleanCnpjDigits)!;
        isDuplicate = true;
        duplicateType = "sheet";
        duplicateReason = `Duplicado da linha #${prevRow} da planilha (mesmo CNPJ)`;
      } else if (cleanNameNorm && sheetByName.has(cleanNameNorm)) {
        const prevRow = sheetByName.get(cleanNameNorm)!;
        isDuplicate = true;
        duplicateType = "sheet";
        duplicateReason = `Duplicado da linha #${prevRow} da planilha (mesmo Nome)`;
      } else {
        if (cleanCnpjDigits.length >= 8) sheetByCnpj.set(cleanCnpjDigits, i + 1);
        if (cleanNameNorm) sheetByName.set(cleanNameNorm, i + 1);
      }

      valid.push({
        rowNumber: i + 1,
        name: nome,
        cnpj,
        quota,
        segment: segmento,
        contactName: contato,
        contactPhone: telefone,
        isDuplicate,
        duplicateReason: isDuplicate ? duplicateReason : undefined,
        duplicateType,
      });
    }
  }

  const dbDuplicatesCount = valid.filter((item) => item.duplicateType === "database").length;
  const sheetDuplicatesCount = valid.filter((item) => item.duplicateType === "sheet").length;
  const totalDuplicatesCount = dbDuplicatesCount + sheetDuplicatesCount;

  return {
    valid,
    invalid,
    dbDuplicatesCount,
    sheetDuplicatesCount,
    totalDuplicatesCount,
  };
}
