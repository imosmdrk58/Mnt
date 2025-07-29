import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import MobileNav from "@/components/layout/mobile-nav";
import SeriesGrid from "@/components/series/series-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  Heart,
  Clock,
  Filter,
  Grid3X3,
  List,
  Star,
  TrendingUp,
  Calendar,
  Eye,
} from "lucide-react";
import type { Series, ReadingProgress } from "@shared/schema";

export default function Library() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'progress' | 'rating'>('recent');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to view your library.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [authLoading, isAuthenticated, user, toast]);

  // Fetch bookmarked series
  const { data: bookmarkedSeries = [], isLoading: bookmarksLoading } = useQuery<Series[]>({
    queryKey: ["/api/user/bookmarks"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Fetch followed series
  const { data: followedSeries = [], isLoading: followedLoading } = useQuery<Series[]>({
    queryKey: ["/api/user/followed-series"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Fetch user transactions for purchase history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/user/transactions"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Filter and sort functions
  const filterSeries = (series: Series[]) => {
    let filtered = series;
    
    if (searchQuery.trim()) {
      filtered = series.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort series
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        filtered.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
        break;
      case 'progress':
        // This would need reading progress data to implement properly
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => 
          new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
        );
        break;
    }
    
    return filtered;
  };

  const filteredBookmarks = filterSeries(bookmarkedSeries);
  const filteredFollowed = filterSeries(followedSeries);

  // Calculate reading stats
  const totalSeries = bookmarkedSeries.length;
  const totalChaptersRead = transactions.filter((t: any) => t.type === 'unlock').length;
  const coinsSpent = transactions
    .filter((t: any) => t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        <div className="animate-fade-in space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Library</h1>
              <p className="text-muted-foreground mt-1">
                Your bookmarked series and reading progress
              </p>
            </div>
          </div>

          {/* Reading Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="glassmorphism">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Series</p>
                    <p className="text-2xl font-bold text-foreground">{totalSeries}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chapters Read</p>
                    <p className="text-2xl font-bold text-foreground">{totalChaptersRead}</p>
                  </div>
                  <Eye className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Coins Spent</p>
                    <p className="text-2xl font-bold text-foreground">{coinsSpent}</p>
                  </div>
                  <Star className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reading Streak</p>
                    <p className="text-2xl font-bold text-foreground">7</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="glassmorphism">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                  >
                    <option value="recent">Recently Updated</option>
                    <option value="title">Title A-Z</option>
                    <option value="rating">Highest Rated</option>
                    <option value="progress">Reading Progress</option>
                  </select>
                  
                  <div className="flex border border-border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="bookmarks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bookmarks">
                <BookOpen className="w-4 h-4 mr-2" />
                Bookmarks ({bookmarkedSeries.length})
              </TabsTrigger>
              <TabsTrigger value="following">
                <Heart className="w-4 h-4 mr-2" />
                Following ({followedSeries.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                Reading History
              </TabsTrigger>
            </TabsList>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="space-y-6">
              {bookmarksLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-3-4 w-full rounded-xl" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredBookmarks.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredBookmarks.map((series) => (
                      <div key={series.id} className="space-y-3">
                        <div className="relative aspect-3-4 rounded-xl overflow-hidden bg-muted">
                          {series.coverImageUrl ? (
                            <img
                              src={series.coverImageUrl}
                              alt={series.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          {/* Reading progress indicator */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <Progress value={Math.random() * 100} className="h-1" />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-foreground line-clamp-2 text-sm">
                            {series.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {series.chapterCount} chapters
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookmarks.map((series) => (
                      <Card key={series.id} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {series.coverImageUrl ? (
                                <img
                                  src={series.coverImageUrl}
                                  alt={series.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate">
                                {series.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {series.description || 'No description available'}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span>{series.chapterCount} chapters</span>
                                <span className="flex items-center space-x-1">
                                  <Star className="w-3 h-3" />
                                  <span>{series.rating}</span>
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {series.type}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                Last read
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(series.updatedAt || '').toLocaleDateString()}
                              </p>
                              <Progress value={Math.random() * 100} className="w-20 h-1 mt-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <Card className="glassmorphism">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start exploring and bookmark series you want to read later.
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Discover Series
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Following Tab */}
            <TabsContent value="following" className="space-y-6">
              {followedLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-3-4 w-full rounded-xl" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filteredFollowed.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFollowed.map((series) => (
                    <div key={series.id} className="space-y-3">
                      <div className="relative aspect-3-4 rounded-xl overflow-hidden bg-muted">
                        {series.coverImageUrl ? (
                          <img
                            src={series.coverImageUrl}
                            alt={series.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* New chapter indicator */}
                        <Badge className="absolute top-2 left-2 bg-success text-success-foreground text-xs">
                          New
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-foreground line-clamp-2 text-sm">
                          {series.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(series.updatedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="glassmorphism">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Not following any series</h3>
                    <p className="text-muted-foreground mb-6">
                      Follow series to get notified when new chapters are released.
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Discover Series
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reading History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Recent Reading Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 10).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">
                                {transaction.description || 'Chapter unlock'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.type}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reading history yet</p>
                    </div>
                  )}
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
