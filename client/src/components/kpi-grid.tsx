import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import type { Metrics } from "@shared/schema";

interface KPIGridProps {
  metrics?: Metrics;
  isLoading: boolean;
}

export default function KPIGrid({ metrics, isLoading }: KPIGridProps) {
  const kpiItems = [
    {
      title: "Total Leads",
      value: metrics?.totalLeads?.toLocaleString() || "0",
      change: "+12.5%",
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-primary",
      testId: "kpi-total-leads"
    },
    {
      title: "Conversion Rate",
      value: `${parseFloat(metrics?.conversionRate || "0").toFixed(1)}%`,
      change: "+0.8%",
      icon: TrendingUp,
      bgColor: "bg-green-100",
      iconColor: "text-secondary",
      testId: "kpi-conversion-rate"
    },
    {
      title: "Daily Revenue",
      value: `$${parseFloat(metrics?.dailyRevenue || "0").toLocaleString()}`,
      change: "+18.2%",
      icon: DollarSign,
      bgColor: "bg-yellow-100",
      iconColor: "text-accent",
      testId: "kpi-daily-revenue"
    },
    {
      title: "Avg. CPA",
      value: `$${parseFloat(metrics?.avgCPA || "0").toFixed(2)}`,
      change: "-5.3%",
      icon: Target,
      bgColor: "bg-red-100",
      iconColor: "text-danger",
      testId: "kpi-avg-cpa"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-grid-loading">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-grid">
      {kpiItems.map((item) => {
        const Icon = item.icon;
        const isPositiveChange = item.change.startsWith('+');
        
        return (
          <Card key={item.title} className="shadow-sm" data-testid={item.testId}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500" data-testid={`${item.testId}-label`}>{item.title}</p>
                  <p className="text-3xl font-bold text-gray-900" data-testid={`${item.testId}-value`}>{item.value}</p>
                </div>
                <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${item.iconColor} text-xl`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span 
                  className={`text-sm font-medium ${
                    isPositiveChange ? 'text-secondary' : 'text-danger'
                  }`}
                  data-testid={`${item.testId}-change`}
                >
                  {item.change}
                </span>
                <span className="text-gray-500 text-sm ml-2">vs last week</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}