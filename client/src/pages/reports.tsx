
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from "lucide-react";
import type { Report } from "@shared/schema";

export default function Reports() {
  const [reportType, setReportType] = useState("daily");
  const { toast } = useToast();

  const { data: reports, isLoading, refetch } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest('POST', '/api/reports/generate', { type });
      return await response.json();
    },
    onSuccess: (data) => {
      refetch();
      
      // Download the report
      const blob = new Blob([data.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing-report-${reportType}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: `${reportType} marketing report has been generated and downloaded.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: `Failed to generate report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const downloadReport = async (report: Report) => {
    try {
      const content = typeof report.data.content === 'string' 
        ? report.data.content 
        : JSON.stringify(report.data, null, 2);
      
      const blob = new Blob([content], { 
        type: report.format === 'html' ? 'text/html' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Report download has started.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report.",
        variant: "destructive",
      });
    }
  };

  const reportTypeOptions = [
    { value: "daily", label: "Daily Report", description: "Today's performance summary" },
    { value: "weekly", label: "Weekly Report", description: "Last 7 days performance" },
    { value: "monthly", label: "Monthly Report", description: "This month's performance" },
  ];

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="w-5 h-5" />;
      case 'weekly':
        return <TrendingUp className="w-5 h-5" />;
      case 'monthly':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (format: string) => {
    switch (format) {
      case 'html':
        return 'bg-blue-100 text-blue-800';
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'json':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketing Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download comprehensive marketing performance reports</p>
      </div>

      {/* Generate New Report Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
          <CardDescription>
            Create a comprehensive marketing performance report for your selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        {getReportIcon(option.value)}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => generateReportMutation.mutate(reportType)}
              disabled={generateReportMutation.isPending}
              className="flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>
                {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports History */}
      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>
            Previously generated reports are available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <FileText className="w-8 h-8 animate-pulse text-gray-400" />
              <span className="ml-2 text-gray-500">Loading reports...</span>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      {getReportIcon(report.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(report.format)}>
                          {report.format.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Generated on {new Date(report.generatedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(report)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-4">Generate your first marketing report to get started</p>
              <Button
                onClick={() => generateReportMutation.mutate("daily")}
                disabled={generateReportMutation.isPending}
              >
                Generate Daily Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
