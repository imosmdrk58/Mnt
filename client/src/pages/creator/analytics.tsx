import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  BookOpen,
  Star,
  Target,
  Zap,
  Award,
  Clock
} from "lucide-react";
import { format, parseISO, subDays, subWeeks } from "date-fns";

interface AnalyticsData {
  totalViews: number;
  followers: number;
  coinsEarned: number;
  activeSeries: number;
  weeklyViews: number;
  monthlyViews: number;
  adRevenue: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    revenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    dailyStats: Array<{
      date: string;
      impressions: number;
      clicks: number;
      revenue: number;
    }>;
  };
  seriesStats: Array<{
    id: string;
    title: string;
    coverImageUrl: string | null;
    views: number;
    followers: number;
    rating: string | null;
    chapters: number;
    revenue: number;
    adImpressions: number;
  }>;
}

export default function CreatorAnalytics() {
  const { user, isAuthenticated } = useAuth();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/creator/analytics'],
    enabled: isAuthenticated && user?.isCreator,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Start creating content to see your analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAdRevenue = user?.followersCount && user.followersCount >= 1000;
  const canEarnPremium = user?.followersCount && user.followersCount >= 500;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Analytics</h1>
          <p className="text-muted-foreground">
            Track your content performance and revenue streams
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+{analytics.weeklyViews.toLocaleString()} this week</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <p className="text-2xl font-bold">{analytics.followers.toLocaleString()}</p>
                  {canEarnPremium && (
                    <Badge className="mt-1 bg-purple-500">Premium Eligible</Badge>
                  )}
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Coins Earned</p>
                  <p className="text-2xl font-bold">{analytics.coinsEarned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">${(analytics.coinsEarned * 0.01).toFixed(2)} USD</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Series</p>
                  <p className="text-2xl font-bold">{analytics.activeSeries}</p>
                  <p className="text-xs text-muted-foreground">Publishing content</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="series">Series Performance</TabsTrigger>
            {hasAdRevenue && <TabsTrigger value="ads">Ad Revenue</TabsTrigger>}
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Weekly Views</span>
                      <span className="text-sm font-medium">{analytics.weeklyViews.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min((analytics.weeklyViews / 10000) * 100, 100)} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Monthly Views</span>
                      <span className="text-sm font-medium">{analytics.monthlyViews.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min((analytics.monthlyViews / 50000) * 100, 100)} />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Followers Progress</span>
                      <span className="text-sm font-medium">{analytics.followers.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min((analytics.followers / 10000) * 100, 100)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Milestones & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${analytics.followers >= 500 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">500+ Followers - Premium Chapters</span>
                    {analytics.followers >= 500 && <Badge className="bg-green-500">Unlocked</Badge>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${analytics.followers >= 1000 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">1000+ Followers - Ad Monetization</span>
                    {analytics.followers >= 1000 && <Badge className="bg-green-500">Unlocked</Badge>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${analytics.followers >= 5000 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">5000+ Followers - Featured Creator</span>
                    {analytics.followers >= 5000 && <Badge className="bg-green-500">Unlocked</Badge>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${analytics.totalViews >= 100000 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">100K+ Views - Popular Creator</span>
                    {analytics.totalViews >= 100000 && <Badge className="bg-green-500">Unlocked</Badge>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Series Performance Tab */}
          <TabsContent value="series" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Series Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.seriesStats.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.seriesStats.map((series) => (
                      <div key={series.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <img 
                            src={series.coverImageUrl || ''} 
                            alt={series.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{series.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {series.chapters} chapters • ★ {series.rating || "0.0"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{series.views.toLocaleString()} views</p>
                          <p className="text-sm text-muted-foreground">
                            {series.followers.toLocaleString()} followers
                          </p>
                          <p className="text-sm text-green-600">
                            ${series.revenue.toFixed(2)} earned
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No series data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ad Revenue Tab */}
          {hasAdRevenue && (
            <TabsContent value="ads" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Impressions</p>
                        <p className="text-2xl font-bold">{analytics.adRevenue.totalImpressions.toLocaleString()}</p>
                      </div>
                      <Eye className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Click-Through Rate</p>
                        <p className="text-2xl font-bold">{analytics.adRevenue.ctr.toFixed(2)}%</p>
                      </div>
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ad Revenue</p>
                        <p className="text-2xl font-bold">${analytics.adRevenue.revenue.toFixed(2)}</p>
                        <p className="text-xs text-green-600">+${analytics.adRevenue.weeklyRevenue.toFixed(2)} this week</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Daily Ad Performance (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.adRevenue.dailyStats.slice(-7).map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{format(parseISO(day.date), 'MMM dd')}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.impressions.toLocaleString()} impressions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${day.revenue.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {day.clicks} clicks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Premium Chapters</span>
                    <span className="font-medium">${(analytics.coinsEarned * 0.01).toFixed(2)}</span>
                  </div>
                  
                  {hasAdRevenue && (
                    <div className="flex justify-between items-center">
                      <span>Ad Revenue</span>
                      <span className="font-medium">${analytics.adRevenue.revenue.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="flex justify-between items-center font-bold">
                    <span>Total Earnings</span>
                    <span>${((analytics.coinsEarned * 0.01) + (hasAdRevenue ? analytics.adRevenue.revenue : 0)).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earning Potential</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Next milestone rewards:</p>
                    
                    {!canEarnPremium && (
                      <div className="mb-3">
                        <p>• 500 followers: Unlock premium chapters</p>
                        <Progress value={(analytics.followers / 500) * 100} className="mt-1" />
                        <p className="text-xs mt-1">{500 - analytics.followers} followers to go</p>
                      </div>
                    )}
                    
                    {!hasAdRevenue && (
                      <div className="mb-3">
                        <p>• 1,000 followers: Enable ad monetization</p>
                        <Progress value={(analytics.followers / 1000) * 100} className="mt-1" />
                        <p className="text-xs mt-1">{1000 - analytics.followers} followers to go</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}