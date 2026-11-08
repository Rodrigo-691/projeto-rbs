import { describe, expect, it } from "vitest";
import { formatCpf, normalizeTicketType, parseCourtesyGrid } from "../lib/courtesy-sheet";

describe("courtesy-sheet", () => {
  it("formats CPFs accurately", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
    expect(formatCpf("123.456.789-01")).toBe("123.456.789-01");
  });

  it("normalizes ticket types to Passaporte, Sexta, Sábado, or Domingo", () => {
    expect(normalizeTicketType("Passaporte")).toBe("Passaporte");
    expect(normalizeTicketType("sexta-feira")).toBe("Sexta");
    expect(normalizeTicketType("29/01")).toBe("Sexta");
    expect(normalizeTicketType("Sábado")).toBe("Sábado");
    expect(normalizeTicketType("sabado dia 30")).toBe("Sábado");
    expect(normalizeTicketType("domingo dia 31")).toBe("Domingo");
    expect(normalizeTicketType("outro")).toBe("Passaporte");
  });

  it("parses valid courtesy matrix with header mapping", () => {
    const matrix = [
      ["Nome Completo", "CPF", "E-mail", "WhatsApp", "Setor", "Dia do Ingresso"],
      ["Mariana Rios", "11122233344", "mariana@teste.com", "51999998888", "Camarote", "Sexta"],
      ["Carlos Eduardo", "55566677788", "carlos@teste.com", "51988887777", "Premium", "Sábado"],
      ["Ana Souza", "99988877766", "ana@teste.com", "51977776666", "Arena", "Passaporte"],
    ];

    const res = parseCourtesyGrid(matrix);
    expect(res.errors).toEqual([]);
    expect(res.totalValid).toBe(3);
    expect(res.rows[0]).toEqual({
      name: "Mariana Rios",
      cpf: "111.222.333-44",
      email: "mariana@teste.com",
      phone: "51999998888",
      sector: "Camarote",
      ticket_type: "Sexta",
    });
    expect(res.rows[1].sector).toBe("Premium");
    expect(res.rows[1].ticket_type).toBe("Sábado");
    expect(res.rows[2].ticket_type).toBe("Passaporte");
  });

  it("flags duplicates in sheet and handles invalid headers", () => {
    const invalid = [["A", "B", "C"], ["1", "2", "3"]];
    const resInvalid = parseCourtesyGrid(invalid);
    expect(resInvalid.errors.length).toBeGreaterThan(0);

    const dupMatrix = [
      ["Nome", "CPF"],
      ["Pessoa 1", "123.456.789-00"],
      ["Pessoa 2", "123.456.789-00"],
    ];
    const resDup = parseCourtesyGrid(dupMatrix);
    expect(resDup.duplicatesInSheet).toContain("123.456.789-00");
    expect(resDup.totalValid).toBe(2);
  });
});
