import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  BarChart3,
  Users,
  DollarSign,
  Target,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
  User,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { ApiConnection } from "@shared/schema";

interface SidebarProps {
  connections: ApiConnection[];
}

export default function Sidebar({ connections }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const connectedCount = connections.filter((conn) => conn.isConnected).length;
  const totalCount = connections.length;

  const isActive = (path: string) => location === path;

  const getConnectionStatus = (platform: string) => {
    const connection = connections.find((conn) => conn.platform === platform);
    return connection?.isConnected ? "connected" : "disconnected";
  };

  const getStatusColor = (status: string) => {
    return status === "connected" ? "bg-green-500" : "bg-red-500";
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("trialStarted");
    localStorage.removeItem("trialExpiry");
    localStorage.removeItem("subscriptionActive");
    localStorage.removeItem("activePlan");
    localStorage.removeItem("userEmail");

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });

    setLocation("/login");
  };

  const userEmail = localStorage.getItem("userEmail") || "usuário";
  const activePlan = localStorage.getItem("activePlan");
  const isTrialActive = localStorage.getItem("trialStarted") === "true";

  const planNames = {
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
  };

  return (
    <aside
      className="w-64 bg-sidebar shadow-sm border-r border-sidebar-border fixed h-full z-10"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="px-6 py-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-2 rounded-xl">
            <img src="https://www.atinus.com.br/imagens/icon.png" alt="Atinus company logo, white icon on gradient blue to purple background" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atinus</h1>
          </div>
        </div>

        {/* User info */}
        <div className="bg-popover rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground truncate">
              {userEmail.split("@")[0]}
            </span>
          </div>
        </div>
        <hr />
      </div>
      <nav className="mt-3" data-testid="nav-main">
        <div className="space-y-2">
          <Link
            href="/"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              isActive("/")
                ? "text-foreground bg-popover border-l-4 border-sidebar-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-popover"
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          <Link
            href="/campaigns"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              isActive("/campaigns")
                ? "text-foreground bg-popover border-l-4 border-sidebar-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-popover"
            }`}
          >
            <Target className="w-5 h-5 mr-3" />
            Campanhas
          </Link>
        </div>
        {/* Bottom section with logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-popover"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sair
          </Button>
        </div>
      </nav>
    </aside>
  );
}
