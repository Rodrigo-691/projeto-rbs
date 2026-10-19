import { describe, expect, it } from "vitest";
import { canDeleteMedia, groupMaterialFiles, splitMediaItems, type MediaItem, type MaterialFile } from "@/lib/media";

const material: MediaItem = { id: "text", sponsor_id: "sponsor-a", kind: "material", title: "Material", body: "Texto", channel: null, reach: null, url: null, created_by: "user-a", created_by_email: null, created_at: "2026-10-19T00:00:00Z" };
const publication: MediaItem = { ...material, id: "publication", kind: "report" };
const viewer = { id: "user-a", isAdmin: false };

describe("Sponsor media", () => {
  it("groups title, text and attachment into the same material", () => {
    const file: MaterialFile = { id: "file", sponsor_id: "sponsor-a", media_item_id: "text", tab: "midia", category: "material", file_name: "arte.pdf", storage_path: "sponsor-a/material/arte.pdf", size_bytes: 100, mime_type: "application/pdf", uploaded_by: "user-a", uploaded_by_email: null, created_at: material.created_at };
    const groups = groupMaterialFiles([material], [file, { ...file, id: "old", media_item_id: null }]);
    expect(groups.materials).toHaveLength(1);
    expect(groups.materials[0]?.title).toBe("Material");
    expect(groups.materials[0]?.body).toBe("Texto");
    expect(groups.materials[0]?.attachments.map((item) => item.id)).toEqual(["file"]);
    expect(groups.standalone.map((item) => item.id)).toEqual(["old"]);
  });
  it("keeps submitted text out of the RBS timeline", () => {
    const groups = splitMediaItems([material, publication, { ...publication, id: "post", kind: "post_link" }]);
    expect(groups.materials.map((item) => item.id)).toEqual(["text"]);
    expect(groups.publications.map((item) => item.id)).toEqual(["publication", "post"]);
  });
  it("allows sponsors to delete their own text", () => {
    expect(canDeleteMedia(material, viewer, "sponsor-a")).toBe(true);
  });
  it("does not allow sponsors to delete RBS publications", () => {
    expect(canDeleteMedia(publication, viewer, "sponsor-a")).toBe(false);
  });
  it("does not allow deleting another user's text", () => {
    expect(canDeleteMedia({ ...material, created_by: "user-b" }, viewer, "sponsor-a")).toBe(false);
  });
  it("does not expose deletion for another sponsor", () => {
    expect(canDeleteMedia(material, viewer, "sponsor-b")).toBe(false);
  });
  it("allows RBS admins to delete both kinds", () => {
    const admin = { id: "admin", isAdmin: true };
    expect(canDeleteMedia(material, admin, "sponsor-a")).toBe(true);
    expect(canDeleteMedia(publication, admin, "sponsor-a")).toBe(true);
  });
  it("does not allow signed-out deletion", () => {
    expect(canDeleteMedia(material, null, "sponsor-a")).toBe(false);
  });
});