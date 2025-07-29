import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UnifiedSeriesCard from "@/components/ui/unified-series-card";
import { 
  User as UserIcon, 
  Calendar, 
  Users, 
  BookOpen, 
  Star,
  Shield,
  Crown,
  Award,
  Follow,
  MessageCircle,
  Eye
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { User, Series } from "@shared/schema";

interface UserProfile extends User {
  series?: Series[];
  stats?: {
    followers: number;
    following: number;
    chaptersRead: number;
  };
  isFollowing?: boolean;
}

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("series");
  const { toast } = useToast();

  // Fetch user profile data by username
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/user', username],
    enabled: !!username,
  });

  // Fetch real-time reading stats
  const { data: readingStats } = useQuery({
    queryKey: ['/api/user', profile?.id, 'stats'],
    enabled: !!profile?.id,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ followingId, isFollowing }: { followingId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        return apiRequest('/api/follow', 'DELETE', { followingId });
      } else {
        return apiRequest('/api/follow', 'POST', { followingId });
      }
    },
    onSuccess: (_, { isFollowing }) => {
      // Invalidate and refetch the profile
      queryClient.invalidateQueries({ queryKey: ['/api/user', username] });
      toast({
        title: isFollowing ? "Unfollowed" : "Followed",
        description: isFollowing ? "You unfollowed this user" : "You are now following this user",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleFollowClick = () => {
    if (!profile || !isAuthenticated) return;
    
    followMutation.mutate({
      followingId: profile.id,
      isFollowing: profile.isFollowing || false,
    });
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Unknown";
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return format(date, 'MMMM yyyy');
    } catch {
      return "Unknown";
    }
  };

  const getBadges = (user: User) => {
    const badges = [];
    
    if (user.isCreator) {
      badges.push({ 
        name: "Creator", 
        icon: <Star className="w-3 h-3" />, 
        color: "bg-yellow-500" 
      });
    }
    
    if (user.isEliteReader) {
      badges.push({ 
        name: "Elite Reader", 
        icon: <Crown className="w-3 h-3" />, 
        color: "bg-purple-500" 
      });
    }
    
    if (user.followersCount && user.followersCount > 1000) {
      badges.push({ 
        name: "Popular", 
        icon: <Users className="w-3 h-3" />, 
        color: "bg-blue-500" 
      });
    }
    
    if (user.followersCount && user.followersCount > 10000) {
      badges.push({ 
        name: "Verified", 
        icon: <Shield className="w-3 h-3" />, 
        color: "bg-green-500" 
      });
    }

    return badges;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <UserIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              The user you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const badges = getBadges(profile);
  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.profileImageUrl || ""} />
                <AvatarFallback className="text-2xl">
                  {profile.firstName?.[0] || profile.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">
                      {profile.creatorDisplayName || 
                       (profile.firstName && profile.lastName 
                         ? `${profile.firstName} ${profile.lastName}` 
                         : profile.username)}
                    </h1>
                    {badges.map((badge, index) => (
                      <Badge 
                        key={index}
                        className={`${badge.color} text-white flex items-center gap-1`}
                      >
                        {badge.icon}
                        {badge.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-lg text-muted-foreground">@{profile.username}</p>
                  
                  {profile.creatorBio && (
                    <p className="text-foreground mt-3 max-w-2xl">
                      {profile.creatorBio}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{profile.stats?.followers || 0}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{profile.series?.length || 0}</span>
                    <span className="text-muted-foreground">series</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-muted-foreground">
                      Joined {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && isAuthenticated && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleFollowClick}
                      disabled={followMutation.isPending}
                      variant={profile.isFollowing ? "outline" : "default"}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {profile.isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}

                {isOwnProfile && (
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="series">
              Series ({profile.series?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Recent Activity
            </TabsTrigger>
            {profile.isCreator && (
              <TabsTrigger value="stats">
                Creator Stats
              </TabsTrigger>
            )}
          </TabsList>

          {/* Series Tab */}
          <TabsContent value="series">
            {profile.series && profile.series.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {profile.series.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Series Yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Start creating your first series!" 
                      : "This creator hasn't published any series yet."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Reading Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Reading Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chapters Read</span>
                      <span className="font-semibold">{readingStats?.chaptersRead || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reading Streak</span>
                      <span className="font-semibold">{readingStats?.readingStreak || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Read</span>
                      <span className="font-semibold text-xs">
                        {readingStats?.lastRead ? readingStats.lastRead.title : "None"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Future Activity Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">First Chapter</Badge>
                    </div>
                    {readingStats?.readingStreak && readingStats.readingStreak >= 7 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default">7 Day Streak</Badge>
                      </div>
                    )}
                    {readingStats?.chaptersRead && readingStats.chaptersRead >= 100 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Chapter Master</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Creator Stats Tab */}
          {profile.isCreator && (
            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                        <p className="text-2xl font-bold">
                          {profile.series?.reduce((sum, s) => sum + (s.viewCount || 0), 0).toLocaleString() || "0"}
                        </p>
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
                        <p className="text-2xl font-bold">{profile.followersCount?.toLocaleString() || "0"}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Series</p>
                        <p className="text-2xl font-bold">
                          {profile.series?.filter(s => s.status === 'ongoing').length || "0"}
                        </p>
                      </div>
                      <BookOpen className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-bold">
                          {profile.series?.length 
                            ? (profile.series.reduce((sum, s) => sum + parseFloat(s.rating || '0'), 0) / profile.series.length).toFixed(1)
                            : "0.0"
                          }
                        </p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Series Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.series && profile.series.length > 0 ? (
                    <div className="space-y-4">
                      {profile.series.map((series) => (
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
                                {series.chapterCount || 0} chapters • {series.status || 'ongoing'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{(series.viewCount || 0).toLocaleString()} views</p>
                            <p className="text-sm text-muted-foreground">
                              ★ {series.rating || "0.0"} ({series.ratingCount || 0})
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
          )}
        </Tabs>
      </div>
    </div>
  );
}