import { describe, expect, it } from "vitest";
import { canDeleteMedia, splitMediaItems, type MediaItem } from "@/lib/media";

const material: MediaItem = { id: "text", sponsor_id: "sponsor-a", kind: "material", title: "Material", body: "Texto", channel: null, reach: null, url: null, created_by: "user-a", created_by_email: null, created_at: "2026-10-19T00:00:00Z" };
const publication: MediaItem = { ...material, id: "publication", kind: "report" };
const viewer = { id: "user-a", isAdmin: false };

describe("Sponsor media", () => {
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