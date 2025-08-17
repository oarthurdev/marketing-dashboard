import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Campaign } from "@shared/schema";

interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export default function CampaignTable({ campaigns, isLoading }: CampaignTableProps) {
  const getROIBadgeVariant = (roi: string) => {
    const roiValue = parseFloat(roi);
    if (roiValue > 150) return "default";
    if (roiValue > 100) return "secondary";
    return "destructive";
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google_ads': return 'bg-blue-500';
      case 'facebook': case 'meta_ads': return 'bg-blue-600';
      case 'linkedin': return 'bg-blue-700';
      case 'twitter': return 'bg-sky-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm" data-testid="campaign-table-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" data-testid="card-campaign-performance">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.slice(0, 5).map((campaign) => (
                <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${getPlatformColor(campaign.platform)} rounded-full mr-3`}></div>
                      <span className="text-sm font-medium text-gray-900" data-testid={`text-campaign-name-${campaign.id}`}>
                        {campaign.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900" data-testid={`text-campaign-leads-${campaign.id}`}>
                    {campaign.leads.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900" data-testid={`text-campaign-spend-${campaign.id}`}>
                    ${parseFloat(campaign.spend).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getROIBadgeVariant(campaign.roi)}
                      data-testid={`badge-campaign-roi-${campaign.id}`}
                    >
                      +{parseFloat(campaign.roi).toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No campaigns data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}