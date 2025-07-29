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
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !user) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to read content.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, user, toast]);

  // Fetch series data
  const { data: series, isLoading: seriesLoading } = useQuery<Series>({
    queryKey: ["/api/series", seriesId],
    enabled: !!seriesId && isAuthenticated,
    retry: false,
  });

  // Fetch current chapter
  const { data: chapter, isLoading: chapterLoading } = useQuery<Chapter>({
    queryKey: ["/api/chapters", chapterId],
    enabled: !!chapterId && isAuthenticated,
    retry: false,
  });

  // Fetch all chapters for navigation
  const { data: allChapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/series", seriesId, "chapters"],
    enabled: !!seriesId && isAuthenticated,
    retry: false,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/chapters", chapterId, "comments"],
    enabled: !!chapterId && isAuthenticated,
    retry: false,
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

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chapters/${chapterId}/comments`, {
        content: commentText,
      });
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chapters", chapterId, "comments"] });
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully!",
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${seriesId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { seriesId });
      }
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
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
  };

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
    <div className="fixed inset-0 bg-background z-50">
      {/* Reader Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border">
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
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <div className="pt-16 h-full">
        {renderReader()}
      </div>

      {/* Reader Footer */}
      {series.type !== 'novel' && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-border p-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePreviousChapter}
              disabled={!previousChapter}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex-1">
              <div className="relative">
                <Progress value={readingProgress} className="h-2" />
                <span className="absolute -top-6 left-0 text-xs text-muted-foreground">
                  {Math.round(readingProgress)}% completed
                </span>
              </div>
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
        </div>
      )}

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
