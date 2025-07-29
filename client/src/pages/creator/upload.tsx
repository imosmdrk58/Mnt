import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  BookOpen,
  ScrollText,
  PenTool,
  X,
  Plus,
  Eye,
  Save,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

type ContentType = 'webtoon' | 'manga' | 'novel';

interface SeriesFormData {
  title: string;
  description: string;
  type: ContentType;
  genres: string[];
  tags: string[];
  isNSFW: boolean;
  coverImage?: File;
}

interface ChapterFormData {
  title: string;
  chapterNumber: number;
  content: File[] | string;
  status: 'free' | 'premium';
  coinPrice: number;
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Thriller', 'Supernatural'
];

export default function CreatorUpload() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'series' | 'chapter'>('series');
  const [contentType, setContentType] = useState<ContentType>('webtoon');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Series form state
  const [seriesData, setSeriesData] = useState<SeriesFormData>({
    title: '',
    description: '',
    type: 'webtoon',
    genres: [],
    tags: [],
    isNSFW: false,
  });

  // Chapter form state
  const [chapterData, setChapterData] = useState<ChapterFormData>({
    title: '',
    chapterNumber: 1,
    content: [],
    status: 'free',
    coinPrice: 0,
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [textContent, setTextContent] = useState('');
  const [newTag, setNewTag] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to upload content.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [authLoading, isAuthenticated, user, toast]);

  // Check URL params for content type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type') as ContentType;
    if (typeParam && ['webtoon', 'manga', 'novel'].includes(typeParam)) {
      setContentType(typeParam);
      setSeriesData(prev => ({ ...prev, type: typeParam }));
    }
  }, []);

  // Series creation mutation
  const createSeriesMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', seriesData.title);
      formData.append('description', seriesData.description);
      formData.append('type', seriesData.type);
      formData.append('genres', JSON.stringify(seriesData.genres));
      formData.append('tags', JSON.stringify(seriesData.tags));
      formData.append('isNSFW', seriesData.isNSFW.toString());
      
      if (seriesData.coverImage) {
        formData.append('coverImage', seriesData.coverImage);
      }

      const response = await fetch('/api/series', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (newSeries) => {
      toast({
        title: "Series created successfully!",
        description: "You can now add chapters to your series.",
      });
      navigate(`/series/${newSeries.id}`);
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
        title: "Error creating series",
        description: error.message || "Failed to create series. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      if (activeTab === 'series') {
        // Cover image upload
        if (files[0] && files[0].type.startsWith('image/')) {
          setSeriesData(prev => ({ ...prev, coverImage: files[0] }));
        }
      } else {
        // Chapter content upload
        if (contentType === 'novel') {
          // For novels, don't accept file drops
          return;
        }
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        setUploadedFiles(prev => [...prev, ...imageFiles]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (activeTab === 'series') {
        if (files[0] && files[0].type.startsWith('image/')) {
          setSeriesData(prev => ({ ...prev, coverImage: files[0] }));
        }
      } else {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        setUploadedFiles(prev => [...prev, ...imageFiles]);
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addGenre = (genre: string) => {
    if (!seriesData.genres.includes(genre)) {
      setSeriesData(prev => ({
        ...prev,
        genres: [...prev.genres, genre]
      }));
    }
  };

  const removeGenre = (genre: string) => {
    setSeriesData(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !seriesData.tags.includes(newTag.trim())) {
      setSeriesData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSeriesData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmitSeries = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!seriesData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for your series.",
        variant: "destructive",
      });
      return;
    }

    if (!seriesData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a description for your series.",
        variant: "destructive",
      });
      return;
    }

    if (!seriesData.coverImage) {
      toast({
        title: "Validation Error",
        description: "Please upload a cover image for your series.",
        variant: "destructive",
      });
      return;
    }

    createSeriesMutation.mutate();
  };

  const getContentTypeInfo = (type: ContentType) => {
    switch (type) {
      case 'webtoon':
        return {
          icon: ScrollText,
          title: 'Webtoon',
          description: 'Vertical scrolling format with continuous panels',
          color: 'bg-accent text-accent-foreground',
        };
      case 'manga':
        return {
          icon: BookOpen,
          title: 'Manga',
          description: 'Traditional page-by-page reading format',
          color: 'bg-secondary text-secondary-foreground',
        };
      case 'novel':
        return {
          icon: PenTool,
          title: 'Novel',
          description: 'Text-based storytelling with rich formatting',
          color: 'bg-primary text-primary-foreground',
        };
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!user.isCreator) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Creator Access Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be a creator to upload content. Contact support to become a creator.
            </p>
            <Button onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  const typeInfo = getContentTypeInfo(contentType);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        <div className="animate-fade-in space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/creator/dashboard")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Create New Content</h1>
              <p className="text-muted-foreground mt-1">
                Share your stories with the world
              </p>
            </div>
          </div>

          {/* Content Type Selector */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle>Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {(['webtoon', 'manga', 'novel'] as ContentType[]).map((type) => {
                  const info = getContentTypeInfo(type);
                  const Icon = info.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setContentType(type);
                        setSeriesData(prev => ({ ...prev, type }));
                      }}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                        contentType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold">{info.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Form */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'series' | 'chapter')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="series">Series Information</TabsTrigger>
              <TabsTrigger value="chapter">Chapter Upload</TabsTrigger>
            </TabsList>

            {/* Series Information Tab */}
            <TabsContent value="series" className="space-y-6">
              <form onSubmit={handleSubmitSeries} className="space-y-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TypeIcon className="w-5 h-5" />
                      <span>Series Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Cover Image Upload */}
                    <div>
                      <Label>Cover Image</Label>
                      <div
                        className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                          dragActive 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        {seriesData.coverImage ? (
                          <div className="space-y-4">
                            <img
                              src={URL.createObjectURL(seriesData.coverImage)}
                              alt="Cover preview"
                              className="w-32 h-40 object-cover rounded-lg mx-auto"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setSeriesData(prev => ({ ...prev, coverImage: undefined }))}
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                            <div>
                              <p className="text-foreground font-medium">
                                Drop your cover image here, or{" "}
                                <label className="text-primary cursor-pointer hover:underline">
                                  browse
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                  />
                                </label>
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Recommended size: 600x800px
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={seriesData.title}
                        onChange={(e) => setSeriesData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter your series title"
                        className="mt-2"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={seriesData.description}
                        onChange={(e) => setSeriesData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your series..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    {/* Genres */}
                    <div>
                      <Label>Genres</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {GENRES.map((genre) => (
                            <button
                              key={genre}
                              type="button"
                              onClick={() => addGenre(genre)}
                              disabled={seriesData.genres.includes(genre)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                seriesData.genres.includes(genre)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-primary/20'
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                        
                        {seriesData.genres.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Selected Genres:</p>
                            <div className="flex flex-wrap gap-2">
                              {seriesData.genres.map((genre) => (
                                <Badge key={genre} className="flex items-center space-x-1">
                                  <span>{genre}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeGenre(genre)}
                                    className="hover:bg-white/20 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex space-x-2">
                          <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add custom tags..."
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          />
                          <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {seriesData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {seriesData.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="flex items-center space-x-1">
                                <span>{tag}</span>
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="hover:bg-white/20 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NSFW Flag */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nsfw"
                        checked={seriesData.isNSFW}
                        onCheckedChange={(checked) => 
                          setSeriesData(prev => ({ ...prev, isNSFW: !!checked }))
                        }
                      />
                      <Label htmlFor="nsfw" className="text-sm">
                        This series contains mature content (18+)
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" type="button" onClick={() => navigate("/creator/dashboard")}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSeriesMutation.isPending || !seriesData.title.trim()}
                  >
                    {createSeriesMutation.isPending ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Series
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Chapter Upload Tab */}
            <TabsContent value="chapter" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Chapter Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Create a series first to upload chapters.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => setActiveTab('series')}
                    >
                      Create Series First
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
