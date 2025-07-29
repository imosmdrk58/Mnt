import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";
import AnalyticsCard from "@/components/creator/analytics-card";
import SeriesCard from "@/components/series/series-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Users,
  Coins,
  BookOpen,
  Plus,
  TrendingUp,
  Calendar,
  MessageCircle,
  Star,
  BarChart3,
  Settings,
} from "lucide-react";
import type { Series } from "@shared/schema";
import type { AnalyticsData } from "@/types";

export default function CreatorDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access the creator dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [authLoading, isAuthenticated, user, toast]);

  // Fetch creator series
  const { data: creatorSeries = [], isLoading: seriesLoading } = useQuery<Series[]>({
    queryKey: ["/api/creator/series"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Fetch analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/creator/analytics"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  const handleCreateNewSeries = () => {
    navigate("/creator/upload");
  };

  const handleSeriesClick = (seriesId: string) => {
    navigate(`/series/${seriesId}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!user.isCreator) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Creator Access Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be a creator to access this dashboard.
            </p>
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // Mock recent activity data
  const recentActivity = [
    {
      id: '1',
      type: 'comment',
      message: 'New comment on "Mystic Academy - Chapter 24"',
      timestamp: '2 hours ago',
      icon: MessageCircle,
    },
    {
      id: '2',
      type: 'view',
      message: 'Your series gained 250 new views today',
      timestamp: '4 hours ago',
      icon: Eye,
    },
    {
      id: '3',
      type: 'follower',
      message: '15 new followers this week',
      timestamp: '1 day ago',
      icon: Users,
    },
    {
      id: '4',
      type: 'rating',
      message: 'New 5-star review on "Dark Chronicles"',
      timestamp: '2 days ago',
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        <div className="animate-fade-in space-y-8">
          
          {/* Dashboard Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your content and track performance
              </p>
            </div>
            <Button onClick={handleCreateNewSeries} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Series
            </Button>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analyticsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))
            ) : (
              <>
                <AnalyticsCard
                  title="Total Views"
                  value={analytics?.totalViews || 0}
                  change={12.5}
                  changeLabel="from last month"
                  icon={<Eye className="w-6 h-6" />}
                  color="primary"
                />
                <AnalyticsCard
                  title="Followers"
                  value={analytics?.followers || 0}
                  change={8.2}
                  changeLabel="from last month"
                  icon={<Users className="w-6 h-6" />}
                  color="accent"
                />
                <AnalyticsCard
                  title="Coins Earned"
                  value={analytics?.coinsEarned || 0}
                  change={15.3}
                  changeLabel="from last month"
                  icon={<Coins className="w-6 h-6" />}
                  color="warning"
                />
                <AnalyticsCard
                  title="Active Series"
                  value={analytics?.activeSeries || 0}
                  changeLabel="2 ongoing, 1 completed"
                  icon={<BookOpen className="w-6 h-6" />}
                  color="secondary"
                />
              </>
            )}
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="series" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="series">
                My Series ({creatorSeries.length})
              </TabsTrigger>
              <TabsTrigger value="analytics">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="activity">
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="settings">
                Settings
              </TabsTrigger>
            </TabsList>

            {/* My Series Tab */}
            <TabsContent value="series" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Series</h2>
                <Button variant="outline" onClick={handleCreateNewSeries}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {seriesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-3-4 w-full rounded-xl" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : creatorSeries.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {creatorSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      id={series.id}
                      title={series.title}
                      author={user.firstName || user.email || 'You'}
                      coverImageUrl={series.coverImageUrl || undefined}
                      type={series.type}
                      status={series.status || 'ongoing'}
                      rating={parseFloat(series.rating || '0')}
                      chapterCount={series.chapterCount || 0}
                      viewCount={series.viewCount || 0}
                      onClick={() => handleSeriesClick(series.id)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="glassmorphism">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No series yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create your first series to start sharing your stories with the world.
                    </p>
                    <Button onClick={handleCreateNewSeries}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Series
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Views Over Time</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>Chart visualization would go here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Popular Series</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {creatorSeries.slice(0, 3).map((series, index) => (
                        <div key={series.id} className="flex items-center space-x-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{series.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {series.viewCount || 0} views
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg transition-colors">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground">
                              {activity.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Creator Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Monetization</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Premium Chapters</p>
                            <p className="text-sm text-muted-foreground">
                              Allow readers to unlock chapters with coins
                            </p>
                          </div>
                          <Badge variant="secondary">Available</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Ad Revenue</p>
                            <p className="text-sm text-muted-foreground">
                              Show ads on your content to earn revenue
                            </p>
                          </div>
                          <Badge variant="secondary">Enabled</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-4">Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Comments</p>
                            <p className="text-sm text-muted-foreground">
                              Get notified when readers comment on your work
                            </p>
                          </div>
                          <Badge variant="secondary">On</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Followers</p>
                            <p className="text-sm text-muted-foreground">
                              Get notified when someone follows you
                            </p>
                          </div>
                          <Badge variant="secondary">On</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
