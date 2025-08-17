import React from "react";
import { BarChart3, Users, ShoppingCart, Megaphone, FileText, Settings, HelpCircle } from "lucide-react";
import type { ApiConnection } from "@shared/schema";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  connections: ApiConnection[];
}

export default function Sidebar({ connections }: SidebarProps) {
  const [location] = useLocation();
  const connectedCount = connections.filter(conn => conn.isConnected).length;
  const totalCount = connections.length;

  const isActive = (path: string) => location === path;

  const getConnectionStatus = (platform: string) => {
    const connection = connections.find(conn => conn.platform === platform);
    return connection?.isConnected ? 'connected' : 'disconnected';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-secondary';
      case 'warning': return 'bg-accent';
      default: return 'bg-gray-300';
    }
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full z-10" data-testid="sidebar">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-sm" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900" data-testid="text-app-title">MarketingHub</h1>
            <p className="text-xs text-gray-500" data-testid="text-app-subtitle">Daily Analytics</p>
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

          <a
            href="#"
            className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Users className="w-5 h-5 mr-3" />
            Leads
          </a>

          <a
            href="#"
            className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Sales
          </a>

          <a
            href="#"
            className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Megaphone className="w-5 h-5 mr-3" />
            Campaigns
          </a>

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
      </nav>
    </aside>
  );
}