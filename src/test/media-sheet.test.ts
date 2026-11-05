import { describe, expect, it } from "vitest";
import { parseMediaSheet } from "@/lib/media-sheet";

const SPONSORS = [
  { id: "a", name: "Onda Energeticos", cnpj: "12.345.678/0001-90" },
  { id: "b", name: "Prancha Transportes", cnpj: null },
];

describe("Media spreadsheet with one column per sponsor", () => {
  it("creates one entry per sponsor column and skips zero or empty cells", () => {
    const { ok, errors } = parseMediaSheet(
      [
        ["Data", "Veículo", "Onda Energeticos", "prancha transportes"],
        ["10/01/2027", "TV", 120000, 0],
        [new Date("2027-01-12"), "radio", "5.000", 300],
      ],
      SPONSORS,
    );
    expect(errors).toEqual([]);
    expect(ok.map((r) => [r.sponsorId, r.vehicle, r.reach])).toEqual([["a", "TV", 120000], ["a", "Rádio", 5000], ["b", "Rádio", 300]]);
  });

  it("matches a sponsor column by CNPJ", () => {
    const { ok } = parseMediaSheet([["Data", "Veículo", "12345678000190"], ["10/01/2027", "Jornal", 10]], SPONSORS);
    expect(ok[0]?.sponsorId).toBe("a");
  });

  it("flags unknown sponsor columns but keeps the others", () => {
    const { ok, errors } = parseMediaSheet([["Data", "Veículo", "Solar", "Onda Energeticos"], ["10/01/2027", "TV", 5, 7]], SPONSORS);
    expect(errors[0]?.line).toBe(1);
    expect(ok.map((r) => r.reach)).toEqual([7]);
  });

  it("rejects rows with invalid date, vehicle or reach", () => {
    const { ok, errors } = parseMediaSheet([["Data", "Veículo", "Onda Energeticos"], ["ontem", "Outdoor", "muito"]], SPONSORS);
    expect(ok).toEqual([]);
    expect(errors[0]?.line).toBe(2);
  });

  it("requires Data and Veículo headers", () => {
    expect(parseMediaSheet([["Nome", "Alcance"]], SPONSORS).errors[0]?.line).toBe(1);
  });
});
