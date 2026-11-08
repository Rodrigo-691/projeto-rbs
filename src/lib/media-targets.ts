export interface MediaTargets {
  minTotal: number;
  minTv: number;
  minRadio: number;
  minDigital: number;
  minJornal: number;
}

export const DEFAULT_MEDIA_TARGETS: MediaTargets = {
  minTotal: 0,
  minTv: 0,
  minRadio: 0,
  minDigital: 0,
  minJornal: 0,
};

export function parseMediaTargets(notes: string | null | undefined): {
  targets: MediaTargets;
  cleanNotes: string;
} {
  if (!notes) {
    return { targets: { ...DEFAULT_MEDIA_TARGETS }, cleanNotes: "" };
  }

  const match = notes.match(/<!--media_targets:({.*?})-->/);
  if (!match) {
    return { targets: { ...DEFAULT_MEDIA_TARGETS }, cleanNotes: notes };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const cleanNotes = notes.replace(/<!--media_targets:{.*?}-->\r?\n?/, "").trim();
    return {
      targets: {
        minTotal: Math.max(0, Number(parsed.minTotal) || 0),
        minTv: Math.max(0, Number(parsed.minTv) || 0),
        minRadio: Math.max(0, Number(parsed.minRadio) || 0),
        minDigital: Math.max(0, Number(parsed.minDigital) || 0),
        minJornal: Math.max(0, Number(parsed.minJornal) || 0),
      },
      cleanNotes,
    };
  } catch {
    return { targets: { ...DEFAULT_MEDIA_TARGETS }, cleanNotes: notes };
  }
}

export function serializeMediaTargets(cleanNotes: string, targets: MediaTargets): string {
  const payload = {
    minTotal: Math.max(0, Number(targets.minTotal) || 0),
    minTv: Math.max(0, Number(targets.minTv) || 0),
    minRadio: Math.max(0, Number(targets.minRadio) || 0),
    minDigital: Math.max(0, Number(targets.minDigital) || 0),
    minJornal: Math.max(0, Number(targets.minJornal) || 0),
  };
  const tag = `<!--media_targets:${JSON.stringify(payload)}-->`;
  const trimmed = (cleanNotes || "").trim();
  return trimmed ? `${tag}\n${trimmed}` : tag;
}

export function countMediaByVehicle(items: { channel: string | null; kind?: string }[]) {
  const norm = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  let tv = 0;
  let radio = 0;
  let digital = 0;
  let jornal = 0;
  let total = 0;

  for (const m of items) {
    if (m.kind === "material") continue;
    total++;
    const ch = norm(m.channel ?? "");
    if (ch.includes("tv")) {
      tv++;
    } else if (ch.includes("radio")) {
      radio++;
    } else if (ch.includes("digital") || ch.includes("web") || ch.includes("post") || ch.includes("online")) {
      digital++;
    } else if (ch.includes("jornal") || ch.includes("impresso") || ch.includes("revista")) {
      jornal++;
    }
  }

  return { total, tv, radio, digital, jornal };
}
