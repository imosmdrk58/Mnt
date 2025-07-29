import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  Book, 
  Eye, 
  Shield, 
  Save,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Palette
} from "lucide-react";

export default function ProfileSettingsPanel() {
  const { settings, updateSettings, updateSetting, isUpdating } = useUserSettings();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handleToggleSetting = (key: string, value: boolean) => {
    updateSetting({ key, value });
    toast({
      title: "Setting Updated",
      description: "Your preference has been updated.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="new-chapters">New Chapter Notifications</Label>
            <Switch
              id="new-chapters"
              checked={settings.notifications.newChapters}
              onCheckedChange={(checked) => handleToggleSetting('notifications.newChapters', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="comments">Comment Notifications</Label>
            <Switch
              id="comments"
              checked={settings.notifications.comments}
              onCheckedChange={(checked) => handleToggleSetting('notifications.comments', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="likes">Like Notifications</Label>
            <Switch
              id="likes"
              checked={settings.notifications.likes}
              onCheckedChange={(checked) => handleToggleSetting('notifications.likes', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="follows">Follow Notifications</Label>
            <Switch
              id="follows"
              checked={settings.notifications.follows}
              onCheckedChange={(checked) => handleToggleSetting('notifications.follows', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing">Marketing Emails</Label>
            <Switch
              id="marketing"
              checked={settings.notifications.marketing}
              onCheckedChange={(checked) => handleToggleSetting('notifications.marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Book className="w-5 h-5" />
            <span>Reading Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Reading Layout</Label>
            <Select
              value={settings.reading.layout}
              onValueChange={(value: 'vertical' | 'horizontal') => 
                handleToggleSetting('reading.layout', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertical">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Vertical (Mobile)</span>
                  </div>
                </SelectItem>
                <SelectItem value="horizontal">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4" />
                    <span>Horizontal (Desktop)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Page Display Mode</Label>
            <Select
              value={settings.reading.pageMode}
              onValueChange={(value: 'single' | 'double') => 
                handleToggleSetting('reading.pageMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Page</SelectItem>
                <SelectItem value="double">Double Page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reading Theme</Label>
            <Select
              value={settings.reading.theme}
              onValueChange={(value: 'light' | 'dark' | 'sepia') => 
                handleToggleSetting('reading.theme', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="sepia">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Sepia</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Font Size: {settings.reading.fontSize}px</Label>
            <Slider
              value={[settings.reading.fontSize]}
              onValueChange={([value]) => handleToggleSetting('reading.fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-scroll">Auto Scroll</Label>
            <Switch
              id="auto-scroll"
              checked={settings.reading.autoScroll}
              onCheckedChange={(checked) => handleToggleSetting('reading.autoScroll', checked)}
            />
          </div>

          {settings.reading.autoScroll && (
            <div className="space-y-2">
              <Label>Scroll Speed: {settings.reading.scrollSpeed}x</Label>
              <Slider
                value={[settings.reading.scrollSpeed]}
                onValueChange={([value]) => handleToggleSetting('reading.scrollSpeed', value)}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Content Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-mature">Show Mature Content</Label>
              <p className="text-sm text-muted-foreground">Display content marked as mature/NSFW</p>
            </div>
            <Switch
              id="show-mature"
              checked={settings.content.showMature}
              onCheckedChange={(checked) => handleToggleSetting('content.showMature', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-completed">Hide Completed Series</Label>
            <Switch
              id="hide-completed"
              checked={settings.content.hideCompleted}
              onCheckedChange={(checked) => handleToggleSetting('content.hideCompleted', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-spoilers">Show Spoilers</Label>
            <Switch
              id="show-spoilers"
              checked={settings.content.showSpoilers}
              onCheckedChange={(checked) => handleToggleSetting('content.showSpoilers', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Privacy Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={settings.privacy.profileVisibility}
              onValueChange={(value: 'public' | 'friends' | 'private') => 
                handleToggleSetting('privacy.profileVisibility', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can view</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
                <SelectItem value="private">Private - Only me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-activity">Show Activity</Label>
            <Switch
              id="show-activity"
              checked={settings.privacy.showActivity}
              onCheckedChange={(checked) => handleToggleSetting('privacy.showActivity', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-library">Show Library</Label>
            <Switch
              id="show-library"
              checked={settings.privacy.showLibrary}
              onCheckedChange={(checked) => handleToggleSetting('privacy.showLibrary', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-follows">Allow Follows</Label>
            <Switch
              id="allow-follows"
              checked={settings.privacy.allowFollows}
              onCheckedChange={(checked) => handleToggleSetting('privacy.allowFollows', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-reading-history">Show Reading History</Label>
            <Switch
              id="show-reading-history"
              checked={settings.privacy.showReadingHistory}
              onCheckedChange={(checked) => handleToggleSetting('privacy.showReadingHistory', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}