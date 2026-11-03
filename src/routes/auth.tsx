import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { PublicStyleSwitcher, usePublicVariant } from "@/components/PublicStyleSwitcher";
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
  const [variant, setVariant] = usePublicVariant();
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

  const formCard = (
    <form onSubmit={submit} className="w-full max-w-sm space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10 rounded-lg" alt="" />
          <div className="leading-tight">
            <span className="block text-sm font-semibold">Portal do Patrocinador</span>
            <span className="text-muted-foreground block text-xs">Planeta Atlântida</span>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Entrar" : mode === "signup" ? "Primeiro acesso" : "Esqueci a senha"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "signup"
            ? "Use o e-mail que a RBS cadastrou para sua marca."
            : "Acesso restrito a e-mails liberados."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {mode !== "reset" && (
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              aria-describedby={mode === "signup" ? "password-hint" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "signup" && (
              <p id="password-hint" className="text-muted-foreground text-xs">
                Mínimo de 8 caracteres.
              </p>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar senha" : "Enviar link"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        {mode === "login" ? (
          <>
            <button type="button" className="text-brand-ink cursor-pointer font-medium hover:underline" onClick={() => setMode("signup")}>
              Primeiro acesso
            </button>
            <button type="button" className="text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setMode("reset")}>
              Esqueci a senha
            </button>
          </>
        ) : (
          <button type="button" className="text-brand-ink cursor-pointer font-medium hover:underline" onClick={() => setMode("login")}>
            Voltar para entrar
          </button>
        )}
      </div>
    </form>
  );

  return (
    <>
      {variant === "expressive" ? (
        <div className="grid min-h-dvh lg:grid-cols-12">
          <div className="bg-sidebar text-sidebar-foreground hidden flex-col justify-between p-10 lg:col-span-6 lg:flex">
            <Link to="/" className="text-sidebar-muted hover:text-sidebar-foreground inline-flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </Link>
            <div className="max-w-md space-y-5">
              <BrandMark className="h-16 w-16 rounded-2xl bg-sidebar-accent p-2" alt="Planeta Atlântida" />
              <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
                Toda a parceria da sua marca em um só lugar.
              </h2>
              <p className="text-sidebar-muted text-sm leading-relaxed">
                Envie MIV, logos e materiais de campanha, cadastre signatários do contrato e acompanhe os relatórios de mídia e pesquisa do Planeta Atlântida.
              </p>
            </div>
            <div className="border-sidebar-border flex items-center justify-between border-t pt-5 text-xs">
              <span className="text-sun font-semibold">Planeta Atlântida 2026</span>
              <span className="text-sidebar-muted">Grupo RBS · Planejamento B2B</span>
            </div>
          </div>
          <div className="bg-background flex flex-col justify-between p-6 lg:col-span-6 lg:p-12">
            <div className="lg:hidden">
              <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
                <ArrowLeft className="h-4 w-4" /> Início
              </Link>
            </div>
            <div className="my-auto flex justify-center py-8">
              <div className="bg-card w-full max-w-sm rounded-lg border p-7">{formCard}</div>
            </div>
            <p className="text-muted-foreground text-center text-xs">
              Dúvidas no acesso? Procure o atendimento B2B da RBS.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-background flex min-h-dvh flex-col justify-between px-4 py-6">
          <div className="mx-auto w-full max-w-5xl">
            <Link to="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </Link>
          </div>
          <div className="my-auto flex justify-center py-8">
            <div className="bg-card w-full max-w-sm rounded-lg border p-7">{formCard}</div>
          </div>
          <p className="text-muted-foreground text-center text-xs">Grupo RBS · Planejamento B2B</p>
        </div>
      )}
      <PublicStyleSwitcher variant={variant} onChange={setVariant} />
    </>
  );
}
