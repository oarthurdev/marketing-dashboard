import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, CreditCard } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

type GuardState =
  | "loading"
  | "authenticated"
  | "trial"
  | "expired"
  | "unauthenticated";

export default function AuthGuard({ children }: AuthGuardProps) {
  const [location, setLocation] = useLocation();
  const [authState, setAuthState] = useState<GuardState>("loading");

  const computeAuthState = () => {
    const authToken = localStorage.getItem("authToken");
    const trialStarted = localStorage.getItem("trialStarted");
    const trialExpiry = localStorage.getItem("trialExpiry");
    const subscriptionActive = localStorage.getItem("subscriptionActive");

    if (authToken && subscriptionActive === "true") return "authenticated";

    if (trialStarted && trialExpiry) {
      const expiryDate = new Date(trialExpiry);
      const now = new Date();
      return now < expiryDate ? "trial" : "expired";
    }

    return "unauthenticated";
  };

  // Checagem inicial + listeners
  useEffect(() => {
    const update = () => setAuthState(computeAuthState());
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("storage", update);
    window.addEventListener("auth-changed", update as EventListener);
    return () => {
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("storage", update);
      window.removeEventListener("auth-changed", update as EventListener);
    };
  }, []);

  // Redirecionamentos
  useEffect(() => {
    const publicPaths = new Set<string>([
      "/login",
      "/trial-signup",
      "/trial-confirmation",
      "/pricing",
    ]);

    if (authState === "unauthenticated") {
      if (!publicPaths.has(location)) setLocation("/login");
      return;
    }

    if (authState === "authenticated" || authState === "trial") {
      if (publicPaths.has(location)) setLocation("/");
      return;
    }
    // "expired": renderiza a tela especial
  }, [authState, location, setLocation]);

  // >>>> MOVIDO PARA CIMA: hook SEMPRE é chamado antes de qualquer return
  const trialDaysLeft = useMemo(() => {
    if (authState !== "trial") return null;
    const trialExpiry = localStorage.getItem("trialExpiry");
    if (!trialExpiry) return null;
    const expiry = new Date(trialExpiry).getTime();
    const now = Date.now();
    return Math.max(Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)), 0);
  }, [authState]);
  // <<<<

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null; // efeito acima cuida do redirect
  }

  if (authState === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg mx-auto shadow-xl bg-card">
          <CardHeader className="text-center">
            <div className="bg-gradient-to-r from-destructive to-danger p-3 rounded-full w-16 h-16 mx-auto mb-4">
              <Clock className="w-10 h-10 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl text-foreground">Teste expirado</CardTitle>
            <CardDescription className="text-muted-foreground">
              Seu período de teste de 7 dias chegou ao fim. Escolha um plano
              para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-popover border border-sidebar-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Não perca seus dados!</strong> Escolha um plano agora
                e continue de onde parou.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setLocation("/pricing")}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Ver planos e assinar
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="w-full"
              >
                Voltar ao login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authState === "trial") {
    return (
      <div>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">
                Teste gratuito • {trialDaysLeft ?? 0} dia
                {trialDaysLeft === 1 ? "" : "s"} restante
                {trialDaysLeft === 1 ? "" : "s"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/pricing")}
              className="bg-white/20 border-white/30 text-white hover:bg-white hover:text-blue-600"
            >
              Escolher plano
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // authenticated
  return <>{children}</>;
}
