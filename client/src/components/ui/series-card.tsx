import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Heart, BookOpen, Star, Clock, User } from "lucide-react";
import type { Series } from "@shared/schema";

interface SeriesCardProps {
  series: Series;
  layout?: "grid" | "list";
}

export function SeriesCard({ series, layout = "grid" }: SeriesCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "hiatus":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "webtoon":
        return "🎨";
      case "manga":
        return "📖";
      case "novel":
        return "✍️";
      default:
        return "📚";
    }
  };

  if (layout === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Cover Image */}
            <div className="w-20 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
              {series.coverImageUrl ? (
                <img
                  src={series.coverImageUrl}
                  alt={series.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {getTypeIcon(series.type)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/series/${series.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer truncate">
                      {series.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {series.type}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(series.status || 'ongoing')} text-white border-0`}
                    >
                      {series.status || 'ongoing'}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {series.description || "No description available."}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(series.viewCount || 0)}
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {series.chapterCount || 0} chapters
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {series.rating || "0.0"}
                  </div>
                </div>
                
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/series/${series.id}`}>
                    Read Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative">
        {/* Cover Image */}
        <div className="aspect-[3/4] bg-muted overflow-hidden">
          {series.coverImageUrl ? (
            <img
              src={series.coverImageUrl}
              alt={series.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {getTypeIcon(series.type)}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <Badge 
          className={`absolute top-2 left-2 ${getStatusColor(series.status || 'ongoing')} text-white border-0`}
        >
          {series.status || 'ongoing'}
        </Badge>

        {/* NSFW Badge */}
        {series.isNSFW && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            18+
          </Badge>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button asChild>
            <Link href={`/series/${series.id}`}>
              Read Now
            </Link>
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title and Type */}
        <div className="mb-2">
          <Link href={`/series/${series.id}`}>
            <h3 className="font-semibold text-foreground hover:text-primary cursor-pointer line-clamp-2 min-h-[2.5rem]">
              {series.title}
            </h3>
          </Link>
          <Badge variant="secondary" className="text-xs mt-1">
            {series.type}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {series.description || "No description available."}
        </p>

        {/* Genres */}
        {series.genres && series.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {series.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
            {series.genres.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{series.genres.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatNumber(series.viewCount || 0)}
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {series.chapterCount || 0}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>{series.rating || "0.0"}</span>
          </div>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Avatar className="w-6 h-6">
            <AvatarImage src="" alt="Author" />
            <AvatarFallback className="bg-primary/10 text-xs">
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            Author
          </span>
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {series.updatedAt ? (
              new Date(series.updatedAt).toLocaleDateString()
            ) : (
              "Recently"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}