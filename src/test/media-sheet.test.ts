import { describe, expect, it } from "vitest";
import { parseMediaSheet } from "@/lib/media-sheet";

const SPONSORS = [
  { id: "a", name: "Onda Energeticos", cnpj: "12.345.678/0001-90" },
  { id: "b", name: "Prancha Transportes", cnpj: null },
];
const HEAD = ["Patrocinador", "Data", "Veículo", "Alcance"];

describe("Standardized media spreadsheet", () => {
  it("routes rows of several sponsors to each sponsor", () => {
    const { ok, errors } = parseMediaSheet(
      [HEAD, ["Onda Energeticos", "10/01/2027", "TV", 120000], ["prancha transportes", new Date("2027-01-12"), "radio", "5.000"]],
      SPONSORS,
    );
    expect(errors).toEqual([]);
    expect(ok.map((r) => [r.sponsorId, r.vehicle, r.reach])).toEqual([["a", "TV", 120000], ["b", "Rádio", 5000]]);
  });

  it("matches a sponsor by CNPJ", () => {
    const { ok } = parseMediaSheet([HEAD, ["12345678000190", "10/01/2027", "Jornal", 10]], SPONSORS);
    expect(ok[0]?.sponsorId).toBe("a");
  });

  it("rejects unknown sponsors, vehicles, dates and reach", () => {
    const { ok, errors } = parseMediaSheet([HEAD, ["Solar", "ontem", "Outdoor", "muito"]], SPONSORS);
    expect(ok).toEqual([]);
    expect(errors[0]?.line).toBe(2);
  });

  it("requires the standard header", () => {
    expect(parseMediaSheet([["Nome", "Data"]], SPONSORS).errors[0]?.line).toBe(1);
  });
});
