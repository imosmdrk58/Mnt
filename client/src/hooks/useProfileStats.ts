import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface ProfileStats {
  chaptersReadThisWeek: number;
  readingStreak: number;
  totalLikesGiven: number;
  seriesFollowed: number;
  viewsThisWeek: number;
  totalChaptersRead: number;
  favoriteGenre: string;
  lastReadSeries: string | null;
  lastReadDate: string | null;
  averageReadingTime: number; // minutes per session
}

export function useProfileStats() {
  const { user, isAuthenticated } = useAuth();

  return useQuery<ProfileStats>({
    queryKey: ['/api/user/profile-stats'],
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export type { ProfileStats };