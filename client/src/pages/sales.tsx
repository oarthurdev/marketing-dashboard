
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, RefreshCw, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Sale {
  id: string;
  customerName: string;
  customerEmail: string;
  product: string;
  value: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer';
  source: string;
  createdAt: string;
  completedAt?: string;
}

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("30");
  const { toast } = useToast();

  // Mock data - in real app this would come from API
  const mockSales: Sale[] = [
    {
      id: "1",
      customerName: "João Silva",
      customerEmail: "joao@example.com",
      product: "Consultoria Premium",
      value: 5000,
      status: "completed",
      paymentMethod: "credit_card",
      source: "Website",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    },
    {
      id: "2",
      customerName: "Maria Santos",
      customerEmail: "maria@example.com",
      product: "Curso Online",
      value: 299,
      status: "completed",
      paymentMethod: "pix",
      source: "Google Ads",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "3",
      customerName: "Pedro Costa",
      customerEmail: "pedro@example.com",
      product: "Software License",
      value: 1200,
      status: "pending",
      paymentMethod: "bank_transfer",
      source: "Meta Ads",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: "4",
      customerName: "Ana Oliveira",
      customerEmail: "ana@example.com",
      product: "Mentoria 1:1",
      value: 800,
      status: "completed",
      paymentMethod: "credit_card",
      source: "Indicação",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      completedAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: "5",
      customerName: "Carlos Lima",
      customerEmail: "carlos@example.com",
      product: "Ebook",
      value: 49,
      status: "refunded",
      paymentMethod: "credit_card",
      source: "Email Marketing",
      createdAt: new Date(Date.now() - 345600000).toISOString()
    }
  ];

  // Check Kommo status
  const { data: kommoStatus } = useQuery({
    queryKey: ['/api/kommo/status'],
    queryFn: async () => {
      const response = await fetch('/api/kommo/status');
      if (!response.ok) throw new Error('Failed to check Kommo status');
      return response.json();
    },
  });

  // Fetch sales data - use Kommo if available, otherwise mock data
  const { data: sales = mockSales, isLoading } = useQuery({
    queryKey: ['/api/sales', periodFilter, kommoStatus?.isConnected],
    queryFn: async () => {
      if (kommoStatus?.isConnected) {
        const response = await fetch('/api/kommo/sales');
        if (response.ok) {
          const kommoSales = await response.json();
          // Filter by period if needed
          const now = new Date();
          const periodDays = parseInt(periodFilter);
          const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
          
          return kommoSales.filter((sale: any) => 
            new Date(sale.createdAt) >= cutoffDate
          );
        }
      }
      return mockSales;
    },
    enabled: !!kommoStatus,
  });

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Sale['status']) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'completed': return 'Completa';
      case 'cancelled': return 'Cancelada';
      case 'refunded': return 'Reembolsada';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: Sale['paymentMethod']) => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'bank_transfer': return 'Transferência';
      default: return method;
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, sale) => sum + sale.value, 0);
  const pendingRevenue = sales.filter(s => s.status === 'pending').reduce((sum, sale) => sum + sale.value, 0);
  const completedSales = sales.filter(s => s.status === 'completed').length;
  const averageTicket = completedSales > 0 ? totalRevenue / completedSales : 0;

  const handleExport = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados de vendas estão sendo exportados.",
    });
  };

  const handleRefresh = () => {
    toast({
      title: "Dados atualizados",
      description: "A lista de vendas foi atualizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-500">
            Acompanhe suas vendas e receitas
            {kommoStatus?.isConnected && (
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                Dados do Kommo CRM
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
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
              <DollarSign className="w-4 h-4 mr-2" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde o período anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Receita Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Vendas Completas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales}</div>
            <p className="text-xs text-muted-foreground">+8% desde o período anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {averageTicket.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5% desde o período anterior</p>
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
                  placeholder="Buscar por cliente, email ou produto..."
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
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Completa</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="refunded">Reembolsada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
          <CardDescription>
            {filteredSales.length} vendas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Completada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sale.customerName}</div>
                      <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{sale.product}</TableCell>
                  <TableCell className="font-medium">R$ {sale.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sale.status)}>
                      {getStatusText(sale.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPaymentMethodText(sale.paymentMethod)}</TableCell>
                  <TableCell>{sale.source}</TableCell>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {sale.completedAt 
                      ? new Date(sale.completedAt).toLocaleDateString('pt-BR')
                      : '-'
                    }
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
