import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
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

type PageState = "loading" | "ready" | "invalid";

function ResetPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initRecovery() {
      try {
        // 1. Check for errors in URL (query params or hash fragment)
        const searchParams = new URLSearchParams(window.location.search);
        const queryError = searchParams.get("error_description") || searchParams.get("error");
        if (queryError) {
          if (isMounted) {
            setErrorMessage(decodeURIComponent(queryError));
            setStatus("invalid");
          }
          return;
        }

        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashError = hashParams.get("error_description") || hashParams.get("error");
          if (hashError) {
            if (isMounted) {
              setErrorMessage(decodeURIComponent(hashError));
              setStatus("invalid");
            }
            return;
          }
        }

        // 2. Check for PKCE ?code= parameter and exchange it for a session
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Erro ao trocar código por sessão:", error);
            if (isMounted) {
              setErrorMessage(
                error.message || "O link de recuperação expirou ou é inválido. Solicite um novo."
              );
              setStatus("invalid");
            }
            return;
          }
          if (data.session && isMounted) {
            setStatus("ready");
            return;
          }
        }

        // 3. Check existing active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          if (isMounted) setStatus("ready");
          return;
        }

        // 4. Listen to auth changes for PASSWORD_RECOVERY event
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!isMounted) return;
          if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
            setStatus("ready");
          }
        });

        // Fallback timeout: if no session or token is detected after 3 seconds
        const timer = setTimeout(() => {
          if (isMounted && status === "loading") {
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                setStatus("ready");
              } else {
                setErrorMessage(
                  "Não foi possível identificar um link de recuperação ativo. Acesse o link enviado ao seu e-mail ou solicite um novo."
                );
                setStatus("invalid");
              }
            });
          }
        }, 3000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err: any) {
        if (isMounted) {
          console.error("Erro na inicialização da redefinição:", err);
          setErrorMessage(err?.message || "Erro inesperado ao verificar link.");
          setStatus("invalid");
        }
      }
    }

    initRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("A senha deve conter no mínimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/painel" });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar nova senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background flex min-h-dvh flex-col justify-between px-4 py-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link
          to="/auth"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <ThemeToggle variant="pill" />
      </div>

      <div className="my-auto flex justify-center py-8">
        <div className="bg-card text-foreground w-full max-w-md space-y-5 rounded-xl border p-7 shadow-xs">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-lg" alt="" />
            <div className="leading-tight">
              <span className="block text-sm font-semibold">Portal do Patrocinador</span>
              <span className="text-muted-foreground block text-xs">Planeta Atlântida</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Defina sua nova credencial de acesso ao portal corporativo.
            </p>
          </div>

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Validando link de recuperação...</p>
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Link expirado ou inválido</p>
                  <p className="leading-relaxed">
                    {errorMessage ||
                      "O link de redefinição de senha já foi utilizado ou expirou o prazo limite de segurança."}
                  </p>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link to="/auth">
                  Solicitar novo link de redefinição
                </Link>
              </Button>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={submit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-destructive">As senhas não coincidem.</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Senhas conferem.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || password.length < 8 || password !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Salvar nova senha
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs">Grupo RBS · Planejamento B2B</p>
    </div>
  );
}
