import { describe, expect, it } from "vitest";
import { parseSurveySheet, parsePercentValue, isGenderQuestion, isAgeQuestion } from "@/lib/survey-sheet";

describe("survey-sheet helper functions", () => {
  it("normalizes percent values from numbers, decimals, and strings", () => {
    expect(parsePercentValue(45)).toBe(45);
    expect(parsePercentValue(0.45)).toBe(45);
    expect(parsePercentValue("60%")).toBe(60);
    expect(parsePercentValue("33,5%")).toBe(33.5);
    expect(parsePercentValue("invalido")).toBeNull();
    expect(parsePercentValue(null)).toBeNull();
  });

  it("identifies gender and age demographic questions correctly", () => {
    expect(isGenderQuestion("Gênero")).toBe(true);
    expect(isGenderQuestion("Gênero dos participantes")).toBe(true);
    expect(isGenderQuestion("Sexo do público")).toBe(true);
    expect(isGenderQuestion("Pergunta sobre ativação")).toBe(false);

    expect(isAgeQuestion("Faixa etária")).toBe(true);
    expect(isAgeQuestion("Faixa Etária (anos)")).toBe(true);
    expect(isAgeQuestion("Idade dos entrevistados")).toBe(true);
    expect(isAgeQuestion("Pergunta 1")).toBe(false);
  });
});

describe("parseSurveySheet", () => {
  it("rejects spreadsheet if headers are missing", () => {
    const res = parseSurveySheet([
      ["Outra Coluna", "Valor"],
      ["Teste", 50],
    ]);
    expect(res.items.length).toBe(0);
    expect(res.errors[0]).toContain("Colunas obrigatórias ausentes");
  });

  it("parses brand questions with 3 variations of answers and demographic data", () => {
    const rows = [
      ["Pergunta / Indicador", "Resposta / Opção", "Percentual (%)"],
      // Pergunta 1 da marca (3 variações)
      ["Você experimentou o novo produto no lounge?", "Sim, adorei", 60],
      ["Você experimentou o novo produto no lounge?", "Sim, mas achei comum", 30],
      ["Você experimentou o novo produto no lounge?", "Não experimentei", 10],
      // Pergunta 2 da marca (3 variações)
      ["Qual a probabilidade de recomendar a marca?", "Muito provável", 50],
      ["Qual a probabilidade de recomendar a marca?", "Neutro", 35],
      ["Qual a probabilidade de recomendar a marca?", "Pouco provável", 15],
      // Demografia: Gênero
      ["Gênero dos entrevistados", "Feminino", 52],
      ["Gênero dos entrevistados", "Masculino", 45],
      ["Gênero dos entrevistados", "Outro / Prefere não responder", 3],
      // Demografia: Faixa Etária
      ["Faixa Etária (anos)", "18 a 24 anos", 48],
      ["Faixa Etária (anos)", "25 a 34 anos", 36],
      ["Faixa Etária (anos)", "35 anos ou mais", 16],
    ];

    const res = parseSurveySheet(rows);
    expect(res.errors.length).toBe(0);
    expect(res.items.length).toBe(12);
    expect(res.summary.totalQuestions).toBe(2);
    expect(res.summary.hasGender).toBe(true);
    expect(res.summary.hasAge).toBe(true);

    const q1 = res.groups["Você experimentou o novo produto no lounge?"];
    expect(q1?.length).toBe(3);
    expect(q1?.[0]?.answer).toBe("Sim, adorei");
    expect(q1?.[0]?.percent).toBe(60);

    const gender = res.groups["Gênero dos entrevistados"];
    expect(gender?.length).toBe(3);
    expect(gender?.[0]?.answer).toBe("Feminino");

    const age = res.groups["Faixa Etária (anos)"];
    expect(age?.length).toBe(3);
    expect(age?.[0]?.answer).toBe("18 a 24 anos");
  });
});
