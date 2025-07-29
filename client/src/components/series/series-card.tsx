import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  Eye,
  BookOpen,
  Play,
  Crown,
  Flame,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import type { SeriesCardProps } from "@/types";

export default function SeriesCard({
  id,
  title,
  author,
  coverImageUrl,
  type,
  status,
  rating,
  chapterCount,
  viewCount,
  isNew,
  isPremium,
  isHot,
  isCompleted,
  readingProgress = 0,
  onClick,
}: SeriesCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
        return 'bg-purple-500/90 text-white';
      case 'manga':
        return 'bg-blue-500/90 text-white';
      case 'novel':
        return 'bg-green-500/90 text-white';
      default:
        return 'bg-gray-500/90 text-white';
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className="group cursor-pointer series-card overflow-hidden border-0 bg-transparent"
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Cover Image */}
        <div className="relative aspect-3-4 overflow-hidden rounded-xl bg-muted">
          {!imageError && coverImageUrl ? (
            <>
              <img
                src={coverImageUrl}
                alt={`${title} cover`}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Reading Progress Ring */}
          {readingProgress > 0 && (
            <div className="absolute top-2 right-2">
              <div className="relative w-8 h-8">
                <svg className="progress-ring w-8 h-8" viewBox="0 0 100 100">
                  <circle
                    className="stroke-white/30"
                    strokeWidth="8"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{
                      strokeDasharray: 283,
                      strokeDashoffset: 283 - (283 * readingProgress) / 100,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {Math.round(readingProgress)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status Badges - Glassmorphism style */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className={`${getTypeColor(type)} backdrop-blur-md bg-opacity-90 shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:shadow-xl transition-all duration-200`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
            
            {isNew && (
              <Badge className="bg-emerald-500/90 text-white backdrop-blur-md shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:bg-emerald-600/90 hover:shadow-xl transition-all duration-200">
                <Sparkles className="w-3 h-3 mr-1" />
                New
              </Badge>
            )}
            
            {isPremium && (
              <Badge className="bg-amber-500/90 text-white backdrop-blur-md shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:bg-amber-600/90 hover:shadow-xl transition-all duration-200">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            
            {isHot && (
              <Badge className="bg-red-500/90 text-white backdrop-blur-md shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:bg-red-600/90 hover:shadow-xl transition-all duration-200">
                <Flame className="w-3 h-3 mr-1" />
                Hot
              </Badge>
            )}
            
            {isCompleted && (
              <Badge className="bg-blue-500/90 text-white backdrop-blur-md shadow-lg border-0 rounded-full px-3 py-1 font-semibold text-xs hover:bg-blue-600/90 hover:shadow-xl transition-all duration-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Button size="sm" className="mb-2">
                <Play className="w-4 h-4 mr-2" />
                {readingProgress > 0 ? 'Continue Reading' : 'Start Reading'}
              </Button>
            </div>
          </div>
        </div>

        {/* Series Info */}
        <div className="mt-3 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground">by {author}</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-muted-foreground">{rating}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatViewCount(viewCount)}
                </span>
              </div>
            </div>
            
            <span className="text-muted-foreground">
              {chapterCount} {type === 'novel' ? 'chapters' : type === 'webtoon' ? 'episodes' : 'chapters'}
            </span>
          </div>

          {/* Reading Progress Bar */}
          {readingProgress > 0 && (
            <div className="space-y-1">
              <Progress value={readingProgress} className="h-1" />
              <p className="text-xs text-muted-foreground">
                {Math.round(readingProgress)}% completed
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
