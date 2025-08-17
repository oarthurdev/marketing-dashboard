import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { MoreHorizontal } from "lucide-react";
import type { Metrics } from "@shared/schema";

interface ChartsSectionProps {
  historicalData?: Metrics[];
  metrics?: Metrics;
}

export function ChartsSection({ data }: { data?: any }) {
  // Prepare revenue trend data
  const revenueData = data?.revenueChart?.map((item: any) => ({
    name: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    leads: item.leads,
  })) || [];

  // Prepare lead sources data
  const leadSourcesData = data?.leadSources?.map((source: any) => ({
    name: source.source,
    value: source.leads,
  })) || [];

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const isLoading = !data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="charts-section">
      {/* Revenue Chart */}
      <Card className="shadow-sm" data-testid="card-revenue-chart">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Tendência de Receita</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-sm text-gray-500 hover:text-gray-700">
                7D
              </Button>
              <Button size="sm" className="text-sm bg-primary text-white px-3 py-1 rounded">
                30D
              </Button>
              <Button variant="ghost" size="sm" className="text-sm text-gray-500 hover:text-gray-700">
                90D
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <div className="h-64" data-testid="chart-revenue-trend">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `R$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$${Number(value).toLocaleString()}`, 'Receita Diária']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563EB" 
                    strokeWidth={2}
                    dot={{ fill: '#2563EB', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Sources Chart */}
      <Card className="shadow-sm" data-testid="card-lead-sources">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Fontes de Leads</CardTitle>
            <Button variant="ghost" size="sm" className="text-sm text-gray-500 hover:text-gray-700">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
            <div className="h-64" data-testid="chart-lead-sources">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leadSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}