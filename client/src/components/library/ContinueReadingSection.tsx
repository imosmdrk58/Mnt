import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContinueReading } from "@/hooks/useUserSettings";
import { PlayCircle, Clock, BookOpen } from "lucide-react";

export default function ContinueReadingSection() {
  const { data: continueReading, isLoading, error } = useContinueReading();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Continue Reading</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !continueReading?.length) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Reading History</h3>
        <p className="text-muted-foreground mb-4">
          Start reading some series to see your progress here!
        </p>
        <Button asChild>
          <Link href="/browse">Browse Series</Link>
        </Button>
      </div>
    );
  }

  const formatLastRead = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <PlayCircle className="w-6 h-6" />
          <span>Continue Reading</span>
        </h2>
        <Badge variant="secondary">{continueReading.length} Series</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {continueReading.map((item) => (
          <Card key={`${item.seriesId}-${item.lastChapterId}`} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative">
              <img
                src={item.seriesCover || '/placeholder-cover.jpg'}
                alt={item.seriesTitle}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button asChild size="sm" className="bg-white/90 text-black hover:bg-white">
                  <Link href={`/reader/${item.seriesId}/${item.lastChapterId}`}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Continue
                  </Link>
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-white mt-1 flex justify-between">
                  <span>Ch. {item.lastChapterNumber}</span>
                  <span>{Math.round(item.progress)}%</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {item.seriesTitle}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                {item.lastChapterTitle}
              </p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatLastRead(item.lastReadAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {continueReading.length > 8 && (
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/library/history">View All Reading History</Link>
          </Button>
        </div>
      )}
    </div>
  );
}