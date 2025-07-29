import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Settings
} from "lucide-react";
import type { Series, Chapter } from "@shared/schema";

export default function SeriesManage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch series data
  const { data: series, isLoading: seriesLoading } = useQuery<Series & { author: any }>({
    queryKey: ["/api/series", seriesId],
    enabled: !!seriesId,
  });

  // Fetch chapters
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/series", seriesId, "chapters"],
    enabled: !!seriesId,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/series", seriesId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/series", seriesId, "chapters"] });
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/creator/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{series.title}</h1>
              <p className="text-muted-foreground">Manage your series</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate(`/series/${seriesId}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
            <Button onClick={() => navigate(`/creator/series/${seriesId}/create-chapter`)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chapters">Chapters ({chapters.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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

          {/* Chapters Tab */}
          <TabsContent value="chapters" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Chapters</h2>
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
            ) : chapters.length > 0 ? (
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <Card key={chapter.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-primary">{chapter.chapterNumber}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{chapter.title}</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              <span>{chapter.viewCount?.toLocaleString() || 0} views</span>
                              {chapter.coinPrice && chapter.coinPrice > 0 && (
                                <>
                                  <DollarSign className="w-4 h-4" />
                                  <span>{chapter.coinPrice} coins</span>
                                </>
                              )}
                              <Calendar className="w-4 h-4" />
                              <span>{chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteChapterMutation.mutate(chapter.id)}
                            disabled={deleteChapterMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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