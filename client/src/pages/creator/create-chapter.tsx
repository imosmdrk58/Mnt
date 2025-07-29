import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  ArrowLeft, 
  Save, 
  Eye,
  GripVertical,
  Plus
} from "lucide-react";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  order: number;
}

export default function CreateChapter() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [status, setStatus] = useState<'free' | 'premium'>('free');
  const [coinPrice, setCoinPrice] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch series data
  const { data: series } = useQuery({
    queryKey: ["/api/series", seriesId],
    enabled: !!seriesId,
  });

  // Fetch existing chapters to determine next chapter number
  const { data: chapters = [] } = useQuery({
    queryKey: ["/api/series", seriesId, "chapters"],
    enabled: !!seriesId,
  });

  // Update chapter number when chapters data changes
  useState(() => {
    if (chapters.length > 0) {
      const maxChapter = Math.max(...chapters.map((ch: any) => ch.chapterNumber));
      setChapterNumber(maxChapter + 1);
    }
  });

  const createChapterMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('chapterNumber', chapterNumber.toString());
      formData.append('seriesId', seriesId!);
      formData.append('status', status);
      formData.append('coinPrice', coinPrice.toString());
      
      // Add images in order
      uploadedImages.forEach((img, index) => {
        formData.append('images', img.file);
        formData.append('imageOrder', index.toString());
      });

      return fetch('/api/chapters', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    },
    onSuccess: () => {
      toast({
        title: "Chapter created successfully!",
        description: "Your chapter has been published.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/series", seriesId, "chapters"] });
      navigate(`/series/${seriesId}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating chapter",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const preview = URL.createObjectURL(file);
        
        setUploadedImages(prev => [...prev, {
          id,
          file,
          preview,
          order: prev.length
        }]);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const items = Array.from(uploadedImages);
    const [reorderedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, reorderedItem);

    // Update order
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setUploadedImages(updatedItems);
  };

  const canCreatePremium = series && ((series as any).bookmarkCount || 0) >= 500;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/series/${seriesId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Series
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Chapter</h1>
              <p className="text-sm text-muted-foreground">
                Series: {(series as any)?.title}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={() => createChapterMutation.mutate()}
              disabled={!title.trim() || uploadedImages.length === 0 || createChapterMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {createChapterMutation.isPending ? 'Publishing...' : 'Publish Chapter'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Chapter Details */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chapterNumber">Chapter Number</Label>
                  <Input
                    id="chapterNumber"
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Chapter Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter chapter title"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the chapter"
                  rows={3}
                />
              </div>

              {/* Premium Options */}
              <div className="space-y-3">
                <Label>Publishing Options</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant={status === 'free' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus('free')}
                  >
                    Free Chapter
                  </Button>
                  <Button
                    variant={status === 'premium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus('premium')}
                    disabled={!canCreatePremium}
                  >
                    Premium Chapter
                  </Button>
                  {!canCreatePremium && (
                    <Badge variant="secondary">
                      Need 500+ follows for premium chapters
                    </Badge>
                  )}
                </div>
                
                {status === 'premium' && (
                  <div className="mt-2">
                    <Label htmlFor="coinPrice">Coin Price</Label>
                    <Input
                      id="coinPrice"
                      type="number"
                      value={coinPrice}
                      onChange={(e) => setCoinPrice(parseInt(e.target.value) || 0)}
                      min={1}
                      max={100}
                      placeholder="Enter coin price (1-100)"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Images</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Chapter Images</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop images here, or click to select files
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Select Images
                  </label>
                </Button>
              </div>

              {/* Image Preview Grid */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">
                    Uploaded Images ({uploadedImages.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                          <img
                            src={image.preview}
                            alt={`Chapter image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 flex space-x-1">
                          {index > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={() => moveImage(index, index - 1)}
                            >
                              ←
                            </Button>
                          )}
                          {index < uploadedImages.length - 1 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={() => moveImage(index, index + 1)}
                            >
                              →
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                          onClick={() => removeImage(image.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Badge className="absolute bottom-2 left-2 text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}