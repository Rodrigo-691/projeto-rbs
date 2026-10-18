import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import { Download, Trash2, Upload, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
    <div className="bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{title}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        {canUpload && (
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
            <Button size="sm" onClick={() => input.current?.click()} disabled={upload.isPending}>
              <Upload className="h-4 w-4" /> {upload.isPending ? "Enviando..." : "Enviar arquivo"}
            </Button>
          </>
        )}
      </div>
      <ul className="mt-3 divide-y">
        {files.data?.length === 0 && <li className="text-muted-foreground py-2 text-sm">Nenhum arquivo ainda.</li>}
        {files.data?.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-2">
            <FileText className="text-primary h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{f.file_name}</p>
              <p className="text-muted-foreground text-xs">
                {formatBytes(f.size_bytes)} · {f.uploaded_by_email} · {formatDate(f.created_at)}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => download(f.storage_path)} aria-label="Baixar">
              <Download className="h-4 w-4" />
            </Button>
            {(me.data?.isAdmin || f.uploaded_by === me.data?.id) && (
              <Button size="icon" variant="ghost" onClick={() => remove(f.id, f.storage_path)} aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
