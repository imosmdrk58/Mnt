import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/ui/protected-route";
import NotFoundPage from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import SeriesDetail from "@/pages/series/[id]";
import Reader from "@/pages/reader/[seriesId]/[chapterId]";
import CreatorDashboard from "@/pages/creator/dashboard";
import CreatorUpload from "@/pages/creator/upload";
import CreatorAnalytics from "@/pages/creator/analytics";
import Library from "@/pages/library";
import Profile from "@/pages/profile";
import BecomeCreator from "@/pages/become-creator";
import Browse from "@/pages/browse";
import Trending from "@/pages/trending";
import CoinsPage from "@/pages/coins";
import SearchPage from "@/pages/search";
import UserProfilePage from "@/pages/user/[id]";
import CreateChapter from "@/pages/creator/create-chapter";
import SeriesManage from "@/pages/creator/series-manage";
import SeriesCreateChapter from "@/pages/creator/series-create-chapter";
import SetupPage from "@/pages/setup";
import { useEffect } from "react";

interface SetupStatus {
  isSetup: boolean;
}

function SetupGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  // Check setup status
  const { data: setupStatus, isLoading } = useQuery<SetupStatus>({
    queryKey: ['/api/setup/status'],
    refetchInterval: false,
    retry: 3,
  });
  
  useEffect(() => {
    // If setup is not complete and we're not already on setup page, redirect
    if (setupStatus && !setupStatus.isSetup && !location.startsWith('/setup')) {
      setLocation('/setup');
    }
  }, [setupStatus, location, setLocation]);
  
  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }
  
  // If setup is incomplete, only show setup page
  if (setupStatus && !setupStatus.isSetup && !location.startsWith('/setup')) {
    return null; // Will redirect via useEffect
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <SetupGuard>
      <Layout>
        <Switch>
          {/* Public routes accessible to all users */}
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/trending" component={Trending} />
          <Route path="/search" component={SearchPage} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/coins" component={CoinsPage} />
          <Route path="/setup" component={SetupPage} />
          <Route path="/user/:username" component={UserProfilePage} />
          <Route path="/series/:id" component={SeriesDetail} />
          <Route path="/reader/:seriesId/:chapterId" component={Reader} />
          
          {/* Protected routes that require authentication */}
          <Route path="/become-creator">
            <ProtectedRoute>
              <BecomeCreator />
            </ProtectedRoute>
          </Route>
          <Route path="/library">
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/creator/dashboard">
            <ProtectedRoute>
              <CreatorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/creator/upload">
            <ProtectedRoute>
              <CreatorUpload />
            </ProtectedRoute>
          </Route>
          <Route path="/creator/analytics">
            <ProtectedRoute>
              <CreatorAnalytics />
            </ProtectedRoute>
          </Route>
          <Route path="/creator/series/:seriesId/manage">
            <ProtectedRoute>
              <SeriesManage />
            </ProtectedRoute>
          </Route>
          <Route path="/creator/series/:seriesId/create-chapter">
            <ProtectedRoute>
              <SeriesCreateChapter />
            </ProtectedRoute>
          </Route>
          
          <Route component={NotFoundPage} />
        </Switch>
      </Layout>
    </SetupGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
