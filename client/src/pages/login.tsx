import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, BarChart3, ArrowRight } from "lucide-react";

export default function Login() {
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const envEmail = import.meta.env.VITE_CRM_LOGIN_EMAIL;
    const envPassword = import.meta.env.VITE_CRM_LOGIN_PASSWORD;

    setTimeout(() => {
      if (email === envEmail && password === envPassword) {
        localStorage.setItem("authToken", "demo-token"); 
        localStorage.setItem("subscriptionActive", "true"); 
        localStorage.setItem("userEmail", email);

        window.dispatchEvent(new Event("auth-changed"));

        toast({
          title: "Acesso liberado",
          description: "Bem-vindo ao painel de campanhas da Atinus.",
        });

        setLocation("/");
      } else {
        toast({
          title: "Acesso negado",
          description: "Credenciais inválidas.",
          variant: "destructive",
        });
      }

      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        
        {/* Branding / Contexto */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10">
              <BarChart3 className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">
                Atinus · Campanhas
              </h1>
              <p className="text-muted-foreground text-lg">
                Dashboard estratégico de performance
              </p>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed text-lg">
            Painel interno para acompanhamento de campanhas, leitura de
            indicadores e apoio à tomada de decisão em investimentos de mídia.
          </p>
        </div>

        {/* Login */}
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">
              Acesso restrito
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              CRM de campanhas · Atinus Urbanismo
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="nome@atinus.com.br"
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10 h-11"
                    value={password}
                    placeholder="******"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={loading}
              >
                {loading ? "Validando acesso…" : (
                  <span className="flex items-center gap-2">
                    Entrar no dashboard
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Uso interno · Atinus Urbanismo © {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
