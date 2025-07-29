import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import SeriesDetail from "@/pages/series/[id]";
import Reader from "@/pages/reader/[seriesId]/[chapterId]";
import CreatorDashboard from "@/pages/creator/dashboard";
import CreatorUpload from "@/pages/creator/upload";
import Library from "@/pages/library";
import Profile from "@/pages/profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/series/:id" component={SeriesDetail} />
          <Route path="/reader/:seriesId/:chapterId" component={Reader} />
          <Route path="/creator/dashboard" component={CreatorDashboard} />
          <Route path="/creator/upload" component={CreatorUpload} />
          <Route path="/library" component={Library} />
          <Route path="/profile" component={Profile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
