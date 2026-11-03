import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelList, PanelNote } from "@/components/Panel";
import { ALLOWED_TYPES, BUCKET, MAX_FILE_MB, formatBytes, formatDate, useMe } from "@/lib/portal";

type Props = {
  sponsorId: string;
  tab: string;
  category: string;
  title: string;
  description?: string;
  /** who may upload: "admin" (RBS only) or "all" (sponsor too) */
  uploader: "admin" | "all";
};

export function FileSection({ sponsorId, tab, category, title, description, uploader }: Props) {
  const me = useMe();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const key = ["files", sponsorId, category];
  const files = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_files")
        .select("*")
        .eq("sponsor_id", sponsorId)
        .eq("category", category)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const canUpload = uploader === "all" || me.data?.isAdmin;

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Arquivo maior que ${MAX_FILE_MB} MB`);
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Tipo de arquivo não permitido");
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${sponsorId}/${category}/${Date.now()}_${safe}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("sponsor_files").insert({
        sponsor_id: sponsorId,
        tab,
        category,
        file_name: file.name,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type,
      });
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Arquivo enviado");
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function download(path: string) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(id: string, path: string) {
    const { error } = await supabase.from("sponsor_files").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([path]);
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <Panel
      flush
      title={title}
      description={description}
      actions={
        canUpload && (
          <>
            <input
              ref={input}
              type="file"
              hidden
              accept={ALLOWED_TYPES.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
            <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={upload.isPending}>
              <Upload className="h-4 w-4" /> {upload.isPending ? "Enviando..." : "Enviar arquivo"}
            </Button>
          </>
        )
      }
    >
      {files.isPending && <PanelNote className="border-t">Carregando arquivos...</PanelNote>}
      {files.isError && <PanelNote tone="error" className="border-t">Não foi possível carregar os arquivos.</PanelNote>}
      {files.data?.length === 0 && (
        <PanelNote className="border-t">
          {canUpload ? `Nenhum arquivo ainda. Envie PDF, imagem, ZIP ou documento do Office de até ${MAX_FILE_MB} MB.` : "Nenhum arquivo ainda. A RBS publica este documento aqui."}
        </PanelNote>
      )}
      {!!files.data?.length && (
        <PanelList>
          {files.data.map((f) => (
            <li key={f.id} className="hover:bg-muted/60 flex items-center gap-3 px-5 py-3 transition-colors">
              <span className="bg-brand-soft text-brand-ink grid h-8 w-8 shrink-0 place-items-center rounded-md">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={f.file_name}>{f.file_name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {formatBytes(f.size_bytes)} · {f.uploaded_by_email} · {formatDate(f.created_at)}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => download(f.storage_path)} aria-label={`Baixar ${f.file_name}`} title="Baixar">
                <Download className="h-4 w-4" />
              </Button>
              {(me.data?.isAdmin || f.uploaded_by === me.data?.id) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:text-destructive"
                  onClick={() => remove(f.id, f.storage_path)}
                  aria-label={`Excluir ${f.file_name}`}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}
