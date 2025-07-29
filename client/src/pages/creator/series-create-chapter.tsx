import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import MobileNav from "@/components/layout/mobile-nav";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Save, 
  Eye,
  Coins,
  AlertTriangle
} from "lucide-react";
import type { Series } from "@shared/schema";

const chapterSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  chapterNumber: z.number().min(1, "Chapter number must be at least 1"),
  content: z.string().optional(),
  coinPrice: z.number().min(0, "Price cannot be negative").max(100, "Price too high"),
  isPremium: z.boolean(),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

export default function CreateChapter() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch series data
  const { data: series, isLoading: seriesLoading } = useQuery<Series & { author: any }>({
    queryKey: ["/api/series", seriesId],
    enabled: !!seriesId,
  });

  // Get next chapter number
  const { data: chapters = [] } = useQuery<any[]>({
    queryKey: ["/api/series", seriesId, "chapters"],
    enabled: !!seriesId,
  });

  const nextChapterNumber = chapters.length > 0 
    ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 
    : 1;

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      chapterNumber: nextChapterNumber,
      content: "",
      coinPrice: 0,
      isPremium: false,
    },
  });

  // Create chapter mutation
  const createChapterMutation = useMutation({
    mutationFn: async (data: ChapterFormData) => {
      setUploading(true);
      const formData = new FormData();
      
      // Add form fields
      formData.append("title", data.title);
      formData.append("chapterNumber", data.chapterNumber.toString());
      formData.append("coinPrice", data.coinPrice.toString());
      
      // Add content based on series type
      if (series?.type === "novel") {
        formData.append("content", data.content || "");
      } else {
        // Add uploaded files for webtoon/manga
        uploadedFiles.forEach((file) => {
          formData.append("pages", file);
        });
      }

      const response = await fetch(`/api/series/${seriesId}/chapters`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create chapter');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/series", seriesId, "chapters"] });
      toast({
        title: "Success",
        description: "Chapter created successfully!",
      });
      navigate(`/creator/series/${seriesId}/manage`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create chapter",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  // File upload handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only image files under 10MB are allowed",
        variant: "destructive",
      });
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = (data: ChapterFormData) => {
    // Validate content based on series type
    if (series?.type === "novel" && !data.content?.trim()) {
      toast({
        title: "Content required",
        description: "Novel chapters must have text content",
        variant: "destructive",
      });
      return;
    }
    
    if (series?.type !== "novel" && uploadedFiles.length === 0) {
      toast({
        title: "Images required",
        description: "Webtoon and manga chapters must have at least one image",
        variant: "destructive",
      });
      return;
    }

    createChapterMutation.mutate(data);
  };

  if (seriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Series Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The series you're trying to add a chapter to doesn't exist or you don't have permission.
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

  const canSetPremium = (series.bookmarkCount || 0) >= 500;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(`/creator/series/${seriesId}/manage`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Series
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Chapter</h1>
              <p className="text-muted-foreground">{series.title}</p>
            </div>
          </div>
          <Badge className="capitalize">
            {series.type}
          </Badge>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Information</CardTitle>
              <CardDescription>Basic details for your new chapter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapterNumber">Chapter Number</Label>
                  <Input
                    id="chapterNumber"
                    type="number"
                    min="1"
                    {...form.register("chapterNumber", { valueAsNumber: true })}
                  />
                  {form.formState.errors.chapterNumber && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.chapterNumber.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Chapter Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter chapter title..."
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Premium Settings */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isPremium">Premium Chapter</Label>
                    <p className="text-sm text-muted-foreground">
                      Charge coins to read this chapter
                    </p>
                    {!canSetPremium && (
                      <div className="flex items-center space-x-2 mt-1">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <p className="text-sm text-warning">Need 500+ followers for premium chapters</p>
                      </div>
                    )}
                  </div>
                  <Switch
                    id="isPremium"
                    disabled={!canSetPremium}
                    {...form.register("isPremium")}
                  />
                </div>
                
                {form.watch("isPremium") && canSetPremium && (
                  <div className="space-y-2">
                    <Label htmlFor="coinPrice">Coin Price</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="coinPrice"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        className="max-w-32"
                        {...form.register("coinPrice", { valueAsNumber: true })}
                      />
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-muted-foreground">coins</span>
                    </div>
                    {form.formState.errors.coinPrice && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.coinPrice.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {series.type === "novel" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
                <span>
                  {series.type === "novel" ? "Chapter Content" : "Chapter Pages"}
                </span>
              </CardTitle>
              <CardDescription>
                {series.type === "novel" 
                  ? "Write your chapter content using markdown formatting"
                  : "Upload images for your chapter pages in reading order"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {series.type === "novel" ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your chapter content here..."
                    rows={12}
                    className="font-mono"
                    {...form.register("content")}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">Upload Chapter Pages</p>
                      <p className="text-sm text-muted-foreground">
                        Select multiple images or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported: JPG, PNG, WebP (max 10MB each)
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Pages ({uploadedFiles.length})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Page ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <p className="text-xs text-center mt-1 text-muted-foreground">
                              Page {index + 1}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/creator/series/${seriesId}/manage`)}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate(`/series/${seriesId}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Series
              </Button>
              <Button 
                type="submit" 
                disabled={createChapterMutation.isPending || uploading}
              >
                <Save className="w-4 h-4 mr-2" />
                {createChapterMutation.isPending ? "Creating..." : "Create Chapter"}
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-primary animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Creating chapter...</p>
                    <Progress value={66} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

      </main>
      <MobileNav />
    </div>
  );
}