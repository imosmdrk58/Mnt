import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  Search, 
  BookOpen, 
  ArrowLeft,
  Compass
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-12 text-center">
          {/* Comic-style 404 Illustration */}
          <div className="mb-8">
            <div className="relative mx-auto w-48 h-48 mb-6">
              {/* Speech bubble with 404 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-4xl font-bold shadow-lg">
                404
              </div>
              
              {/* Comic book style explosion effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full opacity-20 animate-pulse"></div>
              </div>
              
              {/* Scattered comic elements */}
              <div className="absolute top-8 right-4 text-2xl animate-bounce">💥</div>
              <div className="absolute bottom-8 left-4 text-2xl animate-bounce" style={{animationDelay: '0.5s'}}>⭐</div>
              <div className="absolute top-12 left-8 text-xl animate-bounce" style={{animationDelay: '1s'}}>💫</div>
              
              {/* Central book icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            
            {/* Comic-style text */}
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Lost in the Panels?
            </h1>
            
            <p className="text-xl text-muted-foreground mb-2">
              Looks like this page got caught in a plot twist!
            </p>
            
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist, but don't worry - 
              there are plenty of amazing stories waiting to be discovered.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Return Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link href="/browse">
                <Compass className="w-5 h-5 mr-2" />
                Discover Stories
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="min-w-[200px]">
              <Link href="/search">
                <Search className="w-5 h-5 mr-2" />
                Search Content
              </Link>
            </Button>
          </div>

          {/* Fun comic-style elements */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
              <span>Error Code:</span>
              <code className="bg-muted px-2 py-1 rounded text-primary font-mono">
                CHAPTER_NOT_FOUND_404
              </code>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              "Every great story has plot holes, but this one's a bit too literal!" 📚
            </p>
          </div>

          {/* Back button for navigation history */}
          <div className="mt-6">
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}