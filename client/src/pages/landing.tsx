import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Users, 
  Zap, 
  Globe, 
  Sparkles,
  ArrowRight,
  Play,
  Star,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Multi-Format Content",
      description: "Read webtoons, manga, and novels all in one place with optimized readers for each format.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Creator Community",
      description: "Join thousands of creators and collaborate with groups to bring amazing stories to life.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast & Responsive",
      description: "Enjoy lightning-fast loading and smooth scrolling on any device, anywhere.",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Content",
      description: "Discover content from creators worldwide with multilingual support and translations.",
    },
  ];

  const stats = [
    { label: "Active Readers", value: "2.5M+" },
    { label: "Published Series", value: "50K+" },
    { label: "Daily Updates", value: "1K+" },
    { label: "Languages", value: "25+" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">StoryVerse</span>
          </div>
          <Button onClick={() => window.location.href = "/api/login"}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Welcome to the Future of Digital Storytelling
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Read, Create, and Share
            <span className="gradient-text block">Amazing Stories</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join millions of readers and creators on StoryVerse. Discover webtoons, manga, and novels 
            from talented artists around the world, or share your own stories with our community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="px-8 py-3"
              onClick={() => window.location.href = "/api/login"}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Reading
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Learn More
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="gradient-text"> Create & Consume</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you're a reader looking for your next favorite series or a creator 
            ready to share your stories, StoryVerse has you covered.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glassmorphism border-0 hover-scale">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Content Preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trending on <span className="gradient-text">StoryVerse</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Discover what millions of readers are enjoying right now
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="glassmorphism border-0 hover-scale overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/50" />
                </div>
                <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                  Webtoon
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Featured Series {item}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  An epic adventure that captures the hearts of readers worldwide...
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-muted-foreground">4.8</span>
                  </div>
                  <span className="text-sm text-muted-foreground">1.2M views</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="glassmorphism border-0 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of passionate readers and creators. Sign up now and 
              get access to thousands of amazing stories, plus powerful tools to create your own.
            </p>
            <Button 
              size="lg" 
              className="px-8 py-3"
              onClick={() => window.location.href = "/api/login"}
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold">StoryVerse</span>
          </div>
          <p>&copy; 2024 StoryVerse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
