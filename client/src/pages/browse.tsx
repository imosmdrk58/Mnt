import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import UnifiedSeriesCard from "@/components/ui/unified-series-card";
import type { Series } from "@shared/schema";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch series data
  const { data: allSeries = [], isLoading } = useQuery<Series[]>({
    queryKey: ["/api/series", { 
      type: selectedType !== "all" ? selectedType : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      genre: selectedGenre !== "all" ? selectedGenre : undefined,
    }]
  });

  // Fetch trending series
  const { data: trendingSeries = [] } = useQuery<Series[]>({
    queryKey: ["/api/series/trending", { limit: 12 }]
  });

  // Filter and sort series
  const filteredSeries = allSeries.filter(series => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return series.title.toLowerCase().includes(query) ||
             series.description?.toLowerCase().includes(query);
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "rating":
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      case "views":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "updated":
      default:
        return new Date(b.updatedAt || "").getTime() - new Date(a.updatedAt || "").getTime();
    }
  });

  const genres = [
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
    "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Supernatural", "Thriller"
  ];

  const contentTypes = [
    { id: "webtoon", label: "Webtoons" },
    { id: "manga", label: "Manga" },
    { id: "novel", label: "Novels" }
  ];

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Content</h1>
          <p className="text-muted-foreground">
            Discover amazing webtoons, manga, and novels from creators worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search series, creators, or genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {contentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre.toLowerCase()}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Latest</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="views">Views</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Series</TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredSeries.length} series found
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </div>

            {/* Series Grid/List */}
            {filteredSeries.length > 0 ? (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredSeries.map((series) => (
                  <UnifiedSeriesCard
                    key={series.id}
                    series={series}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No series found matching your criteria
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedType("all");
                    setSelectedGenre("all");
                    setSelectedStatus("all");
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Most popular series this week
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingSeries.map((series, index) => (
                <div key={series.id} className="relative">
                  <UnifiedSeriesCard series={series} />
                  <Badge 
                    className="absolute -top-2 -left-2 bg-primary text-primary-foreground"
                  >
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}