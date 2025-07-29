import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PenTool,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  Upload,
  MessageSquare,
  BarChart3,
  Palette,
  BookOpen,
  Zap,
  Shield,
} from "lucide-react";

export default function BecomeCreator() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [applicationData, setApplicationData] = useState({
    displayName: "",
    bio: "",
    portfolioUrl: "",
    socialMediaUrl: "",
    contentTypes: [] as string[],
    experience: "",
    motivation: "",
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  // Redirect if already a creator
  if (user?.isCreator) {
    setLocation("/creator/dashboard");
    return null;
  }

  const applyCreatorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/creator/apply", applicationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the Creator Program!",
        description: "Your application has been approved! You now have access to the Creator Dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/creator/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContentTypeToggle = (type: string) => {
    setApplicationData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationData.displayName || !applicationData.bio || applicationData.contentTypes.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    applyCreatorMutation.mutate();
  };

  const benefits = [
    {
      icon: Upload,
      title: "Publish Your Content",
      description: "Upload webtoons, manga, and novels with our advanced publishing tools"
    },
    {
      icon: Users,
      title: "Build Your Audience",
      description: "Connect with readers and grow your fanbase across the platform"
    },
    {
      icon: TrendingUp,
      title: "Monetize Your Work",
      description: "Earn coins from premium chapters and reader support"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track views, engagement, and earnings with detailed analytics"
    },
    {
      icon: MessageSquare,
      title: "Community Features",
      description: "Interact with fans through comments and direct messaging"
    },
    {
      icon: Shield,
      title: "Content Protection",
      description: "Your work is protected with advanced anti-piracy measures"
    }
  ];

  const contentTypes = [
    { id: "webtoon", label: "Webtoons", icon: Palette },
    { id: "manga", label: "Manga", icon: BookOpen },
    { id: "novel", label: "Novels", icon: PenTool },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Become a Creator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators sharing their stories with millions of readers worldwide. 
            Turn your passion into a thriving creative career.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-12" />

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="w-5 h-5 mr-2" />
              Creator Application
            </CardTitle>
            <CardDescription>
              Tell us about yourself and your creative work. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    placeholder="Your creator name"
                    value={applicationData.displayName}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell readers about yourself and your work..."
                    value={applicationData.bio}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      placeholder="https://your-portfolio.com"
                      value={applicationData.portfolioUrl}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="socialMediaUrl">Social Media</Label>
                    <Input
                      id="socialMediaUrl"
                      placeholder="https://twitter.com/yourhandle"
                      value={applicationData.socialMediaUrl}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, socialMediaUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content Types */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Content Types *</h3>
                <p className="text-sm text-muted-foreground">
                  Select the type(s) of content you plan to create:
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = applicationData.contentTypes.includes(type.id);
                    return (
                      <Badge
                        key={type.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer p-3 text-sm"
                        onClick={() => handleContentTypeToggle(type.id)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                        {isSelected && <CheckCircle className="w-4 h-4 ml-2" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Experience & Motivation */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tell Us More</h3>
                
                <div>
                  <Label htmlFor="experience">Previous Experience</Label>
                  <Textarea
                    id="experience"
                    placeholder="Describe your experience creating content, any previous publications, or relevant background..."
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, experience: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="motivation">Why do you want to become a creator?</Label>
                  <Textarea
                    id="motivation"
                    placeholder="Share your motivation and goals as a creator on our platform..."
                    value={applicationData.motivation}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, motivation: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Submit */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Applications are typically reviewed within 24-48 hours
                </div>
                <Button 
                  type="submit" 
                  disabled={applyCreatorMutation.isPending}
                  className="min-w-32"
                >
                  {applyCreatorMutation.isPending ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}