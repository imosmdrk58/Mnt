export interface SeriesCardProps {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  type: 'webtoon' | 'manga' | 'novel';
  status: 'ongoing' | 'completed' | 'hiatus';
  rating: number;
  chapterCount: number;
  viewCount: number;
  isNew?: boolean;
  isPremium?: boolean;
  isHot?: boolean;
  isCompleted?: boolean;
  readingProgress?: number;
  onClick?: () => void;
}

export interface CreatorCardProps {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  type: 'creator' | 'group';
  followersCount: number;
  seriesCount: number;
  isElite?: boolean;
  isRising?: boolean;
  isStaffPick?: boolean;
  onFollow?: () => void;
  onView?: () => void;
}

export interface AnalyticsData {
  totalViews: number;
  followers: number;
  coinsEarned: number;
  activeSeries: number;
  monthlyGrowth?: {
    views: number;
    followers: number;
    coins: number;
  };
}

export interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  autoScroll: boolean;
  scrollSpeed: number;
}

export interface ChapterContent {
  type: 'webtoon' | 'manga' | 'novel';
  pages?: string[]; // Image URLs for webtoon/manga
  text?: string; // Text content for novels
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  isActive?: boolean;
  badge?: number;
}

export interface FilterOptions {
  type?: 'all' | 'webtoon' | 'manga' | 'novel';
  status?: 'all' | 'ongoing' | 'completed' | 'hiatus';
  genre?: string;
  sort?: 'trending' | 'newest' | 'rating' | 'views';
}

export interface UserStats {
  readingStreak: number;
  chaptersRead: number;
  timeSpent: number;
  favoriteGenres: string[];
  weeklyGoal: number;
  weeklyProgress: number;
}

export interface NotificationItem {
  id: string;
  type: 'chapter_update' | 'comment_reply' | 'follow' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}
