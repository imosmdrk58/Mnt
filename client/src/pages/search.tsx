import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import UnifiedSeriesCard from "@/components/ui/unified-series-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  User,
  Star,
  Eye,
  Clock
} from "lucide-react";
import type { Series, User as UserType } from "@shared/schema";

interface SearchResult {
  series: Series[];
  creators: UserType[];
  groups: any[];
}

export default function SearchPage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    genre: "",
  });

  // Get query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);

  // Search API call
  const { data: searchResults, isLoading, refetch } = useQuery<SearchResult>({
    queryKey: ['/api/search', { q: searchQuery, ...filters }],
    enabled: searchQuery.length > 2,
    select: (data: any) => ({
      series: data.series || [],
      creators: data.creators || [],
      groups: data.groups || [],
    }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetch();
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('q', searchQuery);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const totalResults = searchResults 
    ? searchResults.series.length + searchResults.creators.length + searchResults.groups.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Search</h1>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for series, creators, or groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
              <Button type="submit" size="lg" disabled={!searchQuery.trim()}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1 rounded-md border bg-background text-foreground"
            >
              <option value="">All Types</option>
              <option value="webtoon">Webtoon</option>
              <option value="manga">Manga</option>
              <option value="novel">Novel</option>
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-1 rounded-md border bg-background text-foreground"
            >
              <option value="">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">Hiatus</option>
            </select>

            <select
              value={filters.genre}
              onChange={(e) => setFilters(prev => ({ ...prev, genre: e.target.value }))}
              className="px-3 py-1 rounded-md border bg-background text-foreground"
            >
              <option value="">All Genres</option>
              <option value="Action">Action</option>
              <option value="Romance">Romance</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Drama">Drama</option>
              <option value="Comedy">Comedy</option>
              <option value="Horror">Horror</option>
              <option value="Sci-Fi">Sci-Fi</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching...</p>
          </div>
        )}

        {/* No Query State */}
        {!searchQuery && !isLoading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Find Your Next Read</h2>
            <p className="text-muted-foreground">
              Search for series, creators, or groups to discover amazing content
            </p>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && !isLoading && (
          <>
            {totalResults > 0 ? (
              <>
                {/* Results Summary */}
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Found {totalResults} results for "{searchQuery}"
                  </p>
                </div>

                {/* Results Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">
                      All ({totalResults})
                    </TabsTrigger>
                    <TabsTrigger value="series">
                      Series ({searchResults?.series.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="creators">
                      Creators ({searchResults?.creators.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="groups">
                      Groups ({searchResults?.groups.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* All Results */}
                  <TabsContent value="all" className="space-y-8">
                    {searchResults?.series && searchResults.series.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Series
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {searchResults.series.slice(0, 8).map((series) => (
                            <UnifiedSeriesCard key={series.id} series={series} />
                          ))}
                        </div>
                      </section>
                    )}

                    {searchResults?.creators && searchResults.creators.length > 0 && (
                      <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Creators
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {searchResults.creators.slice(0, 6).map((creator) => (
                            <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={creator.profileImageUrl || ""} />
                                    <AvatarFallback>
                                      {creator.firstName?.[0] || creator.username?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h3 className="font-semibold">
                                      {creator.firstName && creator.lastName 
                                        ? `${creator.firstName} ${creator.lastName}` 
                                        : creator.username}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      @{creator.username}
                                    </p>
                                  </div>
                                  {creator.isCreator && (
                                    <Badge variant="secondary">
                                      <Star className="w-3 h-3 mr-1" />
                                      Creator
                                    </Badge>
                                  )}
                                </div>
                                
                                {creator.creatorBio && (
                                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {creator.creatorBio}
                                  </p>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {creator.followersCount || 0}
                                    </div>
                                  </div>
                                  <Button size="sm" variant="outline">
                                    Follow
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}
                  </TabsContent>

                  {/* Series Only */}
                  <TabsContent value="series">
                    {searchResults?.series && searchResults.series.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.series.map((series) => (
                          <UnifiedSeriesCard key={series.id} series={series} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No series found</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Creators Only */}
                  <TabsContent value="creators">
                    {searchResults?.creators && searchResults.creators.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.creators.map((creator) => (
                          <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={creator.profileImageUrl || ""} />
                                  <AvatarFallback>
                                    {creator.firstName?.[0] || creator.username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-semibold">
                                    {creator.firstName && creator.lastName 
                                      ? `${creator.firstName} ${creator.lastName}` 
                                      : creator.username}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    @{creator.username}
                                  </p>
                                </div>
                              </div>
                              
                              {creator.creatorBio && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {creator.creatorBio}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No creators found</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Groups Only */}
                  <TabsContent value="groups">
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Group search coming soon</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No results found</h2>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}