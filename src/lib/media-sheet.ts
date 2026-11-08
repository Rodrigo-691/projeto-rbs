// Parses the RBS media spreadsheet: Data | Veículo | <one column per sponsor, cell = alcance>.
// New sponsors are added as new columns after Veículo; empty or zero cells are skipped.
export const FIXED_HEADERS = ["Data", "Veículo"] as const;
export const VEHICLES = ["TV", "Rádio", "Digital", "Jornal"] as const;

type Cell = string | number | boolean | Date | null | undefined | unknown;
type SponsorRef = { id: string; name: string; cnpj?: string | null };

export type ParsedRow = {
  id: string;
  line: number;
  sponsorId: string;
  sponsorName: string;
  date: Date;
  vehicle: string;
  reach: number;
  isDuplicate?: boolean;
  duplicateReason?: string;
};

export type RowError = { line: number; message: string };

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const digits = (s: string) => s.replace(/\D/g, "");
const blank = (c: Cell) => c === null || c === undefined || String(c).trim() === "";

function parseDate(v: Cell): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate(), 12));
  if (typeof v === "number") return new Date(Math.round((v - 25569) * 86400000)); // Excel serial
  if (typeof v === "string") {
    const m = v.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
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
  const duplicateBrands: string[] = [];
  const head = rows[0] ?? [];
  const header = head.map((c) => norm(String(c ?? "")));
  const iDate = header.indexOf(norm("Data"));
  const iVeh = header.indexOf(norm("Veículo"));
  if (iDate < 0 || iVeh < 0) {
    return { ok, errors: [{ line: 1, message: "Cabeçalho deve ter Data, Veículo e um patrocinador por coluna" }], duplicateBrands };
  }

  const cols: { i: number; sponsor: SponsorRef }[] = [];
  const seenSponsorIds = new Map<string, number>();

  head.forEach((c, i) => {
    if (i <= iVeh || i === iDate || blank(c)) return;
    const ref = String(c).trim();
    const sponsor =
      sponsors.find((s) => norm(s.name) === norm(ref)) ??
      (digits(ref).length >= 11 ? sponsors.find((s) => s.cnpj && digits(s.cnpj) === digits(ref)) : undefined);
    if (sponsor) {
      if (seenSponsorIds.has(sponsor.id)) {
        duplicateBrands.push(sponsor.name);
        errors.push({ line: 1, message: `Marca "${sponsor.name}" aparece em mais de uma coluna no cabeçalho (duplicada)` });
      } else {
        seenSponsorIds.set(sponsor.id, i);
        cols.push({ i, sponsor });
      }
    } else {
      errors.push({ line: 1, message: `patrocinador "${ref}" não encontrado (coluna ignorada)` });
    }
  });

  if (!cols.length && !errors.length) errors.push({ line: 1, message: "Nenhum patrocinador nas colunas após Veículo" });

  const vehicles = new Map(VEHICLES.map((v) => [norm(v), v as string]));
  const seenMediaInSheet = new Map<string, number>();

  rows.slice(1).forEach((r, k) => {
    const line = k + 2;
    if (r.every(blank)) return;
    const date = parseDate(r[iDate]);
    const vehicle = vehicles.get(norm(String(r[iVeh] ?? "")));
    const problems: string[] = [];
    if (!date) problems.push("data inválida (use DD/MM/AAAA)");
    if (!vehicle) problems.push(`veículo deve ser ${VEHICLES.join(", ")}`);
    const found: ParsedRow[] = [];
    for (const { i, sponsor } of cols) {
      if (blank(r[i])) continue;
      const reach = parseReach(r[i]);
      if (reach === null) {
        problems.push(`alcance de "${sponsor.name}" deve ser um número`);
      } else if (reach > 0 && date && vehicle) {
        const key = `${sponsor.id}::${date.toISOString().slice(0, 10)}::${norm(vehicle)}`;
        const prevLine = seenMediaInSheet.get(key);
        const isDuplicate = prevLine !== undefined;
        if (!isDuplicate) {
          seenMediaInSheet.set(key, line);
        }
        found.push({
          id: `${line}-${sponsor.id}-${i}`,
          line,
          sponsorId: sponsor.id,
          sponsorName: sponsor.name,
          date,
          vehicle,
          reach,
          isDuplicate,
          duplicateReason: isDuplicate ? `Duplicada da linha #${prevLine} da planilha` : undefined,
        });
      }
    }
    if (problems.length) errors.push({ line, message: problems.join("; ") });
    else ok.push(...found);
  });

  return { ok, errors, duplicateBrands };
}
