import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import type { ReaderSettings } from "@/types";

interface MangaReaderProps {
  pages: string[];
  onProgressChange?: (progress: number) => void;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  settings?: ReaderSettings;
}

type ReadingMode = 'single' | 'double' | 'webtoon';
type ReadingDirection = 'ltr' | 'rtl';

export default function MangaReader({
  pages,
  onProgressChange,
  onPreviousChapter,
  onNextChapter,
  hasPrevious = false,
  hasNext = false,
  settings = {
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 1,
  },
}: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('single');
  const [readingDirection, setReadingDirection] = useState<ReadingDirection>('ltr');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [fitToWidth, setFitToWidth] = useState(true);

  // Preload images
  useEffect(() => {
    const preloadRange = 3; // Preload 3 pages ahead and behind
    const start = Math.max(0, currentPage - preloadRange);
    const end = Math.min(pages.length - 1, currentPage + preloadRange);

    for (let i = start; i <= end; i++) {
      if (!loadedImages.has(i) && !failedImages.has(i)) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, i]));
        };
        img.onerror = () => {
          setFailedImages(prev => new Set([...prev, i]));
        };
        img.src = pages[i];
      }
    }
  }, [currentPage, pages, loadedImages, failedImages]);

  // Update progress when page changes
  useEffect(() => {
    const progress = pages.length > 0 ? ((currentPage + 1) / pages.length) * 100 : 0;
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [currentPage, pages.length, onProgressChange]);

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (readingMode === 'double') {
      setCurrentPage(prev => Math.min(pages.length - 1, prev + 2));
    } else {
      setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
    }
  }, [pages.length, readingMode]);

  const goToPreviousPage = useCallback(() => {
    if (readingMode === 'double') {
      setCurrentPage(prev => Math.max(0, prev - 2));
    } else {
      setCurrentPage(prev => Math.max(0, prev - 1));
    }
  }, [readingMode]);

  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(0, Math.min(pages.length - 1, pageNumber)));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (readingDirection === 'rtl') {
            goToNextPage();
          } else {
            goToPreviousPage();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (readingDirection === 'rtl') {
            goToPreviousPage();
          } else {
            goToNextPage();
          }
          break;
        case 'Home':
          e.preventDefault();
          goToPage(0);
          break;
        case 'End':
          e.preventDefault();
          goToPage(pages.length - 1);
          break;
        case ' ': // Spacebar
          e.preventDefault();
          goToNextPage();
          break;
        case 'Escape':
          setShowSettings(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPreviousPage, readingDirection, pages.length]);

  // Zoom functions
  const zoomIn = () => setZoomLevel(prev => Math.min(3, prev + 0.25));
  const zoomOut = () => setZoomLevel(prev => Math.max(0.5, prev - 0.25));
  const resetZoom = () => setZoomLevel(1);

  // Click navigation
  const handlePageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width * 0.3) {
      // Left third - previous page
      if (readingDirection === 'rtl') {
        goToNextPage();
      } else {
        goToPreviousPage();
      }
    } else if (clickX > width * 0.7) {
      // Right third - next page
      if (readingDirection === 'rtl') {
        goToPreviousPage();
      } else {
        goToNextPage();
      }
    }
    // Middle third - do nothing (for UI interactions)
  };

  const renderPage = (pageIndex: number) => {
    if (pageIndex >= pages.length || pageIndex < 0) return null;

    return (
      <div 
        key={pageIndex}
        className="relative flex-shrink-0"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center',
        }}
      >
        {loadedImages.has(pageIndex) ? (
          <img
            src={pages[pageIndex]}
            alt={`Page ${pageIndex + 1}`}
            className={`max-h-full ${fitToWidth ? 'w-full' : 'h-full'} object-contain`}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={handlePageClick}
            draggable={false}
          />
        ) : failedImages.has(pageIndex) ? (
          <div 
            className="w-full h-full bg-muted flex items-center justify-center min-h-[600px]"
            onClick={handlePageClick}
          >
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Failed to load page</p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFailedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(pageIndex);
                    return newSet;
                  });
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <Skeleton className="w-full min-h-[600px]" />
        )}
      </div>
    );
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pages available</p>
        </div>
      </div>
    );
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= pages.length - 1;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Reader Controls */}
      <div className="absolute top-20 right-4 z-10 space-y-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowSettings(!showSettings)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Settings className="w-4 h-4" />
        </Button>
        
        {showSettings && (
          <Card className="w-64 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Reading Mode</Label>
                <Select value={readingMode} onValueChange={(value: ReadingMode) => setReadingMode(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Page</SelectItem>
                    <SelectItem value="double">Double Page</SelectItem>
                    <SelectItem value="webtoon">Webtoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Reading Direction</Label>
                <Select value={readingDirection} onValueChange={(value: ReadingDirection) => setReadingDirection(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltr">Left to Right</SelectItem>
                    <SelectItem value="rtl">Right to Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="fit-width"
                  checked={fitToWidth}
                  onCheckedChange={setFitToWidth}
                />
                <Label htmlFor="fit-width" className="text-sm">Fit to Width</Label>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Zoom: {Math.round(zoomLevel * 100)}%</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetZoom}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={zoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Reader Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {/* Previous Chapter Button */}
        {isFirstPage && hasPrevious && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onPreviousChapter}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
          >
            <SkipBack className="w-4 h-4 mr-2" />
            Previous Chapter
          </Button>
        )}

        {/* Page Content */}
        <div className="flex items-center justify-center h-full w-full">
          {readingMode === 'double' && currentPage < pages.length - 1 ? (
            <div className="flex items-center justify-center space-x-4 h-full">
              {readingDirection === 'rtl' ? (
                <>
                  {renderPage(currentPage + 1)}
                  {renderPage(currentPage)}
                </>
              ) : (
                <>
                  {renderPage(currentPage)}
                  {renderPage(currentPage + 1)}
                </>
              )}
            </div>
          ) : (
            renderPage(currentPage)
          )}
        </div>

        {/* Next Chapter Button */}
        {isLastPage && hasNext && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNextChapter}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
          >
            Next Chapter
            <SkipForward className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={isFirstPage}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium px-3">
            {currentPage + 1} / {pages.length}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={isLastPage}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
