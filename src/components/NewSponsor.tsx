import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ALLOWED_TYPES, BUCKET, MAX_FILE_MB, QUOTA_LABEL, formatBytes, type Quota } from "@/lib/portal";

const emptyForm = {
  name: "", quota: "subcota" as Quota, cnpj: "", segment: "",
  contact_name: "", contact_phone: "", notes: "",
};

export function NewSponsor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function reset() {
    setForm(emptyForm);
    setFile(null);
    setCreatedId(null);
    setError("");
  }

  const create = useMutation({
    mutationFn: async () => {
      if (file && file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Arquivo maior que ${MAX_FILE_MB} MB`);
      if (file && !ALLOWED_TYPES.includes(file.type)) throw new Error("Tipo de arquivo não permitido");
      let id = createdId;
      if (!id) {
        const { data, error: insertError } = await supabase.from("sponsors").insert({
          ...form, name: form.name.trim(),
        }).select("id").single();
        if (insertError) throw insertError;
        if (!data) throw new Error("Não foi possível confirmar o cadastro do patrocinador.");
        id = data.id;
        setCreatedId(id);
        await qc.invalidateQueries({ queryKey: ["sponsors"] });
      }
      if (file) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${id}/plano_comercial/${crypto.randomUUID()}_${safeName}`;
        const uploaded = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (uploaded.error) throw uploaded.error;
        const { error: metadataError } = await supabase.from("sponsor_files").insert({
          sponsor_id: id, tab: "perfil", category: "plano_comercial",
          file_name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type,
        });
        if (metadataError) {
          const cleanup = await supabase.storage.from(BUCKET).remove([path]);
          if (cleanup.error) throw new Error(`${metadataError.message} O arquivo não pôde ser removido do armazenamento; confira o plano comercial antes de tentar novamente.`);
          throw metadataError;
        }
        await qc.invalidateQueries({ queryKey: ["files", id, "plano_comercial"] });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsors"] });
      toast.success(file ? "Patrocinador cadastrado com plano comercial" : "Patrocinador cadastrado");
      setOpen(false);
      reset();
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const field = (key: Exclude<keyof typeof form, "quota">) => ({
    id: `new-sponsor-${key}`,
    value: form[key],
    disabled: create.isPending || !!createdId,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (create.isPending) return;
      setOpen(next);
      if (!next) reset();
    }}>
      <div className="flex justify-end">
        <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Cadastrar novo patrocinador</Button></DialogTrigger>
      </div>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Cadastrar novo patrocinador</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate(); }} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="new-sponsor-name">Nome da marca</Label><Input {...field("name")} required pattern=".*\S.*" /></div>
            <div className="space-y-1">
              <Label htmlFor="new-sponsor-quota">Cota</Label>
              <select id="new-sponsor-quota" value={form.quota} disabled={create.isPending || !!createdId} onChange={(e) => setForm({ ...form, quota: e.target.value as Quota })} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-50">
                {Object.entries(QUOTA_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label htmlFor="new-sponsor-cnpj">CNPJ</Label><Input {...field("cnpj")} placeholder="00.000.000/0000-00" /></div>
            <div className="space-y-1"><Label htmlFor="new-sponsor-segment">Segmento</Label><Input {...field("segment")} /></div>
            <div className="space-y-1"><Label htmlFor="new-sponsor-contact_name">Contato principal</Label><Input {...field("contact_name")} /></div>
            <div className="space-y-1"><Label htmlFor="new-sponsor-contact_phone">Telefone</Label><Input {...field("contact_phone")} type="tel" /></div>
            <div className="space-y-1 sm:col-span-2"><Label htmlFor="new-sponsor-notes">Observações</Label><Textarea {...field("notes")} /></div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="new-sponsor-plan">Plano comercial</Label>
            <div className="flex items-center gap-2">
              <Upload className="text-muted-foreground h-4 w-4 shrink-0" />
              <Input id="new-sponsor-plan" type="file" accept={ALLOWED_TYPES.join(",")} disabled={create.isPending} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }} className="h-auto min-w-0 py-2" />
              {file && <Button type="button" size="icon" variant="ghost" disabled={create.isPending} aria-label="Remover plano comercial" onClick={() => {
                setFile(null);
                const input = document.getElementById("new-sponsor-plan");
                if (input instanceof HTMLInputElement) input.value = "";
              }}><X className="h-4 w-4" /></Button>}
            </div>
            <p className="text-muted-foreground text-xs">{file ? `${file.name} · ${formatBytes(file.size)}` : `Opcional · até ${MAX_FILE_MB} MB`}</p>
          </div>
          {error && <div role="alert" className="text-destructive text-sm">{createdId && <p>Patrocinador já cadastrado. O plano comercial não foi salvo; tente enviar novamente ou conclua sem anexo.</p>}<p>{error}</p></div>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={create.isPending} onClick={() => { setOpen(false); reset(); }}>{createdId ? "Fechar" : "Cancelar"}</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Salvando..." : createdId ? "Concluir cadastro" : "Cadastrar patrocinador"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}