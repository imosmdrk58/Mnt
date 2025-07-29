import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Type,
  Palette,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  BookOpen,
  AlignLeft,
} from "lucide-react";
import type { ReaderSettings } from "@/types";

interface NovelReaderProps {
  content: string;
  onProgressChange?: (progress: number) => void;
  settings?: ReaderSettings;
  onSettingsChange?: (settings: ReaderSettings) => void;
}

export default function NovelReader({
  content,
  onProgressChange,
  settings = {
    fontSize: 16,
    lineHeight: 1.6,
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 1,
  },
  onSettingsChange,
}: NovelReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Calculate reading time and word count
  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/).length;
      const readingTime = Math.ceil(words / 250); // Assume 250 WPM reading speed
      setEstimatedReadingTime(readingTime);
    }
  }, [content]);

  // Handle scroll progress tracking
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    setCurrentProgress(progress);
    
    // Calculate words read based on scroll position
    if (content) {
      const totalWords = content.trim().split(/\s+/).length;
      const wordsRead = Math.floor((progress / 100) * totalWords);
      setWordsRead(wordsRead);
    }
    
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [content, onProgressChange]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!settings.autoScroll || !isAutoScrolling || !containerRef.current) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const scrollAmount = settings.scrollSpeed * 0.5; // Slower scroll for reading
        containerRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        
        // Stop auto-scroll at the end
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          setIsAutoScrolling(false);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [settings.autoScroll, settings.scrollSpeed, isAutoScrolling]);

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
        case ' ': // Spacebar for auto-scroll toggle
          e.preventDefault();
          setIsAutoScrolling(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update settings
  const updateSettings = (newSettings: Partial<ReaderSettings>) => {
    const updated = { ...settings, ...newSettings };
    if (onSettingsChange) {
      onSettingsChange(updated);
    }
  };

  // Parse markdown-like content to HTML
  const parseContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`(.*?)`/g, '<code>$1</code>') // Code
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br />'); // Line breaks
  };

  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-yellow-50 text-yellow-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No content available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
          <Card className="w-80 bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4 space-y-6">
              {/* Font Size */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Font Size: {settings.fontSize}px
                </Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSettings({ fontSize: value })}
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>
              
              {/* Line Height */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Line Height: {settings.lineHeight}
                </Label>
                <Slider
                  value={[settings.lineHeight]}
                  onValueChange={([value]) => updateSettings({ lineHeight: value })}
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              {/* Theme */}
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'light' | 'dark' | 'sepia') => 
                    updateSettings({ theme: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="sepia">Sepia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Auto-scroll Settings */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    id="auto-scroll"
                    checked={settings.autoScroll}
                    onCheckedChange={(checked) => updateSettings({ autoScroll: checked })}
                  />
                  <Label htmlFor="auto-scroll" className="text-sm">Auto-scroll</Label>
                </div>
                
                {settings.autoScroll && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Scroll Speed: {settings.scrollSpeed}x
                    </Label>
                    <Slider
                      value={[settings.scrollSpeed]}
                      onValueChange={([value]) => updateSettings({ scrollSpeed: value })}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reading Stats */}
      <div className="absolute top-20 left-4 z-10">
        <Card className="bg-background/80 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Type className="w-4 h-4" />
                <span>{wordsRead} / {content.trim().split(/\s+/).length} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlignLeft className="w-4 h-4" />
                <span>{Math.round(currentProgress)}%</span>
              </div>
              <div>
                <span>{estimatedReadingTime} min read</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-scroll Controls */}
      {settings.autoScroll && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            >
              {isAutoScrolling ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm font-medium">
              {isAutoScrolling ? 'Pause' : 'Play'} Auto-scroll
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden transition-colors duration-300 ${getThemeClasses()}`}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          overscrollBehavior: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div 
            ref={contentRef}
            className="prose prose-lg max-w-none"
            style={{
              fontSize: 'inherit',
              lineHeight: 'inherit',
            }}
            dangerouslySetInnerHTML={{
              __html: `<p>${parseContent(content)}</p>`
            }}
          />
          
          {/* End of chapter indicator */}
          <div className="py-8 text-center">
            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-lg font-semibold mb-2">End of Chapter</p>
              <p className="text-sm text-muted-foreground">
                {wordsRead} words read • {Math.round(currentProgress)}% complete
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
