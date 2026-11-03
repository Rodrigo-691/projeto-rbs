import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FileSection } from "@/components/FileSection";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { TabGate } from "@/components/TabGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_TYPES, BUCKET, MAX_FILE_MB, formatDate, useMe } from "@/lib/portal";
import { canDeleteMedia, groupMaterialFiles, splitMediaItems, type MediaItem } from "@/lib/media";
import { MaterialAttachment } from "@/components/MaterialAttachment";

export const Route = createFileRoute("/_authenticated/patrocinador/$id/midia")({
  head: () => ({
    meta: [
      { title: "Mídia e conteúdo | Portal Planeta Atlântida" },
      { name: "description", content: "Materiais enviados e publicações de mídia do patrocinador no Planeta Atlântida." },
      { property: "og:title", content: "Mídia e conteúdo | Portal Planeta Atlântida" },
      { property: "og:description", content: "Materiais enviados e publicações de mídia do patrocinador no Planeta Atlântida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
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
      const { data: material, error } = await supabase
        .from("media_items")
        .insert({
          sponsor_id: id,
          kind: isAdmin ? form.kind : "material",
          title: form.title.trim(),
          body: form.body || null,
          url: materialMode ? null : form.url || null,
          channel: materialMode ? null : form.channel || null,
          reach: !materialMode && form.reach ? Number(form.reach) : null,
        })
        .select("id")
        .single();
      if (error || !material) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw error ?? new Error("Não foi possível enviar o material.");
      }
      if (file && path) {
        const linked = await supabase.from("sponsor_files").insert({
          sponsor_id: id,
          tab: "midia",
          category: "material",
          media_item_id: material.id,
          file_name: file.name,
          storage_path: path,
          size_bytes: file.size,
          mime_type: file.type,
        });
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
    if (items.isPending) return <PanelNote className="border-t">Carregando...</PanelNote>;
    if (items.isError) return <PanelNote tone="error" className="border-t">Não foi possível carregar os conteúdos.</PanelNote>;
    if (items.isSuccess && rows.length === 0) return <PanelNote className="border-t">{empty}</PanelNote>;
    return (
      <PanelList>
        {rows.map((m) => (
          <li key={m.id} className="flex items-start gap-3 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={m.kind === "material" ? "secondary" : "default"}>
                  {KIND_LABEL[m.kind as Kind]}
                  {m.channel ? ` · ${m.channel}` : ""}
                </Badge>
                {m.reach ? <span className="tabular text-muted-foreground text-xs font-medium">{m.reach.toLocaleString("pt-BR")} pessoas</span> : null}
              </div>
              <p className="mt-1.5 break-words text-sm font-semibold">{m.title}</p>
              {m.body && <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words text-sm">{m.body}</p>}
              {materialGroups.materials
                .find((material) => material.id === m.id)
                ?.attachments.map((file) => <MaterialAttachment key={file.id} file={file} />)}
              <p className="text-muted-foreground mt-1.5 break-words text-xs">
                {m.created_by_email} · {formatDate(m.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {m.url && (
                <Button asChild size="icon" variant="ghost">
                  <a href={m.url} target="_blank" rel="noreferrer" aria-label="Abrir link" title="Abrir link">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {canDeleteMedia(m, me.data, id) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:text-destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(m.id)}
                  aria-label={`Excluir ${m.title}`}
                  title="Excluir conteúdo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </PanelList>
    );
  }

  return (
    <TabGate id={id} tab="midia" title="Mídia e conteúdo" intro="Envie materiais e acompanhe o que foi veiculado. Os dados alimentam o relatório final.">
      <Panel
        title={isAdmin ? "Registrar item" : "Enviar material"}
        description={
          materialMode
            ? "Suba textos, briefings e arquivos de campanha para o time de conteúdo da RBS."
            : "Registre entregas de mídia veiculada ou links publicados para compor o relatório."
        }
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="media-kind">Tipo de registro</Label>
              <NativeSelect
                id="media-kind"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}
              >
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className={isAdmin ? "space-y-1.5" : "space-y-1.5 sm:col-span-2"}>
            <Label htmlFor="media-title">Título</Label>
            <Input
              id="media-title"
              required
              aria-label="Título do material"
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          {isAdmin && form.kind !== "material" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="media-channel">Canal</Label>
                <Input
                  id="media-channel"
                  placeholder="Canal (TV, Rádio, Instagram...)"
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-reach">Alcance estimado</Label>
                <Input
                  id="media-reach"
                  type="number"
                  placeholder="Alcance (pessoas)"
                  value={form.reach}
                  onChange={(e) => setForm({ ...form, reach: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="media-url">Link da publicação</Label>
                <Input
                  id="media-url"
                  type="url"
                  placeholder="Link (opcional)"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
            </>
          )}
          {(!isAdmin || form.kind === "material") && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="media-body">Observações ou texto</Label>
              <Textarea
                id="media-body"
                aria-label="Texto do material"
                placeholder="Texto do material"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sm:col-span-2">
            {materialMode ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  hidden
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={(e) => {
                    setAttachment(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={add.isPending} onClick={() => fileInput.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                  Anexar arquivo
                </Button>
                {attachment && (
                  <>
                    <span className="min-w-0 break-words text-sm">{attachment.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={add.isPending}
                      aria-label="Remover anexo"
                      title="Remover anexo"
                      onClick={() => setAttachment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? "Enviando..." : materialMode ? "Enviar material" : "Salvar"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel flush title="Materiais enviados" description="Peças e arquivos encaminhados pela marca para produção e veiculação.">
        {mediaList(groups.materials, "Nenhum material enviado ainda.")}
        {files.isError && <PanelNote tone="error" className="border-t">Não foi possível carregar os anexos.</PanelNote>}
        {materialGroups.standalone.map((file) => (
          <div key={file.id} className="flex items-start gap-3 border-t px-5 py-3">
            <div className="min-w-0 flex-1">
              <MaterialAttachment file={file} />
              <p className="text-muted-foreground mt-1 text-xs">
                {file.uploaded_by_email} · {formatDate(file.created_at)}
              </p>
            </div>
            {(isAdmin || file.uploaded_by === me.data?.id) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:text-destructive"
                aria-label={`Excluir ${file.file_name}`}
                onClick={async () => {
                  const result = await supabase.from("sponsor_files").delete().eq("id", file.id).select("id");
                  if (result.error || !result.data?.length) {
                    toast.error(result.error?.message ?? "Não foi possível excluir o arquivo.");
                    return;
                  }
                  const deleted = await supabase.storage.from(BUCKET).remove([file.storage_path]);
                  if (deleted.error) toast.warning("Registro excluído, mas não foi possível limpar o arquivo armazenado.");
                  qc.invalidateQueries({ queryKey: ["files", id, "material"] });
                  qc.invalidateQueries({ queryKey: ["audit", id] });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </Panel>

      <FileSection sponsorId={id} tab="midia" category="relatorio_midia" title="Relatórios de mídia (RBS)" description="Planilhas e comprovantes de veiculação consolidados pela RBS." uploader="admin" />

      <Panel flush title="Linha do tempo RBS" description="Veiculações e posts publicados pela RBS durante a parceria.">
        {mediaList(groups.publications, "Nenhuma publicação da RBS ainda.")}
      </Panel>
    </TabGate>
  );
}
