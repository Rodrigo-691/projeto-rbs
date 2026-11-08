import { describe, expect, it } from "vitest";
import { parseSponsorSheet, parseQuota } from "@/lib/sponsor-sheet";

const DB_SPONSORS = [
  { id: "1", name: "Budweiser", cnpj: "12.345.678/0001-90" },
  { id: "2", name: "Banrisul", cnpj: "98.765.432/0001-10" },
];

describe("parseQuota", () => {
  it("recognizes quota levels with normalization", () => {
    expect(parseQuota("Master")).toBe("master");
    expect(parseQuota("master")).toBe("master");
    expect(parseQuota("Subcota G")).toBe("subcota_g");
    expect(parseQuota("subcota-g")).toBe("subcota_g");
    expect(parseQuota("Subcota Grande")).toBe("subcota_g");
    expect(parseQuota("Subcota")).toBe("subcota");
    expect(parseQuota("Desconhecida")).toBeNull();
  });
});

describe("parseSponsorSheet", () => {
  it("rejects spreadsheet when mandatory headers are missing", () => {
    const res = parseSponsorSheet([
      ["Segmento", "Cota"],
      ["Bebidas", "Master"],
    ]);
    expect(res.valid.length).toBe(0);
    expect(res.invalid[0]?.reason).toContain("Colunas obrigatórias ausentes");
  });

  it("extracts valid sponsors successfully", () => {
    const res = parseSponsorSheet(
      [
        ["Nome", "CNPJ", "Cota", "Segmento"],
        ["Heineken", "11.222.333/0001-44", "Master", "Cervejaria"],
        ["Red Bull", "22.333.444/0001-55", "Subcota G", "Energéticos"],
      ],
      DB_SPONSORS
    );

    expect(res.valid.length).toBe(2);
    expect(res.invalid.length).toBe(0);
    expect(res.valid[0]?.name).toBe("Heineken");
    expect(res.valid[0]?.isDuplicate).toBe(false);
    expect(res.valid[1]?.quota).toBe("subcota_g");
    expect(res.totalDuplicatesCount).toBe(0);
  });

  it("detects duplicates against database by CNPJ and by Name", () => {
    const res = parseSponsorSheet(
      [
        ["Nome", "CNPJ", "Cota"],
        ["Marca com mesmo CNPJ", "12.345.678/0001-90", "Master"], // CNPJ do Budweiser
        ["Budweiser", "00.000.000/0001-00", "Subcota"], // Nome do Budweiser
        ["Nova Marca", "33.444.555/0001-66", "Subcota"],
      ],
      DB_SPONSORS
    );

    expect(res.valid.length).toBe(3);
    expect(res.dbDuplicatesCount).toBe(2);
    expect(res.valid[0]?.isDuplicate).toBe(true);
    expect(res.valid[0]?.duplicateType).toBe("database");
    expect(res.valid[0]?.duplicateReason).toContain("Já cadastrado na plataforma");

    expect(res.valid[1]?.isDuplicate).toBe(true);
    expect(res.valid[1]?.duplicateType).toBe("database");

    expect(res.valid[2]?.isDuplicate).toBe(false);
  });

  it("detects internal duplicates in spreadsheet rows", () => {
    const res = parseSponsorSheet(
      [
        ["Nome", "CNPJ", "Cota"],
        ["Original Marca", "44.555.666/0001-77", "Master"],
        ["Outro Nome", "44.555.666/0001-77", "Subcota"], // Repetiu CNPJ
        ["Original Marca", "55.666.777/0001-88", "Subcota"], // Repetiu Nome
      ],
      DB_SPONSORS
    );

    expect(res.valid.length).toBe(3);
    expect(res.valid[0]?.isDuplicate).toBe(false);

    expect(res.valid[1]?.isDuplicate).toBe(true);
    expect(res.valid[1]?.duplicateType).toBe("sheet");
    expect(res.valid[1]?.duplicateReason).toContain("linha #2");

    expect(res.valid[2]?.isDuplicate).toBe(true);
    expect(res.valid[2]?.duplicateType).toBe("sheet");
    expect(res.sheetDuplicatesCount).toBe(2);
  });

  it("reports rows with missing mandatory fields as invalid", () => {
    const res = parseSponsorSheet(
      [
        ["Nome", "CNPJ", "Cota"],
        ["", "11.222.333/0001-44", "Master"], // Sem nome
        ["Marca", "", "Master"], // Sem CNPJ
        ["Marca", "11.222.333/0001-44", ""], // Sem Cota
      ],
      DB_SPONSORS
    );

    expect(res.valid.length).toBe(0);
    expect(res.invalid.length).toBe(3);
  });
});
