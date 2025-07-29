import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  Crown,
  TrendingUp,
  Star,
} from "lucide-react";
import type { CreatorCardProps } from "@/types";

export default function CreatorCard({
  id,
  name,
  bio,
  avatarUrl,
  type,
  followersCount,
  seriesCount,
  isElite,
  isRising,
  isStaffPick,
  onFollow,
  onView,
}: CreatorCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    if (onFollow) {
      onFollow();
    }
  };

  const handleView = () => {
    if (onView) {
      onView();
    }
  };

  return (
    <Card 
      className="glassmorphism hover-scale cursor-pointer"
      onClick={handleView}
    >
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Avatar className="w-12 h-12 mr-3">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>
              {type === 'group' ? (
                <Users className="w-6 h-6" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">
              {type === 'group' ? 'Translation Group' : 'Creator'}
            </p>
          </div>
          
          <div className="ml-auto">
            {isElite && (
              <Badge className="bg-accent text-accent-foreground">
                <Crown className="w-3 h-3 mr-1" />
                Elite
              </Badge>
            )}
            {isRising && (
              <Badge className="bg-success text-success-foreground">
                <TrendingUp className="w-3 h-3 mr-1" />
                Rising
              </Badge>
            )}
            {isStaffPick && (
              <Badge className="bg-warning text-warning-foreground">
                <Star className="w-3 h-3 mr-1" />
                Staff Pick
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {bio}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatFollowerCount(followersCount)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {seriesCount} series
              </span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant={isFollowing ? "secondary" : "default"}
            onClick={handleFollow}
            className="transition-colors"
          >
            {isFollowing ? 'Following' : type === 'group' ? 'Join Group' : 'Follow'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
