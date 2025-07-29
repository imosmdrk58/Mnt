import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Layout } from "@/components/layout/layout";
import { ProtectedRoute } from "@/components/ui/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Home from "@/pages/home";
import SeriesDetail from "@/pages/series/[id]";
import Reader from "@/pages/reader/[seriesId]/[chapterId]";
import CreatorDashboard from "@/pages/creator/dashboard";
import CreatorUpload from "@/pages/creator/upload";
import Library from "@/pages/library";
import Profile from "@/pages/profile";

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Public routes accessible to all users */}
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/series/:id" component={SeriesDetail} />
        <Route path="/reader/:seriesId/:chapterId" component={Reader} />
        
        {/* Protected routes that require authentication */}
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
        
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
