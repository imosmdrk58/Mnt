import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Bookmark,
  PlusCircle,
  User,
  Search,
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/",
      isActive: location === "/",
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      path: "/search",
      isActive: location.startsWith("/search"),
    },
    {
      id: "library",
      label: "Library",
      icon: Bookmark,
      path: "/library",
      isActive: location === "/library",
    },
    {
      id: "create",
      label: "Create",
      icon: PlusCircle,
      path: "/creator/upload",
      isActive: location === "/creator/upload",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
      isActive: location === "/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border z-40">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              asChild
              className={`flex flex-col items-center p-2 h-auto space-y-1 ${
                item.isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Link href={item.path}>
                <IconComponent className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
