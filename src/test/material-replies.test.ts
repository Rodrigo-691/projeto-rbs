import { describe, expect, it } from "vitest";
import { canReplyToMaterial, repliesForMaterial, type MaterialReply } from "@/lib/material-replies";

describe("Respostas de materiais", () => {
  const material = { kind: "material", sponsor_id: "marca-a" };
  it("permite somente RBS responder materiais", () => {
    expect(canReplyToMaterial(material, { isAdmin: true }, "marca-a")).toBe(true);
    expect(canReplyToMaterial(material, { isAdmin: false }, "marca-a")).toBe(false);
    expect(canReplyToMaterial(material, null, "marca-a")).toBe(false);
  });
  it("não permite responder publicações ou outra marca", () => {
    expect(canReplyToMaterial({ ...material, kind: "report" }, { isAdmin: true }, "marca-a")).toBe(false);
    expect(canReplyToMaterial(material, { isAdmin: true }, "marca-b")).toBe(false);
  });
  it("mantém texto e comprovação juntos no material da marca correta", () => {
    const reply: MaterialReply = { id: "resposta", sponsor_id: "marca-a", media_item_id: "material-a", body: "Veiculado", title: "Resposta RBS", file_name: "comprovacao.pdf", storage_path: "marca-a/comprovacao/prova.pdf", size_bytes: 10, mime_type: "application/pdf", created_at: "2026-11-07", created_by: "rbs", created_by_email: null };
    const rows = repliesForMaterial([reply, { ...reply, id: "outra-marca", sponsor_id: "marca-b" }, { ...reply, id: "outro-material", media_item_id: "material-b" }], "marca-a", "material-a");
    expect(rows.map((row) => row.id)).toEqual(["resposta"]);
    expect(rows[0]?.body).toBe("Veiculado");
    expect(rows[0]?.file_name).toBe("comprovacao.pdf");
  });
});