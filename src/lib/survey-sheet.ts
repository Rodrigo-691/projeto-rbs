export interface SurveyItem {
  question: string;
  answer: string;
  percent: number;
  isDemographic?: boolean;
  demographicType?: "gender" | "age";
}

export interface ParseSurveySheetResult {
  items: SurveyItem[];
  groups: Record<string, { answer: string; percent: number }[]>;
  summary: {
    totalQuestions: number;
    totalAnswers: number;
    hasGender: boolean;
    hasAge: boolean;
  };
  errors: string[];
}

const norm = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function isGenderQuestion(question: string): boolean {
  const n = norm(question);
  return n.includes("genero") || n.includes("sexo");
}

export function isAgeQuestion(question: string): boolean {
  const n = norm(question);
  return (
    n.includes("faixa etaria") ||
    n.includes("faixa de idade") ||
    n.includes("faixa etária") ||
    /\bidades?\b/.test(n) ||
    n.startsWith("idade") ||
    n.includes("idade em anos") ||
    n.includes("idade dos")
  );
}

export function parsePercentValue(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    // Se o valor estiver em decimal (ex: 0.45 para 45%), converte
    if (raw > 0 && raw <= 1) {
      return Math.round(raw * 1000) / 10;
    }
    return Math.round(raw * 10) / 10;
  }
  const clean = String(raw).replace("%", "").replace(",", ".").trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  if (num > 0 && num <= 1 && String(raw).includes("0.")) {
    return Math.round(num * 1000) / 10;
  }
  return Math.round(num * 10) / 10;
}

export function parseSurveySheet(rows: unknown[][]): ParseSurveySheetResult {
  const items: SurveyItem[] = [];
  const errors: string[] = [];

  if (!rows || rows.length < 2) {
    return {
      items,
      groups: {},
      summary: { totalQuestions: 0, totalAnswers: 0, hasGender: false, hasAge: false },
      errors: ["A planilha está vazia ou sem linhas de dados."],
    };
  }

  const headerRow = (rows[0] ?? []).map((h) => norm(String(h ?? "")));
  const findCol = (terms: string[]) => headerRow.findIndex((h) => terms.some((t) => h.includes(t)));

  const colPergunta = findCol(["pergunta", "questao", "indicador", "item"]);
  const colResposta = findCol(["resposta", "opcao", "alternativa", "categoria", "variacao"]);
  const colPercent = findCol(["percentual", "porcentagem", "%", "valor", "resultado", "distribuicao"]);

  const missing: string[] = [];
  if (colPergunta === -1) missing.push("Pergunta");
  if (colResposta === -1) missing.push("Resposta");
  if (colPercent === -1) missing.push("Percentual (%)");

  if (missing.length > 0) {
    return {
      items,
      groups: {},
      summary: { totalQuestions: 0, totalAnswers: 0, hasGender: false, hasAge: false },
      errors: [`Colunas obrigatórias ausentes na planilha: ${missing.join(", ")}`],
    };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;

    const questionRaw = row[colPergunta] ? String(row[colPergunta]).trim() : "";
    const answerRaw = row[colResposta] ? String(row[colResposta]).trim() : "";
    const percentRaw = row[colPercent];

    if (!questionRaw) {
      errors.push(`Linha #${i + 1}: Pergunta não informada.`);
      continue;
    }
    if (!answerRaw) {
      errors.push(`Linha #${i + 1}: Resposta não informada para a pergunta "${questionRaw}".`);
      continue;
    }

    const percent = parsePercentValue(percentRaw);
    if (percent === null || isNaN(percent) || percent < 0) {
      errors.push(`Linha #${i + 1}: Percentual inválido para "${questionRaw}" - "${answerRaw}".`);
      continue;
    }

    const isGender = isGenderQuestion(questionRaw);
    const isAge = isAgeQuestion(questionRaw);

    items.push({
      question: questionRaw,
      answer: answerRaw,
      percent,
      isDemographic: isGender || isAge,
      demographicType: isGender ? "gender" : isAge ? "age" : undefined,
    });
  }

  const groups: Record<string, { answer: string; percent: number }[]> = {};
  for (const item of items) {
    if (!groups[item.question]) {
      groups[item.question] = [];
    }
    groups[item.question].push({ answer: item.answer, percent: item.percent });
  }

  const hasGender = items.some((i) => i.demographicType === "gender");
  const hasAge = items.some((i) => i.demographicType === "age");
  const brandQuestions = Object.keys(groups).filter((q) => !isGenderQuestion(q) && !isAgeQuestion(q));

  return {
    items,
    groups,
    summary: {
      totalQuestions: brandQuestions.length,
      totalAnswers: items.length,
      hasGender,
      hasAge,
    },
    errors,
  };
}
