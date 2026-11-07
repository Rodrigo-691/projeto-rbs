import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Paperclip, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialAttachment } from "@/components/MaterialAttachment";
import { ALLOWED_TYPES, BUCKET, MAX_FILE_MB, formatDate } from "@/lib/portal";
import { canReplyToMaterial, repliesForMaterial, type MaterialReply } from "@/lib/material-replies";
import type { MediaItem } from "@/lib/media";

export function MaterialReplies({ material, replies, viewer }: { material: MediaItem; replies: readonly MaterialReply[]; viewer: { isAdmin: boolean } | null | undefined }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const canReply = canReplyToMaterial(material, viewer, material.sponsor_id);
  const rows = repliesForMaterial(replies, material.sponsor_id, material.id);
  function invalidate() {
    qc.invalidateQueries({ queryKey: ["material-replies", material.sponsor_id] });
    qc.invalidateQueries({ queryKey: ["audit", material.sponsor_id] });
  }
  const send = useMutation({
    mutationFn: async () => {
      if (!canReply || !body.trim()) throw new Error("Preencha o texto da resposta.");
      let path: string | null = null;
      if (file) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Arquivo maior que ${MAX_FILE_MB} MB`);
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Tipo de arquivo não permitido");
        path = `${material.sponsor_id}/comprovacao/${crypto.randomUUID()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const uploaded = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (uploaded.error) throw uploaded.error;
      }
      const result = await supabase.from("media_material_replies").insert({
        sponsor_id: material.sponsor_id, media_item_id: material.id, body: body.trim(),
        file_name: file?.name ?? null, storage_path: path, size_bytes: file?.size ?? 0, mime_type: file?.type ?? null,
      });
      if (result.error) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw result.error;
      }
    },
    onSuccess: () => { setBody(""); setFile(null); setOpen(false); invalidate(); toast.success("Resposta enviada"); },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: async (reply: MaterialReply) => {
      const result = await supabase.from("media_material_replies").delete().eq("id", reply.id).eq("sponsor_id", material.sponsor_id).select("id");
      if (result.error || !result.data?.length) throw result.error ?? new Error("Não foi possível excluir a resposta.");
      if (reply.storage_path) {
        const deleted = await supabase.storage.from(BUCKET).remove([reply.storage_path]);
        if (deleted.error) toast.warning("Resposta excluída, mas não foi possível limpar o arquivo armazenado.");
      }
    },
    onSuccess: () => { invalidate(); toast.success("Resposta excluída"); },
    onError: (error: Error) => toast.error(error.message),
  });
  return <div className="mt-3 space-y-3">
    {rows.map((reply) => <div key={reply.id} className="border-brand/30 border-l-2 pl-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-brand-ink text-xs font-semibold">Resposta RBS</p>
        {canReply && <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" disabled={remove.isPending} aria-label="Excluir resposta RBS" title="Excluir resposta" onClick={() => remove.mutate(reply)}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">{reply.body}</p>
      {reply.file_name && reply.storage_path && <MaterialAttachment file={{ file_name: reply.file_name, storage_path: reply.storage_path, size_bytes: reply.size_bytes }} />}
      <p className="text-muted-foreground mt-1 break-words text-xs">{reply.created_by_email} · {formatDate(reply.created_at)}</p>
    </div>)}
    {canReply && !open && <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}><MessageSquare className="h-4 w-4" />Responder</Button>}
    {canReply && open && <form className="space-y-2 border-t pt-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
      <Label htmlFor={`reply-${material.id}`}>Resposta da RBS</Label>
      <Textarea id={`reply-${material.id}`} required value={body} disabled={send.isPending} onChange={(e) => setBody(e.target.value)} />
      <input ref={input} type="file" hidden accept={ALLOWED_TYPES.join(",")} onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={send.isPending} onClick={() => input.current?.click()}><Paperclip className="h-4 w-4" />Anexar comprovação</Button>
        {file && <><span className="min-w-0 break-all text-sm">{file.name}</span><Button type="button" variant="ghost" size="icon" disabled={send.isPending} aria-label="Remover comprovação" title="Remover comprovação" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button></>}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={send.isPending} onClick={() => setOpen(false)}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={send.isPending || !body.trim()}><Send className="h-4 w-4" />{send.isPending ? "Enviando..." : "Enviar resposta"}</Button>
      </div>
    </form>}
  </div>;
}