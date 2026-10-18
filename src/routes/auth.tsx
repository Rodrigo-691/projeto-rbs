import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Portal do Patrocinador" },
      { name: "description", content: "Acesso restrito a e-mails liberados pela RBS." },
      { property: "og:title", content: "Entrar — Portal do Patrocinador" },
      { property: "og:description", content: "Acesso restrito a e-mails liberados pela RBS." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      } else if (mode === "signup") {
        const { data: allowed } = await supabase.rpc("is_email_allowed", { _email: email });
        if (!allowed) {
          toast.error("Este e-mail não foi liberado pela RBS. Fale com o time B2B.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/painel" },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir a senha.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-ocean-gradient flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="bg-card shadow-soft w-full max-w-sm space-y-4 rounded-2xl p-7">
        <div>
          <p className="text-primary text-xs font-semibold uppercase tracking-widest">Planeta Atlântida</p>
          <h1 className="mt-1 text-2xl font-extrabold">
            {mode === "login" ? "Entrar" : mode === "signup" ? "Primeiro acesso" : "Esqueci a senha"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "signup" ? "Use o e-mail que a RBS cadastrou para sua marca." : "Acesso restrito a e-mails liberados."}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "reset" && (
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar senha" : "Enviar link"}
        </Button>
        <div className="flex justify-between text-sm">
          {mode === "login" ? (
            <>
              <button type="button" className="text-primary font-medium" onClick={() => setMode("signup")}>Primeiro acesso</button>
              <button type="button" className="text-muted-foreground" onClick={() => setMode("reset")}>Esqueci a senha</button>
            </>
          ) : (
            <button type="button" className="text-primary font-medium" onClick={() => setMode("login")}>Voltar para entrar</button>
          )}
        </div>
      </form>
    </div>
  );
}
