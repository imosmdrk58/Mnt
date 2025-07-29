import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MobileNav from "@/components/layout/mobile-nav";
import SeriesGrid from "@/components/series/series-grid";
import CreatorCard from "@/components/creator/creator-card";
import QuickActions from "@/components/ui/quick-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Play,
  Bookmark,
  ArrowRight,
  Flame,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Series } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');

  // Featured series query
  const { data: featuredSeries } = useQuery<Series[]>({
    queryKey: ['/api/series/trending', { limit: 1 }],
  });

  // Mock creator data for spotlight
  const creators = [
    {
      id: '1',
      name: 'SakuraArt',
      bio: 'Creating magical worlds and unforgettable characters. Specializing in fantasy webtoons with stunning visuals.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      type: 'creator' as const,
      followersCount: 12500,
      seriesCount: 3,
      isElite: true,
    },
    {
      id: '2',
      name: 'MangaMaster',
      bio: 'Dark fantasy and psychological thriller manga. Known for intricate storylines and detailed artwork.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b39c90e4?w=100&h=100&fit=crop&crop=face',
      type: 'creator' as const,
      followersCount: 8200,
      seriesCount: 2,
      isRising: true,
    },
    {
      id: '3',
      name: 'Scanlation Squad',
      bio: 'Bringing the best international manga to English readers with high-quality translations.',
      type: 'group' as const,
      followersCount: 25000,
      seriesCount: 15,
      isStaffPick: true,
    },
  ];

  const filterTabs = [
    { id: 'all', label: 'All', active: activeFilter === 'all' },
    { id: 'webtoon', label: 'Webtoons', active: activeFilter === 'webtoon' },
    { id: 'manga', label: 'Manga', active: activeFilter === 'manga' },
    { id: 'novel', label: 'Novels', active: activeFilter === 'novel' },
    { id: 'trending', label: 'Trending', active: activeFilter === 'trending' },
    { id: 'completed', label: 'Completed', active: activeFilter === 'completed' },
  ];

  const featured = featuredSeries?.[0];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        
        {/* Hero Section */}
        {featured && (
          <section className="mb-8">
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-purple-900 to-blue-900"
                style={{
                  backgroundImage: featured.coverImageUrl 
                    ? `url('${featured.coverImageUrl}')` 
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="relative h-full flex items-center justify-start pl-8 md:pl-16">
                <div className="max-w-lg">
                  <div className="comic-bubble bg-accent text-accent-foreground px-4 py-2 rounded-lg inline-block mb-4">
                    <Sparkles className="w-4 h-4 mr-2 inline" />
                    <span className="text-sm font-medium">Featured</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {featured.title}
                  </h1>
                  <p className="text-gray-200 text-lg mb-6 line-clamp-3">
                    {featured.description || 'Discover this amazing series that has captured the hearts of readers worldwide.'}
                  </p>
                  <div className="flex items-center space-x-4">
                    <Button size="lg" className="px-6 py-3">
                      <Play className="w-5 h-5 mr-2" />
                      Start Reading
                    </Button>
                    <Button variant="secondary" size="lg" className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Bookmark className="w-5 h-5 mr-2" />
                      Add to Library
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Discover Content</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All Filters <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {filterTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={tab.active ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveFilter(tab.id)}
                className="px-4 py-2 rounded-xl font-medium transition-colors"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Content Grid */}
        <section className="mb-12">
          <SeriesGrid
            filters={activeFilter === 'all' ? {} : { type: activeFilter === 'trending' ? undefined : activeFilter as any }}
            trending={activeFilter === 'trending'}
            limit={24}
          />
        </section>

        {/* Creator Spotlight */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Creator Spotlight</h2>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All Creators <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <CreatorCard
                key={creator.id}
                {...creator}
                onFollow={() => console.log('Follow creator:', creator.id)}
                onView={() => console.log('View creator:', creator.id)}
              />
            ))}
          </div>
        </section>

        {/* Trending Today */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold text-foreground">Trending Today</h2>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <SeriesGrid
            trending={true}
            limit={12}
          />
        </section>

        {/* Recently Updated */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-success" />
              <h2 className="text-2xl font-bold text-foreground">Recently Updated</h2>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <SeriesGrid limit={12} />
        </section>

      </main>

      <MobileNav />
      <QuickActions />
    </div>
  );
}
