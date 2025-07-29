import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ui/theme-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Moon,
  Sun,
  Settings,
  User,
  BookOpen,
  Coins,
  Crown,
  LogOut,
} from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 glassmorphism-dark backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16 relative">
          {/* Logo - Positioned on left */}
          <div className="absolute left-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">
                ContentHub
              </span>
            </Link>
          </div>

          {/* Navigation Menu - Centered */}
          <div className="flex-1 flex justify-center items-center space-x-8">
            <div className="hidden lg:flex items-center space-x-6">
              <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
                Home
              </Link>
              <Link href="/browse" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/browse" ? "text-primary" : "text-muted-foreground"}`}>
                Browse
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/library" className={`text-sm font-medium transition-colors hover:text-primary ${location === "/library" ? "text-primary" : "text-muted-foreground"}`}>
                    Library
                  </Link>
                  {user?.isCreator ? (
                    <Link href="/creator/dashboard" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/creator") ? "text-primary" : "text-muted-foreground"}`}>
                      Create
                    </Link>
                  ) : (
                    <Link href="/become-creator" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
                      Become Creator
                    </Link>
                  )}
                </>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex w-full max-w-md">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search series, creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 bg-background/50 border-border focus:border-primary"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </form>
            </div>
          </div>

          {/* User Actions - Positioned on right */}
          <div className="absolute right-0 flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {isAuthenticated ? (
              <>
                {/* Coins Balance */}
                <div className="hidden sm:flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    {user?.coinBalance?.toLocaleString() || 0}
                  </span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                        <AvatarFallback>
                          {user?.firstName?.[0] || user?.email?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {user?.isEliteReader && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-accent">
                          <Crown className="h-3 w-3" />
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email}
                        </p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/library">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Library
                      </Link>
                    </DropdownMenuItem>
                    {user?.isCreator && (
                      <DropdownMenuItem asChild>
                        <Link href="/creator/dashboard">
                          <Settings className="mr-2 h-4 w-4" />
                          Creator Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} disabled={isLoggingOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
