import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, ShoppingCart, Megaphone, TrendingUp } from "lucide-react";
import type { Activity } from "@shared/schema";

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lead':
        return { icon: UserPlus, bgColor: 'bg-blue-500' };
      case 'sale':
        return { icon: ShoppingCart, bgColor: 'bg-green-500' };
      case 'campaign_launch':
        return { icon: Megaphone, bgColor: 'bg-yellow-500' };
      case 'campaign_performance':
        return { icon: TrendingUp, bgColor: 'bg-purple-500' };
      default:
        return { icon: TrendingUp, bgColor: 'bg-gray-500' };
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm" data-testid="activity-feed-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm" data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => {
              const { icon: Icon, bgColor } = getActivityIcon(activity.type);
              const isLast = index === activities.length - 1;
              
              return (
                <li key={activity.id} data-testid={`activity-${activity.id}`}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white`}>
                          <Icon className="text-white text-xs" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.type === 'lead' && 'New lead from '}
                            {activity.type === 'sale' && 'Sale completed '}
                            {activity.type === 'campaign_launch' && 'Campaign launched '}
                            {activity.type === 'campaign_performance' && 'Campaign update '}
                            <span className="font-medium text-gray-900" data-testid={`text-activity-source-${activity.id}`}>
                              {activity.source}
                            </span>
                            {activity.amount && (
                              <span className="font-medium text-gray-900"> ${parseFloat(activity.amount).toLocaleString()}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400" data-testid={`text-activity-details-${activity.id}`}>
                            {activity.details}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time data-testid={`text-activity-time-${activity.id}`}>
                            {formatTimeAgo(activity.timestamp)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {activities.length === 0 && (
              <li className="text-center text-gray-500 py-8" data-testid="text-no-activities">
                No recent activities
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}