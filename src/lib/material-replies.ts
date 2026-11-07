import type { Tables } from "@/integrations/supabase/types";
import type { MediaItem } from "@/lib/media";

export type MaterialReply = Tables<"media_material_replies">;

export function canReplyToMaterial(material: Pick<MediaItem, "kind" | "sponsor_id">, viewer: { isAdmin: boolean } | null | undefined, sponsorId: string) {
  return !!viewer?.isAdmin && material.kind === "material" && material.sponsor_id === sponsorId;
}

export function repliesForMaterial(replies: readonly MaterialReply[], sponsorId: string, materialId: string) {
  return replies.filter((reply) => reply.sponsor_id === sponsorId && reply.media_item_id === materialId);
}