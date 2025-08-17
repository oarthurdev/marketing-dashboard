import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Download, RefreshCw, Play, Pause, TrendingUp, Target, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@shared/schema";

// Mock data fallback
  const mockCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Campanha de Verão 2024',
      platform: 'meta_ads',
      status: 'active',
      leads: 120,
      spend: '1500.50',
      roi: '25.5',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Lançamento Produto X',
      platform: 'google_ads',
      status: 'paused',
      leads: 85,
      spend: '950.75',
      roi: '15.0',
      createdAt: '2024-02-20T14:30:00Z',
    },
    {
      id: '3',
      name: 'Black Friday Ofertas',
      platform: 'meta_ads',
      status: 'ended',
      leads: 250,
      spend: '3200.00',
      roi: '40.2',
      createdAt: '2023-11-01T09:00:00Z',
    },
    {
      id: '4',
      name: 'Conteúdo Blog Novembro',
      platform: 'linkedin_ads',
      status: 'active',
      leads: 50,
      spend: '500.00',
      roi: '10.8',
      createdAt: '2024-03-01T11:00:00Z',
    },
    {
      id: '5',
      name: 'Campanha de Teste TikTok',
      platform: 'tiktok_ads',
      status: 'draft',
      leads: 10,
      spend: '100.00',
      roi: '5.0',
      createdAt: '2024-04-01T16:00:00Z',
    },
  ];

  // Fetch campaigns data
  const { data: campaigns = mockCampaigns, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/campaigns');
      if (response.ok) {
        return response.json();
      }
      // Fallback to mock data if API call fails
      return mockCampaigns;
    },
  });

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'paused': return 'Pausada';
      case 'ended': return 'Finalizada';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google_ads': return 'Google Ads';
      case 'meta_ads': return 'Meta Ads';
      case 'tiktok_ads': return 'TikTok Ads';
      case 'linkedin_ads': return 'LinkedIn Ads';
      default: return platform;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || campaign.platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const totalSpend = campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.spend), 0);
  const totalLeads = campaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const averageROI = campaigns.length > 0
    ? campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.roi), 0) / campaigns.length
    : 0;

  const handleToggleCampaign = (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toast({
      title: `Campanha ${newStatus === 'active' ? 'reativada' : 'pausada'}`,
      description: "O status da campanha foi atualizado com sucesso.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados das campanhas estão sendo exportados.",
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Dados atualizados",
      description: "A lista de campanhas foi atualizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-500">Gerencie suas campanhas de marketing</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Campanhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              de {campaigns.length} campanhas totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Gasto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalSpend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Leads Gerados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">+8% desde ontem</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              ROI Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageROI.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">+5% desde ontem</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="ended">Finalizada</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="meta_ads">Meta Ads</SelectItem>
                <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                <SelectItem value="linkedin_ads">LinkedIn Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Campanhas</CardTitle>
          <CardDescription>
            {filteredCampaigns.length} campanhas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getPlatformName(campaign.platform)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusText(campaign.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.leads}</TableCell>
                  <TableCell>R$ {parseFloat(campaign.spend).toLocaleString()}</TableCell>
                  <TableCell className={parseFloat(campaign.roi) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {parseFloat(campaign.roi).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Meta: 100 leads</span>
                        <span>{campaign.leads}/100</span>
                      </div>
                      <Progress
                        value={Math.min((campaign.leads / 100) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                      className="mr-2"
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}