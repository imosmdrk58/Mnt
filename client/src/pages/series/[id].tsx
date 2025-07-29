import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  Share2,
  Play,
  Users,
  Calendar,
  Clock,
  MessageCircle,
  ThumbsUp,
  Flag,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import type { Series, Chapter, Review, Comment, User } from "@shared/schema";

export default function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Validate series ID
  if (!id || id === '[object Object]') {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Series ID</h1>
            <p className="text-muted-foreground mb-6">
              The series identifier is invalid. Please check the URL.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [commentText, setCommentText] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Series can be viewed without authentication, but some features require auth
  // No redirect needed since API uses optionalAuth

  // Fetch series data (includes author information) - works without auth
  const { data: series, isLoading: seriesLoading, error: seriesError } = useQuery<Series & { author: User }>({
    queryKey: [`/api/series/${id}`],
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Author data is included with series data, no separate fetch needed

  // Fetch chapters for this specific series - works without auth
  const { data: chapters = [], isLoading: chaptersLoading, error: chaptersError } = useQuery<Chapter[]>({
    queryKey: [`/api/series/${id}/chapters`],
    enabled: !!id,
    retry: 2,
  });

  // Fetch reviews for this specific series - works without auth
  const { data: reviews = [], isLoading: reviewsLoading, error: reviewsError } = useQuery<(Review & { user: User })[]>({
    queryKey: [`/api/series/${id}/reviews`],
    enabled: !!id,
    retry: 2,
  });

  // Fetch reading progress - requires auth
  const { data: readingProgress, error: progressError } = useQuery({
    queryKey: [`/api/reading-progress/${id}`],
    enabled: !!id && isAuthenticated === true,
    retry: 1,
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { seriesId: id });
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/user/bookmarks"] });
      toast({
        title: isBookmarked ? "Removed from library" : "Added to library",
        description: isBookmarked ? "Series removed from your library" : "Series added to your library",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", "/api/follow", { 
          targetId: id, 
          targetType: "series" 
        });
      } else {
        await apiRequest("POST", "/api/follow", { 
          targetId: id, 
          targetType: "series" 
        });
      }
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/user/followed-series"] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "You unfollowed this series" : "You're now following this series",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  // Review mutation - requires authentication
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Authentication required");
      }
      await apiRequest("POST", `/api/series/${id}/reviews`, {
        rating: reviewRating,
        content: reviewText,
      });
    },
    onSuccess: () => {
      setReviewText("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: [`/api/series/${id}/reviews`] });
      toast({
        title: "Review submitted",
        description: "Thank you for your review!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error) || error.message === "Authentication required") {
        toast({
          title: "Login Required",
          description: "Please log in to submit a review.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleStartReading = () => {
    if (chapters.length > 0) {
      let targetChapter = chapters[0];
      
      // If there's reading progress, continue from that chapter
      if (readingProgress?.chapterId) {
        const progressChapter = chapters.find(c => c.id === readingProgress.chapterId);
        if (progressChapter) {
          targetChapter = progressChapter;
        }
      }
      
      navigate(`/reader/${id}/${targetChapter.id}`);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    navigate(`/reader/${id}/${chapterId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'webtoon':
        return 'bg-accent text-accent-foreground';
      case 'manga':
        return 'bg-secondary text-secondary-foreground';
      case 'novel':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Handle loading states and errors
  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Skeleton className="aspect-3-4 w-full rounded-xl" />
              </div>
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  // Handle error states
  if (seriesError) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Series</h1>
            <p className="text-muted-foreground mb-6">
              There was an error loading this series. Please try again.
            </p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Series Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The series you're looking for doesn't exist or may have been removed.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  const progressPercentage = readingProgress?.progress || 0;

  return (
    <div className="min-h-screen bg-background">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        <div className="animate-fade-in">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Series Header */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="relative aspect-3-4 rounded-xl overflow-hidden bg-muted">
                {series.coverImageUrl ? (
                  <img
                    src={series.coverImageUrl}
                    alt={`${series.title} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={getTypeColor(series.type || '')}>
                    {series.type ? series.type.charAt(0).toUpperCase() + series.type.slice(1) : "Unknown"}
                  </Badge>
                  <Badge variant="outline">
                    {series.status ? series.status.charAt(0).toUpperCase() + series.status.slice(1) : "Unknown"}
                  </Badge>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {series.title}
                </h1>
                
                <p className="text-muted-foreground mb-4">
                  by{" "}
                  <button
                    onClick={() => navigate(`/user/${series.authorId}`)}
                    className="text-primary hover:text-primary/80 font-medium hover:underline"
                  >
                    {series.author?.username || series.author?.creatorDisplayName || series.author?.firstName || "Unknown Author"}
                  </button>
                </p>
                
                <p className="text-foreground leading-relaxed">
                  {series.description || "No description available for this series."}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{series.rating}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{series.viewCount?.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{series.chapterCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Chapters</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{series.bookmarkCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Follows</p>
                </div>
              </div>

              {/* Reading Progress */}
              {progressPercentage > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reading Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progressPercentage)}% completed
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={handleStartReading}>
                  <Play className="w-5 h-5 mr-2" />
                  {progressPercentage > 0 ? 'Continue Reading' : 'Start Reading'}
                </Button>
                
                {isAuthenticated ? (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => bookmarkMutation.mutate()}
                    disabled={bookmarkMutation.isPending}
                  >
                    <Bookmark className="w-5 h-5 mr-2" />
                    {bookmarkMutation.isPending ? 'Updating...' : (isBookmarked ? 'Remove from Library' : 'Add to Library')}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.location.href = "/api/login"}
                  >
                    <Bookmark className="w-5 h-5 mr-2" />
                    Login to Bookmark
                  </Button>
                )}
                
                {isAuthenticated ? (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {followMutation.isPending ? 'Updating...' : (isFollowing ? 'Unfollow' : 'Follow')}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.location.href = "/api/login"}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Login to Follow
                  </Button>
                )}
                
                <Button variant="outline" size="lg">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              </div>

              {/* Genres and Tags */}
              {(series.genres?.length || series.tags?.length) && (
                <div className="space-y-3">
                  {series.genres?.length && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {series.genres.map((genre) => (
                          <Badge key={genre} variant="secondary">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {series.tags?.length && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {series.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="chapters" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chapters">
                Chapters ({chapters.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
              <TabsTrigger value="comments">
                Comments
              </TabsTrigger>
            </TabsList>

            {/* Chapters Tab */}
            <TabsContent value="chapters" className="space-y-4">
              {chaptersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : chapters.length > 0 ? (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <Card 
                      key={chapter.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleChapterClick(chapter.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">
                              Chapter {chapter.chapterNumber}: {chapter.title}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(chapter.createdAt!)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>{chapter.viewCount || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {chapter.status === 'premium' && (
                              <Badge className="bg-warning text-warning-foreground">
                                Premium
                              </Badge>
                            )}
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No chapters available yet.</p>
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {/* Write Review */}
              <Card className="glassmorphism">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1"
                          >
                            <Star 
                              className={`w-6 h-6 ${
                                star <= reviewRating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Review</label>
                      <Textarea
                        placeholder="Share your thoughts about this series..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    {isAuthenticated ? (
                      <Button 
                        onClick={() => reviewMutation.mutate()}
                        disabled={reviewMutation.isPending || !reviewText.trim()}
                      >
                        {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => window.location.href = "/api/login"}
                        variant="outline"
                      >
                        Login to Submit Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src={review.user?.profileImageUrl} />
                            <AvatarFallback>
                              {review.user?.username ? review.user.username.charAt(0).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{review.user?.username || "Anonymous"}</span>
                              <div className="flex items-center">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(review.createdAt!)}
                              </span>
                            </div>
                            
                            <p className="text-foreground">{review.content}</p>
                            
                            <div className="flex items-center space-x-4 mt-3">
                              <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{review.likeCount || 0}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                                <Flag className="w-4 h-4" />
                                <span>Report</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-6">
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Comments are available on individual chapters.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start reading to join the discussion!
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
