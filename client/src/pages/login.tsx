
import React, { useState } from "react";
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
  TrendingUp, 
  BarChart3, 
  Target, 
  Zap,
  Shield,
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === "admin@test.com" && password === "123456") {
        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("subscriptionActive", "true");
        localStorage.setItem("userEmail", email);
        window.dispatchEvent(new Event("auth-changed"));
        setLocation("/dashboard");
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao MarketingHub Pro",
        });
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
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
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse delay-500" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Enhanced Branding */}
          <div className="hidden lg:block space-y-12 animate-fade-up">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="gradient-bg p-4 rounded-2xl shadow-lg">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    MarketingHub Pro
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Plataforma de Analytics Avançado
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">
                  Transforme dados em resultados
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Centralize todas suas campanhas de marketing digital em uma única plataforma inteligente 
                  com IA para otimização de ROI e insights em tempo real.
                </p>
              </div>
            </div>

            <div className="grid gap-8">
              <div className="flex items-start space-x-4 group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Dashboard Unificado
                  </h3>
                  <p className="text-muted-foreground">
                    Visualize KPIs de todas suas campanhas em tempo real com 
                    relatórios automatizados e insights acionáveis.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Integração Total
                  </h3>
                  <p className="text-muted-foreground">
                    Conecte Google Ads, Meta Ads, TikTok, HubSpot e mais de 50 
                    plataformas em poucos cliques.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    IA para Otimização
                  </h3>
                  <p className="text-muted-foreground">
                    Algoritmos inteligentes identificam oportunidades e sugerem 
                    otimizações para maximizar resultados.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">+500%</div>
                <div className="text-sm text-muted-foreground">ROI Médio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Suporte</div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Login Form */}
          <div className="w-full max-w-md mx-auto animate-fade-up">
            <Card className="shadow-2xl border-0 glass-effect">
              <CardHeader className="space-y-6 text-center pb-8">
                <div className="lg:hidden flex justify-center">
                  <div className="gradient-bg p-4 rounded-2xl shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Bem-vindo de volta
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Entre com suas credenciais para acessar seu dashboard
                  </CardDescription>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Seguro</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Confiável</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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

                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
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
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Entrar no Dashboard</span>
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
                      Ou continue com
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 hover:border-primary/50 transition-all group"
                    onClick={() => setLocation("/trial-signup")}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Teste gratuito de 7 dias</span>
                    </div>
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <button
                      onClick={() => setLocation("/trial-signup")}
                      className="text-primary hover:text-primary/80 font-semibold hover:underline transition-all"
                    >
                      Criar conta gratuita
                    </button>
                  </p>
                </div>

                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Dados para demonstração:
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
