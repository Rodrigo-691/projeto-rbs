import { Download, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, formatBytes } from "@/lib/portal";
import type { MaterialFile } from "@/lib/media";
import { Button } from "@/components/ui/button";

export function MaterialAttachment({ file }: { file: MaterialFile }) {
  async function download() {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60);
    if (error || !data) { toast.error(error?.message ?? "Não foi possível baixar o anexo."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  return <div className="mt-3 flex min-w-0 items-center gap-2 border-t pt-2">
    <Paperclip className="text-primary h-4 w-4 shrink-0" />
    <span className="min-w-0 flex-1 break-words text-sm">{file.file_name} <span className="text-muted-foreground">· {formatBytes(file.size_bytes)}</span></span>
    <Button type="button" variant="ghost" size="icon" aria-label={`Baixar ${file.file_name}`} title="Baixar anexo" onClick={download}><Download className="h-4 w-4" /></Button>
  </div>;
}