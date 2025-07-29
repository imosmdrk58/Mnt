export interface UserSettings {
  // Notification preferences
  notifications: {
    newChapters: boolean;
    comments: boolean;
    likes: boolean;
    follows: boolean;
    marketing: boolean;
  };
  
  // Reading preferences
  reading: {
    layout: 'vertical' | 'horizontal';
    pageMode: 'single' | 'double';
    fontSize: number;
    theme: 'light' | 'dark' | 'sepia';
    autoScroll: boolean;
    scrollSpeed: number;
  };
  
  // Content preferences
  content: {
    showMature: boolean;
    preferredLanguages: string[];
    hideCompleted: boolean;
    showSpoilers: boolean;
  };
  
  // Privacy settings
  privacy: {
    showActivity: boolean;
    showLibrary: boolean;
    allowFollows: boolean;
    showReadingHistory: boolean;
    profileVisibility: 'public' | 'friends' | 'private';
  };
}

export const defaultUserSettings: UserSettings = {
  notifications: {
    newChapters: true,
    comments: true,
    likes: true,
    follows: true,
    marketing: false,
  },
  reading: {
    layout: 'vertical',
    pageMode: 'single',
    fontSize: 16,
    theme: 'light',
    autoScroll: false,
    scrollSpeed: 1,
  },
  content: {
    showMature: false,
    preferredLanguages: ['en'],
    hideCompleted: false,
    showSpoilers: false,
  },
  privacy: {
    showActivity: true,
    showLibrary: true,
    allowFollows: true,
    showReadingHistory: true,
    profileVisibility: 'public',
  },
};