import { describe, expect, it } from "vitest";
import {
  parseMediaTargets,
  serializeMediaTargets,
  countMediaByVehicle,
  DEFAULT_MEDIA_TARGETS,
} from "@/lib/media-targets";

describe("media-targets helper functions", () => {
  it("parses empty or plain notes with default targets", () => {
    expect(parseMediaTargets("")).toEqual({ targets: DEFAULT_MEDIA_TARGETS, cleanNotes: "" });
    expect(parseMediaTargets(null)).toEqual({ targets: DEFAULT_MEDIA_TARGETS, cleanNotes: "" });
    expect(parseMediaTargets("Anotações de alinhamento com a marca")).toEqual({
      targets: DEFAULT_MEDIA_TARGETS,
      cleanNotes: "Anotações de alinhamento com a marca",
    });
  });

  it("serializes and deserializes media targets without losing existing notes", () => {
    const originalNotes = "Observações internas do contrato.";
    const targets = { minTotal: 50, minTv: 20, minRadio: 15, minDigital: 10, minJornal: 5 };

    const serialized = serializeMediaTargets(originalNotes, targets);
    expect(serialized).toContain("<!--media_targets:");
    expect(serialized).toContain("Observações internas do contrato.");

    const parsed = parseMediaTargets(serialized);
    expect(parsed.targets).toEqual(targets);
    expect(parsed.cleanNotes).toBe(originalNotes);
  });

  it("counts media items by vehicle accurately", () => {
    const items = [
      { channel: "TV RBS", kind: "report" },
      { channel: "TV RBS", kind: "report" },
      { channel: "Rádio Atlântida", kind: "report" },
      { channel: "Portal GZH (Digital)", kind: "report" },
      { channel: "Jornal Zero Hora", kind: "report" },
      { channel: "Outro", kind: "material" }, // materiais enviados são ignorados na contagem de veiculações
    ];

    const counts = countMediaByVehicle(items);
    expect(counts.total).toBe(5);
    expect(counts.tv).toBe(2);
    expect(counts.radio).toBe(1);
    expect(counts.digital).toBe(1);
    expect(counts.jornal).toBe(1);
  });
});
