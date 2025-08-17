import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Target, 
  FileText, 
  Settings,
  TrendingUp,
  LogOut,
  User
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
  const connectedCount = connections.filter(conn => conn.isConnected).length;
  const totalCount = connections.length;

  const isActive = (path: string) => location === path;

  const getConnectionStatus = (platform: string) => {
    const connection = connections.find(conn => conn.platform === platform);
    return connection?.isConnected ? 'connected' : 'disconnected';
  };

  const getStatusColor = (status: string) => {
    return status === 'connected' ? 'bg-green-500' : 'bg-red-500';
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
    avancado: "Avançado"
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full z-10" data-testid="sidebar">
      {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MarketingHub Pro
              </h1>
              <p className="text-xs text-gray-500">Analytics Dashboard</p>
            </div>
          </div>

          {/* User info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {userEmail.split('@')[0]}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {isTrialActive ? (
                <span className="text-orange-600 font-medium">Teste Gratuito</span>
              ) : activePlan ? (
                <span className="text-green-600 font-medium">
                  Plano {planNames[activePlan as keyof typeof planNames]}
                </span>
              ) : (
                "Usuário"
              )}
            </div>
          </div>
        </div>

      <nav className="mt-6 px-3" data-testid="nav-main">
        <div className="space-y-2">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/dashboard') || isActive('/')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Link>

          <Link href="/leads" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/leads')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <Users className="w-5 h-5 mr-3" />
            Leads
          </Link>

          <Link href="/sales" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/sales')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <DollarSign className="w-5 h-5 mr-3" />
            Vendas
          </Link>

          <Link href="/campaigns" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/campaigns')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <Target className="w-5 h-5 mr-3" />
            Campanhas
          </Link>

          <Link href="/reports" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/reports')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </Link>
        </div>

        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" data-testid="text-integrations-header">
            Integrations
          </h3>
          <div className="mt-3 space-y-1">
            <div className="px-3 py-2 text-sm" data-testid="connection-hubspot">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">HubSpot CRM</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(getConnectionStatus('hubspot'))}`}></span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm" data-testid="connection-google-ads">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Google Ads</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(getConnectionStatus('google_ads'))}`}></span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm" data-testid="connection-shopify">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Shopify</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(getConnectionStatus('shopify'))}`}></span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm" data-testid="connection-meta-ads">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Meta Ads</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(getConnectionStatus('meta_ads'))}`}></span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm" data-testid="connection-kommo">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Kommo CRM</span>
                <span className={`w-2 h-2 rounded-full ${getStatusColor(getConnectionStatus('kommo'))}`}></span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/api-settings" className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive('/api-settings')
              ? 'text-gray-900 bg-blue-50 border-l-4 border-blue-500'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}>
            <Settings className="w-5 h-5 mr-3" />
            API Settings
          </Link>

          <a
            href="#"
            className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Help & Support
          </a>
        </div>

        {/* Bottom section with logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sair
          </Button>
        </div>
      </nav>
    </aside>
  );
}