import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { PublicStyleSwitcher, usePublicVariant } from "@/components/PublicStyleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Portal do Patrocinador" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Nova senha — Portal do Patrocinador" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [variant, setVariant] = usePublicVariant();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Senha atualizada");
      navigate({ to: "/painel" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={variant === "expressive" ? "bg-sidebar flex min-h-dvh items-center justify-center px-4" : "bg-background flex min-h-dvh items-center justify-center px-4"}>
        <form onSubmit={submit} className="bg-card text-foreground w-full max-w-sm space-y-5 rounded-lg border p-7">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" alt="" />
            <div className="leading-tight">
              <span className="block text-sm font-semibold">Portal do Patrocinador</span>
              <span className="text-muted-foreground block text-xs">Planeta Atlântida</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
            <p className="text-muted-foreground mt-1 text-sm">Defina uma nova senha para acessar o portal.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>
      <PublicStyleSwitcher variant={variant} onChange={setVariant} />
    </>
  );
}
