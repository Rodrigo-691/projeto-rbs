import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <div className="bg-background flex min-h-dvh flex-col justify-between px-4 py-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/auth" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      <div className="my-auto flex justify-center py-8">
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

      <p className="text-muted-foreground text-center text-xs">Grupo RBS · Planejamento B2B</p>
    </div>
  );
}
