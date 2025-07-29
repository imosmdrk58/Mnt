import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Eye,
  BookOpen,
  Play,
  Heart,
  Bookmark,
} from "lucide-react";
import type { Series, User } from "@shared/schema";

interface UnifiedSeriesCardProps {
  series: Series & { author?: User };
  showProgress?: boolean;
  readingProgress?: number;
  onClick?: () => void;
}

export default function UnifiedSeriesCard({
  series,
  showProgress = false,
  readingProgress = 0,
  onClick,
}: UnifiedSeriesCardProps) {
  const [, navigate] = useLocation();

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'webtoon':
        return 'bg-purple-500 text-white';
      case 'manga':
        return 'bg-blue-500 text-white';
      case 'novel':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/series/${series.id}`);
    }
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-0 bg-transparent hover:scale-105 transition-transform duration-200"
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Cover Image */}
        <div className="relative aspect-3-4 overflow-hidden rounded-xl bg-muted">
          {series.coverImageUrl ? (
            <img
              src={series.coverImageUrl}
              alt={series.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Type Badge - Only show series type on covers */}
          <div className="absolute top-2 left-2">
            <Badge className={`${getTypeColor(series.type || 'unknown')} backdrop-blur-sm bg-opacity-90 shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:shadow-xl transition-all duration-200`}>
              {series.type ? series.type.charAt(0).toUpperCase() + series.type.slice(1) : "Unknown"}
            </Badge>
          </div>

          {/* NSFW Badge if applicable */}
          {series.isNSFW && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs font-semibold">
                18+
              </Badge>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button size="sm" className="bg-white text-black hover:bg-white/90">
              <Play className="w-4 h-4 mr-2" />
              Read Now
            </Button>
          </div>
        </div>

        {/* Reading Progress */}
        {showProgress && readingProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <Progress value={readingProgress} className="h-1" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
          {series.title}
        </h3>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{series.rating || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{formatViewCount(series.viewCount || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-3 h-3" />
              <span>{series.chapterCount || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Author */}
        <p className="text-xs text-muted-foreground truncate">
          by {series.author?.username || series.author?.firstName || series.author?.creatorDisplayName || "Unknown"}
        </p>
      </div>
    </Card>
  );
}