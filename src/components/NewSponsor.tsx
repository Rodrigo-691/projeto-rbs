import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
        await qc.invalidateQueries({ queryKey: ["audit", id] });
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
        await qc.invalidateQueries({ queryKey: ["audit", id] });
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
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Cadastrar novo patrocinador</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar novo patrocinador</DialogTitle>
          <DialogDescription>Os dados aparecem no perfil da marca. O plano comercial é opcional e pode ser enviado depois.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); setError(""); create.mutate(); }} className="space-y-6">
          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="new-sponsor-name">Nome da marca</Label><Input {...field("name")} required pattern=".*\S.*" /></div>
            <div className="space-y-1.5">
              <Label htmlFor="new-sponsor-quota">Cota</Label>
              <NativeSelect id="new-sponsor-quota" value={form.quota} disabled={create.isPending || !!createdId} onChange={(e) => setForm({ ...form, quota: e.target.value as Quota })}>
                {Object.entries(QUOTA_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5"><Label htmlFor="new-sponsor-cnpj">CNPJ</Label><Input {...field("cnpj")} placeholder="00.000.000/0000-00" /></div>
            <div className="space-y-1.5"><Label htmlFor="new-sponsor-segment">Segmento</Label><Input {...field("segment")} /></div>
            <div className="space-y-1.5"><Label htmlFor="new-sponsor-contact_name">Contato principal</Label><Input {...field("contact_name")} /></div>
            <div className="space-y-1.5"><Label htmlFor="new-sponsor-contact_phone">Telefone</Label><Input {...field("contact_phone")} type="tel" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="new-sponsor-notes">Observações</Label><Textarea {...field("notes")} /></div>
          </div>
          <div className="bg-muted/70 space-y-2 rounded-lg p-4">
            <Label htmlFor="new-sponsor-plan">Plano comercial</Label>
            <div className="flex items-center gap-2">
              <Input id="new-sponsor-plan" type="file" accept={ALLOWED_TYPES.join(",")} disabled={create.isPending} aria-describedby="new-sponsor-plan-hint" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }} className="h-auto min-w-0 py-1.5" />
              {file && <Button type="button" size="icon" variant="ghost" disabled={create.isPending} aria-label="Remover plano comercial" onClick={() => {
                setFile(null);
                const input = document.getElementById("new-sponsor-plan");
                if (input instanceof HTMLInputElement) input.value = "";
              }}><X className="h-4 w-4" /></Button>}
            </div>
            <p id="new-sponsor-plan-hint" className="text-muted-foreground text-xs">{file ? `${file.name} · ${formatBytes(file.size)}` : `Opcional · até ${MAX_FILE_MB} MB`}</p>
          </div>
          {error && <div role="alert" className="bg-destructive/5 text-destructive space-y-1 rounded-lg px-4 py-3 text-sm">{createdId && <p className="font-medium">Patrocinador já cadastrado. O plano comercial não foi salvo; tente enviar novamente ou conclua sem anexo.</p>}<p>{error}</p></div>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" disabled={create.isPending} onClick={() => { setOpen(false); reset(); }}>{createdId ? "Fechar" : "Cancelar"}</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Salvando..." : createdId ? "Concluir cadastro" : "Cadastrar patrocinador"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
