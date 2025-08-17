
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Download, RefreshCw, Eye, Calendar, User, Mail, Phone, Tag, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
  value?: number;
  createdAt: string;
  lastActivity?: string;
  pipelineId?: number;
  responsibleUserId?: number;
  customFields?: any[];
}

const Leads: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  // Mock data fallback
  const mockLeads: Lead[] = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      source: "Google Ads",
      status: "qualified",
      value: 5000,
      createdAt: new Date().toISOString(),
      lastActivity: "Enviou proposta"
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "(11) 88888-8888",
      source: "Meta Ads",
      status: "contacted",
      value: 3000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      lastActivity: "Ligação realizada"
    },
    {
      id: "3",
      name: "Pedro Costa",
      email: "pedro@example.com",
      source: "Website",
      status: "new",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: "4",
      name: "Ana Oliveira",
      email: "ana@example.com",
      phone: "(11) 77777-7777",
      source: "HubSpot",
      status: "converted",
      value: 8000,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      lastActivity: "Contrato assinado"
    }
  ];

  // Check Kommo status
  const { data: kommoStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['kommo-status'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/kommo/status');
        if (!response.ok) throw new Error('Failed to check Kommo status');
        return response.json();
      } catch (error) {
        console.error('Error checking Kommo status:', error);
        return { isConnected: false, isConfigured: false };
      }
    },
  });

  // Fetch leads data
  const { data: allLeads = [], isLoading: leadsLoading, error: leadsError } = useQuery({
    queryKey: ['leads', kommoStatus?.isConnected],
    queryFn: async () => {
      try {
        if (kommoStatus?.isConnected) {
          console.log('Fetching leads from Kommo...');
          const response = await fetch('/api/kommo/leads');
          if (response.ok) {
            const data = await response.json();
            console.log('Kommo leads received:', data);
            return Array.isArray(data) ? data : [];
          } else {
            console.warn('Failed to fetch from Kommo, using mock data');
            return mockLeads;
          }
        }
        console.log('Kommo not connected, using mock data');
        return mockLeads;
      } catch (error) {
        console.error('Error fetching leads:', error);
        return mockLeads;
      }
    },
    enabled: !!kommoStatus,
  });

  const isLoading = statusLoading || leadsLoading;

  // Filter leads by period
  const filteredLeadsByPeriod = allLeads.filter((lead: Lead) => {
    const now = new Date();
    const periodDays = parseInt(periodFilter);
    const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    return new Date(lead.createdAt) >= cutoffDate;
  });

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'Novo';
      case 'contacted': return 'Contatado';
      case 'qualified': return 'Qualificado';
      case 'converted': return 'Convertido';
      case 'lost': return 'Perdido';
      default: return status;
    }
  };

  const filteredLeads = filteredLeadsByPeriod.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados dos leads estão sendo exportados.",
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const LeadDetailDialog = ({ lead }: { lead: Lead }) => (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {lead.name}
        </DialogTitle>
        <DialogDescription>
          Informações detalhadas do lead
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900">{lead.email || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Telefone</p>
              <p className="text-sm text-gray-900">{lead.phone || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Tag className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Fonte</p>
              <p className="text-sm text-gray-900">{lead.source}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge className={getStatusColor(lead.status)}>
              {getStatusText(lead.status)}
            </Badge>
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Valor Potencial</p>
              <p className="text-sm text-gray-900">
                {lead.value ? `R$ ${lead.value.toLocaleString()}` : 'Não informado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Criado em</p>
              <p className="text-sm text-gray-900">
                {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Última Atividade</p>
              <p className="text-sm text-gray-900">{lead.lastActivity || 'Nenhuma atividade registrada'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {lead.customFields && lead.customFields.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Campos Customizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lead.customFields.map((field, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">{field.name || `Campo ${index + 1}`}</p>
                <p className="text-sm text-gray-900">{field.value || 'Não informado'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DialogContent>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">
            Gerencie seus leads e oportunidades
            {kommoStatus?.isConnected && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Dados do Kommo CRM
              </span>
            )}
          </p>
          {leadsError && (
            <p className="text-red-500 text-sm mt-1">
              Erro ao carregar dados. Exibindo dados de exemplo.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Total de leads carregados: {allLeads.length}
          </p>
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
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeadsByPeriod.length}</div>
            <p className="text-xs text-muted-foreground">Últimos {periodFilter} dias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeadsByPeriod.filter(l => l.status === 'new').length}</div>
            <p className="text-xs text-muted-foreground">Últimos {periodFilter} dias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeadsByPeriod.filter(l => l.status === 'qualified').length}</div>
            <p className="text-xs text-muted-foreground">Últimos {periodFilter} dias</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeadsByPeriod.filter(l => l.status === 'converted').length}</div>
            <p className="text-xs text-muted-foreground">Últimos {periodFilter} dias</p>
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
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fontes</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="HubSpot">HubSpot</SelectItem>
                <SelectItem value="Kommo">Kommo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            {filteredLeads.length} leads encontrados
            {allLeads.length > 0 && (
              <span className="ml-2 text-green-600">
                • {allLeads.length} leads carregados
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum lead encontrado com os filtros aplicados.</p>
              <p className="text-sm text-gray-400 mt-2">
                Total de leads disponíveis: {allLeads.length}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone || '-'}</TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusText(lead.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.value ? `R$ ${lead.value.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        {selectedLead && <LeadDetailDialog lead={selectedLead} />}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leads;
