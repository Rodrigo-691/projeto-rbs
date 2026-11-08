export interface CourtesyRow {
  id?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  sector: string;
  ticket_type: "Passaporte" | "Sexta" | "Sábado" | string;
}

export interface ParseCourtesySheetResult {
  rows: CourtesyRow[];
  totalValid: number;
  duplicatesInSheet: string[]; // CPFs with duplicates in file
  errors: string[];
}

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function normalizeTicketType(raw: string): "Passaporte" | "Sexta" | "Sábado" {
  const n = norm(raw);
  if (n.includes("passaporte") || n.includes("todos") || n.includes("combo")) return "Passaporte";
  if (n.includes("sexta") || n.includes("29") || n.includes("sex")) return "Sexta";
  if (n.includes("sabado") || n.includes("30") || n.includes("sab")) return "Sábado";
  return "Passaporte";
}

export function formatCpf(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return String(raw || "").trim();
}

export function parseCourtesyGrid(matrix: unknown[][]): ParseCourtesySheetResult {
  if (!matrix || matrix.length < 2) {
    return { rows: [], totalValid: 0, duplicatesInSheet: [], errors: ["A planilha está vazia ou sem cabeçalho."] };
  }

  // Find header row (first row with at least "nome" or "cpf")
  let headerRowIdx = -1;
  let colMap: { [k: string]: number } = {};

  for (let r = 0; r < Math.min(matrix.length, 5); r++) {
    const row = matrix[r] || [];
    const map: { [k: string]: number } = {};
    for (let c = 0; c < row.length; c++) {
      const val = norm(String(row[c] || ""));
      if (!val) continue;
      if (val.includes("nome") || val.includes("beneficiario") || val.includes("convidado")) {
        map["name"] = c;
      } else if (val.includes("cpf") || val.includes("documento")) {
        map["cpf"] = c;
      } else if (val.includes("mail")) {
        map["email"] = c;
      } else if (val.includes("telefone") || val.includes("celular") || val.includes("whats") || val.includes("fone")) {
        map["phone"] = c;
      } else if (val.includes("setor") || val.includes("area") || val.includes("local")) {
        map["sector"] = c;
      } else if (val.includes("ingresso") || val.includes("tipo") || val.includes("dia") || val.includes("data")) {
        map["ticket_type"] = c;
      }
    }
    if (map["name"] !== undefined && map["cpf"] !== undefined) {
      headerRowIdx = r;
      colMap = map;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return {
      rows: [],
      totalValid: 0,
      duplicatesInSheet: [],
      errors: [
        "Cabeçalho inválido. A planilha deve conter pelo menos as colunas 'Nome' e 'CPF'. Colunas suportadas: Nome, CPF, E-mail, Telefone, Setor, Ingresso/Dia.",
      ],
    };
  }

  const rows: CourtesyRow[] = [];
  const errors: string[] = [];
  const seenCpf = new Map<string, number>();
  const duplicatesInSheet: string[] = [];

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const rawName = String(colMap["name"] !== undefined ? row[colMap["name"]] ?? "" : "").trim();
    const rawCpf = String(colMap["cpf"] !== undefined ? row[colMap["cpf"]] ?? "" : "").trim();

    // Skip empty rows
    if (!rawName && !rawCpf) continue;

    if (!rawName) {
      errors.push(`Linha ${r + 1}: Nome não informado.`);
      continue;
    }
    if (!rawCpf) {
      errors.push(`Linha ${r + 1}: CPF de "${rawName}" não informado.`);
      continue;
    }

    const cleanedCpf = formatCpf(rawCpf);
    const cpfKey = cleanedCpf.replace(/\D/g, "") || cleanedCpf;

    if (seenCpf.has(cpfKey)) {
      duplicatesInSheet.push(cleanedCpf);
    } else {
      seenCpf.set(cpfKey, r + 1);
    }

    const rawEmail = String(colMap["email"] !== undefined ? row[colMap["email"]] ?? "" : "").trim();
    const rawPhone = String(colMap["phone"] !== undefined ? row[colMap["phone"]] ?? "" : "").trim();
    const rawSector = String(colMap["sector"] !== undefined ? row[colMap["sector"]] ?? "" : "").trim() || "Arena";
    const rawTicket = String(colMap["ticket_type"] !== undefined ? row[colMap["ticket_type"]] ?? "" : "").trim();

    rows.push({
      name: rawName,
      cpf: cleanedCpf,
      email: rawEmail,
      phone: rawPhone,
      sector: rawSector,
      ticket_type: normalizeTicketType(rawTicket),
    });
  }

  return {
    rows,
    totalValid: rows.length,
    duplicatesInSheet: Array.from(new Set(duplicatesInSheet)),
    errors,
  };
}

export async function downloadCourtesyTemplate() {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const headers = [
    { value: "Nome Completo", fontWeight: "bold" as const },
    { value: "CPF", fontWeight: "bold" as const },
    { value: "E-mail", fontWeight: "bold" as const },
    { value: "Telefone / WhatsApp", fontWeight: "bold" as const },
    { value: "Setor", fontWeight: "bold" as const },
    { value: "Tipo de Ingresso", fontWeight: "bold" as const },
  ];

  const sampleRows = [
    [
      { type: String, value: "Mariana Silva" },
      { type: String, value: "123.456.789-00" },
      { type: String, value: "mariana.silva@empresa.com.br" },
      { type: String, value: "(51) 99999-1111" },
      { type: String, value: "Camarote" },
      { type: String, value: "Passaporte" },
    ],
    [
      { type: String, value: "Rodrigo Santos" },
      { type: String, value: "234.567.890-11" },
      { type: String, value: "rodrigo.santos@empresa.com.br" },
      { type: String, value: "(51) 99999-2222" },
      { type: String, value: "Premium" },
      { type: String, value: "Sexta" },
    ],
    [
      { type: String, value: "Fernanda Lima" },
      { type: String, value: "345.678.901-22" },
      { type: String, value: "fernanda.lima@empresa.com.br" },
      { type: String, value: "(51) 99999-3333" },
      { type: String, value: "Arena" },
      { type: String, value: "Sábado" },
    ],
  ];

  await writeXlsxFile([headers, ...sampleRows], {
    fileName: "modelo-cortesias-patrocinador.xlsx",
    columns: [
      { width: 28 },
      { width: 18 },
      { width: 32 },
      { width: 20 },
      { width: 16 },
      { width: 18 },
    ],
  });
}

export async function exportCourtesiesToExcel(rows: CourtesyRow[], sponsorName: string) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const headers = [
    { value: "Nome Completo", fontWeight: "bold" as const },
    { value: "CPF", fontWeight: "bold" as const },
    { value: "E-mail", fontWeight: "bold" as const },
    { value: "Telefone", fontWeight: "bold" as const },
    { value: "Setor", fontWeight: "bold" as const },
    { value: "Tipo de Ingresso", fontWeight: "bold" as const },
  ];

  const dataRows = rows.map((r) => [
    { type: String, value: r.name },
    { type: String, value: r.cpf },
    { type: String, value: r.email || "" },
    { type: String, value: r.phone || "" },
    { type: String, value: r.sector },
    { type: String, value: r.ticket_type },
  ]);

  const sanitized = sponsorName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  await writeXlsxFile([headers, ...dataRows], {
    fileName: `cortesias-${sanitized}.xlsx`,
    columns: [
      { width: 28 },
      { width: 18 },
      { width: 32 },
      { width: 20 },
      { width: 16 },
      { width: 18 },
    ],
  });
}
