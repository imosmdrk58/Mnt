import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserSettings } from "@/types/userSettings";
import { defaultUserSettings } from "@/types/userSettings";

export function useUserSettings() {
  const { user, isAuthenticated } = useAuth();

  const {
    data: settings,
    isLoading,
    error
  } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
    enabled: isAuthenticated && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      return await apiRequest("PATCH", "/api/user/settings", {
        settings: { ...settings, ...newSettings }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
  });

  const updateSingleSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return await apiRequest("PATCH", "/api/user/settings", {
        settingKey: key,
        value: value
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
  });

  return {
    settings: settings || defaultUserSettings,
    isLoading,
    error,
    updateSettings: updateSettingsMutation.mutate,
    updateSetting: updateSingleSettingMutation.mutate,
    isUpdating: updateSettingsMutation.isPending || updateSingleSettingMutation.isPending,
  };
}

export function useContinueReading() {
  const { user, isAuthenticated } = useAuth();

  return useQuery<Array<{
    seriesId: string;
    seriesTitle: string;
    seriesCover: string;
    lastChapterId: string;
    lastChapterTitle: string;
    lastChapterNumber: number;
    progress: number;
    lastReadAt: Date;
  }>>({
    queryKey: ['/api/user/continue-reading'],
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}