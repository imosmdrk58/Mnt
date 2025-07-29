import { useEffect, useRef, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ImageIcon } from "lucide-react";
import type { ReaderSettings } from "@/types";

interface WebtoonReaderProps {
  pages: string[];
  onProgressChange?: (progress: number) => void;
  settings?: ReaderSettings;
}

export default function WebtoonReader({
  pages,
  onProgressChange,
  settings = {
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 1,
  },
}: WebtoonReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [currentProgress, setCurrentProgress] = useState(0);

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = () => {
      pages.forEach((page, index) => {
        if (!loadedImages.has(index) && !failedImages.has(index)) {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, index]));
          };
          img.onerror = () => {
            setFailedImages(prev => new Set([...prev, index]));
          };
          img.src = page;
        }
      });
    };

    if (pages.length > 0) {
      preloadImages();
    }
  }, [pages, loadedImages, failedImages]);

  // Handle scroll progress tracking
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    setCurrentProgress(progress);
    
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [onProgressChange]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!settings.autoScroll || !containerRef.current) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const scrollAmount = settings.scrollSpeed * 2; // Adjust scroll speed
        containerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [settings.autoScroll, settings.scrollSpeed]);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          containerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
          break;
        case 'ArrowDown':
          e.preventDefault();
          containerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
          break;
        case 'PageUp':
          e.preventDefault();
          containerRef.current.scrollBy({ 
            top: -containerRef.current.clientHeight * 0.8, 
            behavior: 'smooth' 
          });
          break;
        case 'PageDown':
          e.preventDefault();
          containerRef.current.scrollBy({ 
            top: containerRef.current.clientHeight * 0.8, 
            behavior: 'smooth' 
          });
          break;
        case 'Home':
          e.preventDefault();
          containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'End':
          e.preventDefault();
          containerRef.current.scrollTo({ 
            top: containerRef.current.scrollHeight, 
            behavior: 'smooth' 
          });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!pages || pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto bg-background"
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {pages.map((page, index) => (
          <div key={index} className="relative">
            {loadedImages.has(index) ? (
              <img
                src={page}
                alt={`Page ${index + 1}`}
                className="w-full h-auto block"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
                loading="lazy"
              />
            ) : failedImages.has(index) ? (
              <div 
                className="w-full bg-muted flex items-center justify-center"
                style={{ minHeight: '400px' }}
              >
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Failed to load image</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setFailedImages(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(index);
                        return newSet;
                      });
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <Skeleton 
                className="w-full"
                style={{ minHeight: '400px' }}
              />
            )}
            
            {/* Page number indicator */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {index + 1} / {pages.length}
            </div>
          </div>
        ))}
        
        {/* End of chapter indicator */}
        <div className="py-8 text-center">
          <div className="bg-muted/50 rounded-lg p-6 mx-4">
            <p className="text-lg font-semibold mb-2">End of Chapter</p>
            <p className="text-sm text-muted-foreground">
              Progress: {Math.round(currentProgress)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
