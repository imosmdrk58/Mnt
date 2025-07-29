import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MobileNav from "@/components/layout/mobile-nav";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  BookOpen, 
  Users, 
  DollarSign,
  Upload,
  Save,
  Settings,
  Heart,
  MessageCircle,
  Star,
  GripVertical,
  MoreVertical,
  Copy,
  Archive,
  TrendingUp,
  BarChart3
} from "lucide-react";
import type { Series, Chapter } from "@shared/schema";

export default function SeriesManage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [chapterOrder, setChapterOrder] = useState<Chapter[]>([]);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({
    title: "",
    description: "",
    status: "",
    genres: [] as string[],
    tags: [] as string[]
  });

  // Fetch series data
  const { data: series, isLoading: seriesLoading } = useQuery<Series & { author: any }>({
    queryKey: [`/api/series/${seriesId}`],
    enabled: !!seriesId,
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: [`/api/series/${seriesId}/chapters`],
    enabled: !!seriesId,
  });

  // Update chapter order when chapters data changes
  React.useEffect(() => {
    if (chapters && chapters.length > 0) {
      setChapterOrder(chapters);
    }
  }, [chapters]);

  // Initialize metadata form when series loads
  if (series && !isEditingMetadata && metadataForm.title === "") {
    setMetadataForm({
      title: series.title || "",
      description: series.description || "",
      status: series.status || "",
      genres: series.genres || [],
      tags: series.tags || []
    });
  }

  // Series update mutation
  const updateSeriesMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        body: data,
      });
      if (!response.ok) throw new Error('Failed to update series');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/series/${seriesId}`] });
      toast({
        title: "Success",
        description: "Series updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update series",
        variant: "destructive",
      });
    },
  });

  // Delete chapter mutation
  const deleteChapterMutation = useMutation({
    mutationFn: async (chapterId: string) => {
      const response = await fetch(`/api/chapters/${chapterId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to delete chapter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/series/${seriesId}/chapters`] });
      toast({
        title: "Success",
        description: "Chapter deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chapter",
        variant: "destructive",
      });
    },
  });

  // Drag and drop handlers
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(chapterOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setChapterOrder(items);

    // Update chapter order in backend
    try {
      await apiRequest("POST", `/api/series/${seriesId}/reorder-chapters`, {
        chapterIds: items.map(chapter => chapter.id)
      });
      queryClient.invalidateQueries({ queryKey: [`/api/series/${seriesId}/chapters`] });
      toast({
        title: "Chapters reordered",
        description: "Chapter order updated successfully!",
      });
    } catch (error) {
      // Revert on error
      setChapterOrder(chapters);
      toast({
        title: "Error",
        description: "Failed to reorder chapters",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
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
              The series you're trying to manage doesn't exist or you don't have permission to edit it.
            </p>
            <Button onClick={() => navigate("/creator/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate("/creator/dashboard")} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold text-foreground">{series.title}</h1>
                  <Badge className={`capitalize ${series.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {series.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{chapters.length} chapters</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{series.viewCount?.toLocaleString() || 0} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{series.bookmarkCount || 0} followers</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{series.rating || 0}/5 rating</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => navigate(`/series/${seriesId}`)}>
                <Eye className="w-4 h-4 mr-2" />
                View Public
              </Button>
              <Button onClick={() => navigate(`/creator/series/${seriesId}/create-chapter`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Chapter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mobile-nav-spacing">
        {/* Modern Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="border-b">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-none">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="chapters"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Chapters ({chapterOrder.length})
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{series.viewCount?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">All time views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Followers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{series.bookmarkCount?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">Users following</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chapters</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chapters.length}</div>
                  <p className="text-xs text-muted-foreground">Published chapters</p>
                </CardContent>
              </Card>
            </div>

            {/* Series Info */}
            <Card>
              <CardHeader>
                <CardTitle>Series Information</CardTitle>
                <CardDescription>Basic details about your series</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Badge className="w-fit">
                      {series.type ? series.type.charAt(0).toUpperCase() + series.type.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge variant="outline" className="w-fit">
                      {series.status ? series.status.charAt(0).toUpperCase() + series.status.slice(1) : "Unknown"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {series.description || "No description available"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chapters Tab with Drag and Drop */}
          <TabsContent value="chapters" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Chapters</h2>
                <p className="text-sm text-muted-foreground">Drag chapters to reorder them</p>
              </div>
              <Button onClick={() => navigate(`/creator/series/${seriesId}/create-chapter`)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Chapter
              </Button>
            </div>

            {chaptersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : chapterOrder.length > 0 ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="chapters">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-4 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-accent/10 rounded-lg p-4' : ''
                      }`}
                    >
                      {chapterOrder.map((chapter: Chapter, index: number) => (
                        <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`transition-all ${
                                snapshot.isDragging 
                                  ? 'shadow-lg rotate-1 scale-105' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                                    </div>
                                    
                                    {/* Chapter Preview Image */}
                                    <div className="w-16 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                      {chapter.previewImage || (chapter.images && chapter.images.length > 0) ? (
                                        <img 
                                          src={chapter.previewImage || chapter.images?.[0]} 
                                          alt={`Chapter ${chapter.chapterNumber} preview`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-medium text-primary">#{chapter.chapterNumber}</span>
                                        <h3 className="font-semibold">{chapter.title}</h3>
                                        {chapter.status === 'premium' && (
                                          <Badge variant="outline" className="text-xs">
                                            Premium
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                        <span className="flex items-center space-x-1">
                                          <Eye className="w-4 h-4" />
                                          <span>{chapter.viewCount?.toLocaleString() || 0}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <Heart className="w-4 h-4" />
                                          <span>{chapter.likeCount || 0}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                          <MessageCircle className="w-4 h-4" />
                                          <span>0</span>
                                        </span>
                                        {chapter.coinPrice && chapter.coinPrice > 0 && (
                                          <span className="flex items-center space-x-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span>{chapter.coinPrice}</span>
                                          </span>
                                        )}
                                        <span className="flex items-center space-x-1">
                                          <Calendar className="w-4 h-4" />
                                          <span>{formatDate(chapter.createdAt!)}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => navigate(`/reader/${seriesId}/${chapter.id}`)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Chapter Actions</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-2">
                                          <Button variant="outline" className="justify-start">
                                            <Copy className="w-4 h-4 mr-2" />
                                            Duplicate Chapter
                                          </Button>
                                          <Button variant="outline" className="justify-start">
                                            <Archive className="w-4 h-4 mr-2" />
                                            Archive Chapter
                                          </Button>
                                          <Button 
                                            variant="destructive" 
                                            className="justify-start"
                                            onClick={() => deleteChapterMutation.mutate(chapter.id)}
                                            disabled={deleteChapterMutation.isPending}
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Chapter
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No chapters yet</h3>
                  <p className="text-muted-foreground mb-4">Start building your series by creating your first chapter.</p>
                  <Button onClick={() => navigate(`/creator/series/${seriesId}/create-chapter`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Chapter
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Coming Soon</CardTitle>
                <CardDescription>Detailed analytics and insights for your series</CardDescription>
              </CardHeader>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <p>Advanced analytics features are currently under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Series Settings</CardTitle>
                <CardDescription>Update your series information and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-muted-foreground">
                  <p>Series editing features are currently under development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
      <MobileNav />
    </div>
  );
}