import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { TabGate } from "@/components/TabGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_TYPES, BUCKET, MAX_FILE_MB, formatDate, useMe } from "@/lib/portal";
import { canDeleteMedia, groupMaterialFiles, splitMediaItems, type MediaItem } from "@/lib/media";
import { MaterialAttachment } from "@/components/MaterialAttachment";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/midia")({
  head: () => ({ meta: [
    { title: "Mídia e conteúdo | Portal Planeta Atlântida" },
    { name: "description", content: "Materiais enviados e publicações de mídia do patrocinador no Planeta Atlântida." },
    { property: "og:title", content: "Mídia e conteúdo | Portal Planeta Atlântida" },
    { property: "og:description", content: "Materiais enviados e publicações de mídia do patrocinador no Planeta Atlântida." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Midia,
});

const KIND_LABEL = { material: "Material enviado", report: "Mídia veiculada", post_link: "Link de post" } as const;
type Kind = keyof typeof KIND_LABEL;

function Midia() {
  const { id } = Route.useParams();
  const me = useMe();
  const isAdmin = !!me.data?.isAdmin;
  const qc = useQueryClient();
  const items = useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_items").select("*").eq("sponsor_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ kind: "material" as Kind, title: "", body: "", url: "", channel: "", reach: "" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const materialMode = !isAdmin || form.kind === "material";
  const files = useQuery({
    queryKey: ["files", id, "material"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsor_files").select("*").eq("sponsor_id", id).eq("category", "material").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      let path: string | null = null;
      const file = materialMode ? attachment : null;
      if (file) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Arquivo maior que ${MAX_FILE_MB} MB`);
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Tipo de arquivo não permitido");
        path = `${id}/material/${crypto.randomUUID()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (upload.error) throw upload.error;
      }
      const { data: material, error } = await supabase.from("media_items").insert({
        sponsor_id: id,
        kind: isAdmin ? form.kind : "material",
        title: form.title.trim(),
        body: form.body || null,
        url: materialMode ? null : form.url || null,
        channel: materialMode ? null : form.channel || null,
        reach: !materialMode && form.reach ? Number(form.reach) : null,
      }).select("id").single();
      if (error || !material) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw error ?? new Error("Não foi possível enviar o material.");
      }
      if (file && path) {
        const linked = await supabase.from("sponsor_files").insert({ sponsor_id: id, tab: "midia", category: "material", media_item_id: material.id, file_name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type });
        if (linked.error) {
          await supabase.from("media_items").delete().eq("id", material.id);
          await supabase.storage.from(BUCKET).remove([path]);
          throw linked.error;
        }
      }
    },
    onSuccess: () => {
      setForm({ ...form, title: "", body: "", url: "", channel: "", reach: "" });
      setAttachment(null);
      toast.success(materialMode ? "Material enviado" : "Registrado");
      qc.invalidateQueries({ queryKey: ["media", id] });
      qc.invalidateQueries({ queryKey: ["files", id, "material"] });
      qc.invalidateQueries({ queryKey: ["audit", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const groups = splitMediaItems(items.data ?? []);
  const materialGroups = groupMaterialFiles(groups.materials, files.data ?? []);
  const remove = useMutation({
    mutationFn: async (mid: string) => {
      const attachments = (files.data ?? []).filter((file) => file.media_item_id === mid);
      const { data, error } = await supabase.from("media_items").delete().eq("id", mid).eq("sponsor_id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Não foi possível excluir este conteúdo.");
      if (attachments.length) {
        const deleted = await supabase.storage.from(BUCKET).remove(attachments.map((file) => file.storage_path));
        if (deleted.error) toast.warning("Material excluído, mas não foi possível limpar o arquivo armazenado.");
      }
    },
    onSuccess: () => {
      toast.success("Conteúdo excluído");
      qc.invalidateQueries({ queryKey: ["media", id] });
      qc.invalidateQueries({ queryKey: ["files", id, "material"] });
      qc.invalidateQueries({ queryKey: ["audit", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  function mediaList(rows: MediaItem[], empty: string) {
    return <ul className="divide-y">
      {items.isPending && <li className="text-muted-foreground px-5 py-3 text-sm">Carregando...</li>}
      {items.isError && <li className="text-destructive px-5 py-3 text-sm">Não foi possível carregar os conteúdos.</li>}
      {items.isSuccess && rows.length === 0 && <li className="text-muted-foreground px-5 py-3 text-sm">{empty}</li>}
      {rows.map((m) => <li key={m.id} className="flex gap-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-primary text-xs font-semibold uppercase">{KIND_LABEL[m.kind as Kind]}{m.channel ? ` · ${m.channel}` : ""}</p>
          <p className="break-words font-medium">{m.title}</p>
          {m.body && <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words text-sm">{m.body}</p>}
          {materialGroups.materials.find((material) => material.id === m.id)?.attachments.map((file) => <MaterialAttachment key={file.id} file={file} />)}
          <p className="text-muted-foreground mt-1 break-words text-xs">{m.reach ? `${m.reach.toLocaleString("pt-BR")} pessoas · ` : ""}{m.created_by_email} · {formatDate(m.created_at)}</p>
        </div>
        {m.url && <a href={m.url} target="_blank" rel="noreferrer" aria-label="Abrir link" className="text-primary shrink-0"><ExternalLink className="h-4 w-4" /></a>}
        {canDeleteMedia(m, me.data, id) && <Button size="icon" variant="ghost" className="shrink-0" disabled={remove.isPending} onClick={() => remove.mutate(m.id)} aria-label={`Excluir ${m.title}`} title="Excluir conteúdo"><Trash2 className="h-4 w-4" /></Button>}
      </li>)}
    </ul>;
  }

  return (
    <TabGate id={id} tab="midia" title="Mídia e conteúdo" intro="Envie materiais e acompanhe o que foi veiculado. Os dados alimentam o relatório final.">
      <form className="bg-card grid gap-2 rounded-2xl border p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
        <h3 className="font-bold sm:col-span-2">{isAdmin ? "Registrar item" : "Enviar material"}</h3>
        {isAdmin && (
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
            {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        <Input required aria-label="Título do material" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        {isAdmin && form.kind !== "material" && (
          <>
            <Input placeholder="Canal (TV, Rádio, Instagram...)" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} />
            <Input type="number" placeholder="Alcance (pessoas)" value={form.reach} onChange={(e) => setForm({ ...form, reach: e.target.value })} />
            <Input type="url" placeholder="Link (opcional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="sm:col-span-2" />
          </>
        )}
        {(!isAdmin || form.kind === "material") && (
          <Textarea aria-label="Texto do material" placeholder="Texto do material" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="sm:col-span-2" />
        )}
        {materialMode && <div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2">
          <input ref={fileInput} type="file" hidden accept={ALLOWED_TYPES.join(",")} onChange={(e) => { setAttachment(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          <Button type="button" variant="outline" disabled={add.isPending} onClick={() => fileInput.current?.click()}><Paperclip className="h-4 w-4" />Anexar arquivo</Button>
          {attachment && <><span className="min-w-0 break-words text-sm">{attachment.name}</span><Button type="button" size="icon" variant="ghost" disabled={add.isPending} aria-label="Remover anexo" title="Remover anexo" onClick={() => setAttachment(null)}><X className="h-4 w-4" /></Button></>}
        </div>}
        <Button type="submit" className="sm:col-span-2 sm:justify-self-end" disabled={add.isPending}>{add.isPending ? "Enviando..." : materialMode ? "Enviar material" : "Salvar"}</Button>
      </form>

      <section className="space-y-4">
        <h3 className="text-xl font-bold">Materiais enviados</h3>
        <div className="rounded-lg border">
          {mediaList(groups.materials, "Nenhum material enviado ainda.")}
          {files.isError && <p className="text-destructive px-5 py-3 text-sm">Não foi possível carregar os anexos.</p>}
          {materialGroups.standalone.map((file) => <div key={file.id} className="flex items-start gap-3 border-t px-5 py-3">
            <div className="min-w-0 flex-1"><MaterialAttachment file={file} /><p className="text-muted-foreground text-xs">{file.uploaded_by_email} · {formatDate(file.created_at)}</p></div>
            {(isAdmin || file.uploaded_by === me.data?.id) && <Button type="button" variant="ghost" size="icon" aria-label={`Excluir ${file.file_name}`} onClick={async () => {
              const result = await supabase.from("sponsor_files").delete().eq("id", file.id).select("id");
              if (result.error || !result.data?.length) { toast.error(result.error?.message ?? "Não foi possível excluir o arquivo."); return; }
              const deleted = await supabase.storage.from(BUCKET).remove([file.storage_path]);
              if (deleted.error) toast.warning("Registro excluído, mas não foi possível limpar o arquivo armazenado.");
              qc.invalidateQueries({ queryKey: ["files", id, "material"] });
              qc.invalidateQueries({ queryKey: ["audit", id] });
            }}><Trash2 className="h-4 w-4" /></Button>}
          </div>)}
        </div>
      </section>
      <FileSection sponsorId={id} tab="midia" category="relatorio_midia" title="Relatórios de mídia (RBS)" uploader="admin" />

      <div className="bg-card rounded-2xl border">
        <div className="border-b px-5 py-3 font-semibold">Linha do tempo RBS</div>
        {mediaList(groups.publications, "Nenhuma publicação da RBS ainda.")}
      </div>
    </TabGate>
  );
}
