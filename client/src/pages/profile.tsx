import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/theme-provider";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Settings,
  Crown,
  BookOpen,
  Eye,
  Star,
  Calendar,
  Coins,
  Bell,
  Shield,
  Palette,
  Globe,
  Download,
  Trash2,
  Edit3,
  Camera,
  TrendingUp,
  Clock,
  Target,
  Award,
} from "lucide-react";
import type { User as UserType, Transaction } from "@shared/schema";
import type { UserStats } from "@/types";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to view your profile.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [authLoading, isAuthenticated, user, toast]);

  // Initialize profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: "", // This would come from user profile if we had a bio field
      });
    }
  }, [user]);

  // Fetch user transactions for stats
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Fetch bookmarked series for stats
  const { data: bookmarkedSeries = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ["/api/user/bookmarks"],
    enabled: isAuthenticated && !!user,
    retry: false,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      // This would be a PUT request to update user profile
      // For now, we'll simulate it since the backend doesn't have this endpoint yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    });
  };

  // Calculate user stats
  const calculateStats = (): UserStats => {
    const chaptersRead = transactions.filter(t => t.type === 'unlock').length;
    const coinsSpent = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      readingStreak: 7, // This would be calculated based on daily reading activity
      chaptersRead,
      timeSpent: chaptersRead * 15, // Estimate 15 minutes per chapter
      favoriteGenres: ['Fantasy', 'Romance', 'Action'], // This would be calculated from reading history
      weeklyGoal: 10,
      weeklyProgress: Math.min(chaptersRead % 10, 10),
    };
  };

  const stats = calculateStats();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mobile-nav-spacing">
        <div className="animate-fade-in space-y-8">
          
          {/* Profile Header */}
          <Card className="glassmorphism">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
                    <AvatarFallback className="text-2xl">
                      {user.firstName?.[0] || user.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.isEliteReader && (
                    <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                      <Crown className="w-3 h-3" />
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Enter last name"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleSaveProfile}
                          disabled={updateProfileMutation.isPending}
                        >
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h1 className="text-2xl font-bold text-foreground">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </h1>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {user.coinBalance?.toLocaleString() || 0} coins
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Joined {new Date(user.createdAt!).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reading Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reading Streak</p>
                    <p className="text-2xl font-bold text-foreground">{stats.readingStreak}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chapters Read</p>
                    <p className="text-2xl font-bold text-foreground">{stats.chaptersRead}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold text-foreground">{Math.floor(stats.timeSpent / 60)}h</p>
                  </div>
                  <Clock className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bookmarks</p>
                    <p className="text-2xl font-bold text-foreground">{bookmarkedSeries.length}</p>
                  </div>
                  <Star className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Reading Goal */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Weekly Reading Goal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {stats.weeklyProgress} / {stats.weeklyGoal} chapters this week
                  </span>
                  <Badge variant="secondary">
                    {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
                  </Badge>
                </div>
                <Progress 
                  value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="preferences" className="space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
            </div>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred color theme
                      </p>
                    </div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-3">Reading Preferences</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Auto-scroll novels</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically scroll when reading novels
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Show reading progress</p>
                          <p className="text-xs text-muted-foreground">
                            Display progress indicators on series cards
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Auto-bookmark</p>
                          <p className="text-xs text-muted-foreground">
                            Automatically bookmark series you start reading
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Favorite Genres</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.favoriteGenres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Privacy Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your reading activity
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Reading History</p>
                      <p className="text-sm text-muted-foreground">
                        Display your recently read series publicly
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Allow Friend Requests</p>
                      <p className="text-sm text-muted-foreground">
                        Let other users send you friend requests
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Chapter Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when followed series have new chapters
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Comment Replies</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when someone replies to your comments
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your reading activity
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Receive promotional emails about new features
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email Address</Label>
                      <Input value={user.email || ""} disabled className="mt-1" />
                    </div>
                    <div>
                      <Label>Member Since</Label>
                      <Input 
                        value={new Date(user.createdAt!).toLocaleDateString()}
                        disabled 
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  {user.isCreator && (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-5 h-5 text-primary" />
                        <span className="font-medium text-primary">Creator Account</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have creator privileges and can publish content.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glassmorphism border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    <span>Danger Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
