import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import WebtoonReader from "@/components/reader/webtoon-reader";
import MangaReader from "@/components/reader/manga-reader";
import NovelReader from "@/components/reader/novel-reader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Settings,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  Flag,
  Send,
  ChevronLeft,
  ChevronRight,
  Home,
  Share2,
  Heart,
  Eye,
  Menu,
  X,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Palette,
  Type,
} from "lucide-react";
import type { Series, Chapter, Comment } from "@shared/schema";
import type { ReaderSettings } from "@/types";

export default function Reader() {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 1,
  });
  const [commentText, setCommentText] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [uiToggleManual, setUiToggleManual] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Fetch series data
  const { data: series, isLoading: seriesLoading, error: seriesError } = useQuery<Series>({
    queryKey: [`/api/series/${seriesId}`],
    enabled: !!seriesId,
    retry: 2,
    onError: (err) => {
      console.error("Series fetch error:", err);
    },
  });

  // Fetch current chapter
  const { data: chapter, isLoading: chapterLoading, error: chapterError } = useQuery<Chapter>({
    queryKey: [`/api/chapters/${chapterId}`],
    enabled: !!chapterId,
    retry: 2,
    onError: (err) => {
      console.error("Chapter fetch error:", err);
    },
  });

  // Handle scroll-based UI hiding - MangaDex style behavior
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide UI when scrolling down (unless manually toggled)
      if (!uiToggleManual && Math.abs(currentScrollY - lastScrollY) > 10) {
        if (currentScrollY > lastScrollY && showUI) {
          // Scrolling down - hide UI
          setShowUI(false);
        } else if (currentScrollY < lastScrollY && !showUI) {
          // Scrolling up - show UI briefly
          setShowUI(true);
          // Auto-hide again after scroll stops
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            if (!uiToggleManual) {
              setShowUI(false);
            }
          }, 2000);
        }
      }
      
      setLastScrollY(currentScrollY);
    };

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, showUI, uiToggleManual]);

  // Initialize chapter data and check like status
  useEffect(() => {
    if (chapter) {
      setLikeCount(chapter.likeCount || 0);
    }
  }, [chapter]);

  // Check if user has liked this chapter
  const { data: likeStatus } = useQuery({
    queryKey: [`/api/chapters/${chapterId}/like-status`],
    enabled: !!chapterId && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (likeStatus) {
      setIsLiked(likeStatus.isLiked);
    }
  }, [likeStatus]);

  // Toggle UI visibility (manual toggle stays visible until scroll)
  const handleUIToggle = () => {
    const newShowUI = !showUI;
    setShowUI(newShowUI);
    setUiToggleManual(newShowUI);  // Track manual toggles
    
    // If manually hiding, allow auto-show on scroll up
    if (!newShowUI) {
      setTimeout(() => setUiToggleManual(false), 1000);
    }
  };

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: [`/api/chapters/${chapterId}/comments`],
    enabled: !!chapterId,
  });

  // Check bookmark status
  const { data: bookmarkStatus } = useQuery({
    queryKey: [`/api/bookmarks/${seriesId}/status`],
    enabled: !!seriesId && isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (bookmarkStatus) {
      setIsBookmarked(bookmarkStatus.isBookmarked);
    }
  }, [bookmarkStatus]);

  // Like chapter mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/chapters/${chapterId}/like`, {});
    },
    onSuccess: (result) => {
      setIsLiked(result.isLiked);
      setLikeCount(result.totalLikes);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/chapters/${chapterId}/like-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/series/${seriesId}`] });
      
      toast({
        title: result.isLiked ? "Chapter liked!" : "Like removed",
        description: result.isLiked ? "Thanks for the support!" : "Like removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like chapter",
        variant: "destructive",
      });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        return await apiRequest("DELETE", `/api/bookmarks/${seriesId}`, {});
      } else {
        return await apiRequest("POST", "/api/bookmarks", { seriesId });
      }
    },
    onSuccess: () => {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${seriesId}/status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/bookmarks`] });
      
      toast({
        title: newBookmarkState ? "Series bookmarked!" : "Bookmark removed",
        description: newBookmarkState ? "Added to your library" : "Removed from your library",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/chapters/${chapterId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: [`/api/chapters/${chapterId}/comments`] });
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  // Only redirect to login for premium content if needed
  // Note: Basic content reading should be accessible to all users

  // Fetch all chapters for navigation
  const { data: allChapters = [] } = useQuery<Chapter[]>({
    queryKey: [`/api/series/${seriesId}/chapters`],
    enabled: !!seriesId,
    retry: 2,
  });



  // Update reading progress
  const progressMutation = useMutation({
    mutationFn: async (progress: number) => {
      await apiRequest("PUT", "/api/reading-progress", {
        seriesId,
        chapterId,
        progress,
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
      }
    },
  });



  // Update reading progress when it changes
  useEffect(() => {
    if (readingProgress > 0) {
      const timeout = setTimeout(() => {
        progressMutation.mutate(readingProgress);
      }, 1000); // Debounce progress updates
      
      return () => clearTimeout(timeout);
    }
  }, [readingProgress]);

  // Navigation helpers
  const currentChapterIndex = allChapters.findIndex(c => c.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

  const handlePreviousChapter = () => {
    if (previousChapter) {
      navigate(`/reader/${seriesId}/${previousChapter.id}`);
    }
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      navigate(`/reader/${seriesId}/${nextChapter.id}`);
    }
  };

  const handleBackToSeries = () => {
    navigate(`/series/${seriesId}`);
  };

  const handleProgressChange = (progress: number) => {
    setReadingProgress(progress);
    
    // Update reading stats when chapter is completed (100% progress)
    if (progress >= 100 && isAuthenticated) {
      updateReadingStatsMutation.mutate({
        chapterId: chapterId!,
        seriesId: seriesId!,
      });
    }
  };

  // Update reading statistics mutation
  const updateReadingStatsMutation = useMutation({
    mutationFn: async ({ chapterId, seriesId }: { chapterId: string; seriesId: string }) => {
      return await apiRequest("POST", "/api/user/updateReadingStats", {
        chapterId,
        seriesId,
      });
    },
    onSuccess: () => {
      // Invalidate profile stats to refresh reading statistics
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/continue-reading'] });
    },
    onError: (error) => {
      if (!isUnauthorizedError(error)) {
        console.error("Failed to update reading stats:", error);
      }
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (seriesLoading || chapterLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="flex items-center justify-center h-full">
          <div className="space-y-4 text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!series || !chapter) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Content Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The chapter you're looking for doesn't exist or may have been removed.
          </p>
          <Button onClick={() => navigate("/")}>
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const renderReader = () => {
    const content = chapter.content as any;
    
    switch (series.type) {
      case 'webtoon':
        return (
          <WebtoonReader
            pages={Array.isArray(content) ? content : []}
            onProgressChange={handleProgressChange}
            settings={readerSettings}
          />
        );
      case 'manga':
        return (
          <MangaReader
            pages={Array.isArray(content) ? content : []}
            onProgressChange={handleProgressChange}
            onPreviousChapter={handlePreviousChapter}
            onNextChapter={handleNextChapter}
            hasPrevious={!!previousChapter}
            hasNext={!!nextChapter}
            settings={readerSettings}
          />
        );
      case 'novel':
        return (
          <NovelReader
            content={typeof content === 'string' ? content : ''}
            onProgressChange={handleProgressChange}
            settings={readerSettings}
            onSettingsChange={setReaderSettings}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Unsupported content type</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto overflow-x-hidden" onClick={handleUIToggle} style={{ overscrollBehavior: 'none' }}>
      {/* Floating Menu Button - Always Visible */}
      {!showUI && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowUI(true);
          }}
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Floating UI Header - Hideable */}
      {showUI && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" onClick={handleBackToSeries}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center flex-1 mx-4">
              <h3 className="font-semibold text-foreground truncate">
                {series.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  likeMutation.mutate();
                }}
                disabled={likeMutation.isPending}
                className={isLiked ? "text-red-500" : ""}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareModal(true);
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  bookmarkMutation.mutate();
                }}
                disabled={bookmarkMutation.isPending}
                className={isBookmarked ? "text-blue-500" : ""}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUI(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Chapter Stats */}
          <div className="flex items-center justify-center space-x-6 pb-3 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3" />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{chapter.viewCount || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-3 h-3" />
              <span>{comments.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reader Content - Full Screen */}
      <div className={`min-h-screen w-full ${showUI ? 'pt-20' : ''}`} onClick={(e) => e.stopPropagation()}>
        {renderReader()}
        
        {/* Comments Section - Always visible below content */}
        <div className="bg-background border-t border-border">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Comments ({comments.length})</span>
              </h3>
              <Button
                variant="outline"
                onClick={() => setShowComments(!showComments)}
              >
                {showComments ? 'Hide' : 'Show'} Comments
              </Button>
            </div>

            {showComments && (
              <div className="space-y-6">
                {/* Add Comment Form */}
                {isAuthenticated ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <Textarea
                            placeholder="Share your thoughts about this chapter..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end">
                            <Button
                              onClick={handleAddComment}
                              disabled={!commentText.trim() || addCommentMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Join the discussion! Sign in to comment.</p>
                      <Button onClick={() => navigate('/auth')}>
                        Sign In to Comment
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex space-x-4">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => (
                      <Card key={comment.id}>
                        <CardContent className="p-4">
                          <div className="flex space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {comment.user?.username || 'Anonymous'}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
                                  </span>
                                </div>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Navigation - Only for manga/webtoon */}
      {showUI && series.type !== 'novel' && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-background/95 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handlePreviousChapter}
                  disabled={!previousChapter}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center space-x-2 min-w-[200px]">
                  <Progress value={readingProgress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(readingProgress)}%
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleNextChapter}
                  disabled={!nextChapter}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reader Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <Select 
                value={readerSettings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'sepia') => 
                  setReaderSettings({...readerSettings, theme: value})
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sepia">
                    <div className="flex items-center space-x-2">
                      <Palette className="w-4 h-4" />
                      <span>Sepia</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {series?.type === 'manga' && (
              <>
                <div>
                  <Label className="text-sm font-medium">Reading Direction</Label>
                  <Select defaultValue="ltr">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">Left to Right</SelectItem>
                      <SelectItem value="rtl">Right to Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Fit to Width</Label>
                  <Switch />
                </div>
              </>
            )}

            {series?.type === 'webtoon' && (
              <div>
                <Label className="text-sm font-medium">Scroll Mode</Label>
                <Select defaultValue="vertical">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical Scroll</SelectItem>
                    <SelectItem value="horizontal">Horizontal Scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {series?.type === 'novel' && (
              <>
                <div>
                  <Label className="text-sm font-medium">Font Size</Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setReaderSettings({
                        ...readerSettings, 
                        fontSize: Math.max(12, readerSettings.fontSize - 2)
                      })}
                    >
                      <Type className="w-3 h-3" />
                    </Button>
                    <span className="text-sm w-12 text-center">{readerSettings.fontSize}px</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setReaderSettings({
                        ...readerSettings, 
                        fontSize: Math.min(24, readerSettings.fontSize + 2)
                      })}
                    >
                      <Type className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auto Scroll</Label>
                  <Switch 
                    checked={readerSettings.autoScroll}
                    onCheckedChange={(checked) => 
                      setReaderSettings({...readerSettings, autoScroll: checked})
                    }
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Chapter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={`${window.location.origin}/reader/${seriesId}/${chapterId}`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/reader/${seriesId}/${chapterId}`);
                    toast({
                      title: "Link copied!",
                      description: "Chapter link copied to clipboard",
                    });
                  }}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Share to Social Media</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out "${chapter?.title || 'this chapter'}" from ${series?.title || 'this series'}!`;
                    const url = `${window.location.origin}/reader/${seriesId}/${chapterId}`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                >
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `${window.location.origin}/reader/${seriesId}/${chapterId}`;
                    const title = `${chapter?.title || 'Chapter'} - ${series?.title || 'Webtoon'}`;
                    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
                  }}
                >
                  Reddit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `Check out "${chapter.title}" from ${series.title}! ${window.location.origin}/reader/${seriesId}/${chapterId}`;
                    navigator.clipboard.writeText(text);
                    toast({
                      title: "Message copied!",
                      description: "Share message copied to clipboard",
                    });
                  }}
                >
                  Discord
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Sidebar */}
      {showComments && (
        <div className="absolute top-16 right-0 w-96 h-[calc(100%-4rem)] bg-background border-l border-border overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Comments ({comments.length})</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {comment.userId.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{comment.userId}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt!)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{comment.content}</p>
                      
                      <div className="flex items-center space-x-3 mt-2">
                        <button className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{comment.likeCount || 0}</span>
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-foreground">
                          Reply
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-foreground">
                          <Flag className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                size="icon"
                onClick={() => commentMutation.mutate()}
                disabled={commentMutation.isPending || !commentText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
