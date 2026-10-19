import type { Tables } from "@/integrations/supabase/types";

export type MediaItem = Tables<"media_items">;
export type MaterialFile = Tables<"sponsor_files">;

export function groupMaterialFiles(materials: readonly MediaItem[], files: readonly MaterialFile[]) {
  return {
    materials: materials.map((material) => ({ ...material, attachments: files.filter((file) => file.media_item_id === material.id) })),
    standalone: files.filter((file) => !file.media_item_id),
  };
}

export function splitMediaItems(items: readonly MediaItem[]) {
  return {
    materials: items.filter((item) => item.kind === "material"),
    publications: items.filter((item) => item.kind !== "material"),
  };
}

// This controls the affordance only; the database enforces the same permission.
export function canDeleteMedia(item: Pick<MediaItem, "kind" | "created_by" | "sponsor_id">, viewer: { id: string; isAdmin: boolean } | null | undefined, sponsorId: string) {
  if (!viewer || item.sponsor_id !== sponsorId) return false;
  return viewer.isAdmin || (item.kind === "material" && item.created_by === viewer.id);
}