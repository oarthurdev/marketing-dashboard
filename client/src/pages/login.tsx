import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Rocket
} from "lucide-react";

/**
 * ✅ Fixes:
 * 1) Remove mockLogin (mantém autenticação como no código original)
 * 2) Mantém redirect para /dashboard
 * 3) Tela branca: normalmente é rota /dashboard não registrada OU componente crashando.
 *    Então eu te entrego também um Guard + um Dashboard mínimo pra garantir render.
 */

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Se já estiver logado, manda pra dashboard
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setLocation("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mantém o comportamento original
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (email === "admin@atinus.com.br" && password === "Atinus2025") {
        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("subscriptionActive", "true");
        localStorage.setItem("userEmail", email);

        // Se teu app depende disso (header/guards), mantém:
        window.dispatchEvent(new Event("auth-changed"));

        // ✅ redirect
        setLocation("/dashboard");

        toast({
          title: "Login realizado com sucesso!",
          description: "Abrindo a dashboard de campanhas…",
        });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro no login",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div className="hidden lg:block space-y-8 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="gradient-bg p-4 rounded-2xl shadow-lg">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Campaigns Dashboard
                </h1>
                <p className="text-lg text-muted-foreground">
                  Visualização simples, rápida e acionável
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-lg text-muted-foreground leading-relaxed">
                Aqui é papo reto: uma dashboard pra você enxergar o que importa nas
                campanhas — performance, tendência e comparação — sem firula.
              </p>
            </div>

            <div className="grid gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Acesso controlado</h3>
                  <p className="text-sm text-muted-foreground">
                    Login básico (demo) — pronto pra plugar seu auth real depois.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Foco em leitura</h3>
                  <p className="text-sm text-muted-foreground">
                    Projeto “dashboard-only”: nada de trial, assinatura, onboarding infinito.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="w-full max-w-md mx-auto animate-fade-up">
            <Card className="shadow-2xl border-0 glass-effect">
              <CardHeader className="space-y-3 text-center pb-6">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Entrar
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Acesse a dashboard de campanhas
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 border-2 focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 border-2 focus:border-primary/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 gradient-bg hover:opacity-90 font-semibold text-base shadow-lg transition-all duration-200 group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Entrando…</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Acessar dashboard</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-medium">
                      Demo
                    </span>
                  </div>
                </div>

                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Credenciais de demonstração:
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    admin@test.com / 123456
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}