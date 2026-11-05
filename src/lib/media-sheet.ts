// Parses the RBS standardized media spreadsheet: Patrocinador | Data | Veículo | Alcance.
export const SHEET_HEADERS = ["Patrocinador", "Data", "Veículo", "Alcance"] as const;
export const VEHICLES = ["TV", "Rádio", "Digital", "Jornal"] as const;

type Cell = string | number | boolean | Date | null | undefined | unknown;
type SponsorRef = { id: string; name: string; cnpj?: string | null };

export type ParsedRow = { line: number; sponsorId: string; sponsorName: string; date: Date; vehicle: string; reach: number };
export type RowError = { line: number; message: string };

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (s: string) => s.replace(/\D/g, "");

function parseDate(v: Cell): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400000)); // Excel serial
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(Date.UTC(+m[3]!, +m[2]! - 1, +m[1]!, 12));
    const iso = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Date.UTC(+iso[1]!, +iso[2]! - 1, +iso[3]!, 12));
  }
  return null;
}

function parseReach(v: Cell): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/\./g, "").replace(",", ".").trim());
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  }
  return null;
}

export function parseMediaSheet(rows: readonly (readonly Cell[])[], sponsors: readonly SponsorRef[]) {
  const ok: ParsedRow[] = [];
  const errors: RowError[] = [];
  const header = (rows[0] ?? []).map((c) => norm(String(c ?? "")));
  const idx = SHEET_HEADERS.map((h) => header.indexOf(norm(h)));
  if (idx.some((i) => i < 0)) {
    return { ok, errors: [{ line: 1, message: `Cabeçalho deve ter as colunas: ${SHEET_HEADERS.join(", ")}` }] };
  }
  const vehicles = new Map(VEHICLES.map((v) => [norm(v), v as string]));
  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const [cs, cd, cv, ca] = idx.map((j) => r[j!]);
    if ([cs, cd, cv, ca].every((c) => c === null || c === undefined || String(c).trim() === "")) return;
    const ref = String(cs ?? "").trim();
    const sponsor =
      sponsors.find((s) => norm(s.name) === norm(ref)) ??
      (digits(ref).length >= 11 ? sponsors.find((s) => s.cnpj && digits(s.cnpj) === digits(ref)) : undefined);
    const date = parseDate(cd);
    const vehicle = vehicles.get(norm(String(cv ?? "")));
    const reach = parseReach(ca);
    const problems = [
      !sponsor && `patrocinador "${ref}" não encontrado`,
      !date && "data inválida (use DD/MM/AAAA)",
      !vehicle && `veículo deve ser ${VEHICLES.join(", ")}`,
      reach === null && "alcance deve ser um número",
    ].filter(Boolean);
    if (problems.length) errors.push({ line, message: problems.join("; ") });
    else ok.push({ line, sponsorId: sponsor!.id, sponsorName: sponsor!.name, date: date!, vehicle: vehicle!, reach: reach! });
  });
  return { ok, errors };
}
