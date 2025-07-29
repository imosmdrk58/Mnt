import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedSeriesCard from "@/components/ui/unified-series-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, TrendingUp, Users, Star, Crown, Eye, BookOpen } from "lucide-react";
import type { Series, User } from "@shared/schema";

export default function Trending() {
  const [timeframe, setTimeframe] = useState<"today" | "week" | "month">("week");

  // Fetch trending series
  const { data: trendingSeries = [], isLoading: seriesLoading } = useQuery<Series[]>({
    queryKey: ["/api/series/trending", { timeframe, limit: 20 }]
  });

  // Fetch trending creators
  const { data: trendingCreators = [], isLoading: creatorsLoading } = useQuery<User[]>({
    queryKey: ["/api/creators/trending", { timeframe, limit: 12 }]
  });

  // Fetch rising series (new and gaining traction)
  const { data: risingSeries = [], isLoading: risingLoading } = useQuery<Series[]>({
    queryKey: ["/api/series/rising", { timeframe, limit: 12 }]
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (seriesLoading || creatorsLoading || risingLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-80 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Trending</h1>
          </div>
          <p className="text-muted-foreground">
            Discover what's hot right now across all content types
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="mb-8">
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as "today" | "week" | "month")}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value={timeframe} className="space-y-8 mt-6">
              
              {/* Top Trending Series */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Top Trending Series</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {trendingSeries.slice(0, 8).map((series, index) => (
                    <div key={series.id} className="relative">
                      <UnifiedSeriesCard series={series} />
                      <Badge 
                        className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* Creator Spotlight */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Creator Spotlight</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingCreators.map((creator, index) => (
                    <Card key={creator.id} className="hover:shadow-lg transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={creator.profileImageUrl || ""} alt={creator.firstName || "Creator"} />
                                <AvatarFallback>
                                  {creator.firstName?.[0] || creator.email?.[0] || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <Badge 
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                              >
                                #{index + 1}
                              </Badge>
                            </div>
                            <div>
                              <h3 className="font-semibold">{creator.creatorDisplayName || creator.firstName || "Creator"}</h3>
                              <div className="flex items-center gap-1">
                                {creator.isEliteReader && (
                                  <Badge variant="outline" className="text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Elite
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Creator
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Follow
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {creator.creatorBio || "Creating amazing content for our community."}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-lg font-bold">{formatNumber(creator.followerCount || 0)}</p>
                            <p className="text-xs text-muted-foreground">Followers</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{formatNumber(creator.totalViews || 0)}</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{creator.seriesCount || 0}</p>
                            <p className="text-xs text-muted-foreground">Series</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Rising Stars */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h2 className="text-2xl font-bold">Rising Stars</h2>
                  <Badge variant="outline" className="ml-2">New & Growing</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {risingSeries.map((series) => (
                    <div key={series.id} className="relative">
                      <UnifiedSeriesCard series={series} />
                      <Badge 
                        className="absolute top-2 left-2 bg-green-500 text-white border-0"
                      >
                        Rising
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Stats */}
              <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Eye className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold">{formatNumber(trendingSeries.reduce((sum, s) => sum + (s.viewCount || 0), 0))}</p>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <BookOpen className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold">{trendingSeries.length}</p>
                      <p className="text-sm text-muted-foreground">Trending Series</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold">{trendingCreators.length}</p>
                      <p className="text-sm text-muted-foreground">Active Creators</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Flame className="w-8 h-8 text-orange-500" />
                      </div>
                      <p className="text-2xl font-bold">{risingSeries.length}</p>
                      <p className="text-sm text-muted-foreground">Rising Stars</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}