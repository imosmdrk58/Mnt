import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  ScrollText,
  BookOpen,
  PenTool,
} from "lucide-react";

export default function QuickActions() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user?.isCreator) {
    return null;
  }

  const actions = [
    {
      id: 'webtoon',
      label: 'Create Webtoon',
      icon: ScrollText,
      color: 'bg-accent hover:bg-accent/90',
      onClick: () => navigate('/creator/upload?type=webtoon'),
    },
    {
      id: 'manga',
      label: 'Create Manga',
      icon: BookOpen,
      color: 'bg-secondary hover:bg-secondary/90',
      onClick: () => navigate('/creator/upload?type=manga'),
    },
    {
      id: 'novel',
      label: 'Write Novel',
      icon: PenTool,
      color: 'bg-primary hover:bg-primary/90',
      onClick: () => navigate('/creator/upload?type=novel'),
    },
  ];

  const toggleActions = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 z-30">
      <div className="relative">
        {/* Action Menu */}
        <div 
          className={`absolute bottom-16 right-0 space-y-2 transition-all duration-300 ${
            isOpen 
              ? 'opacity-100 pointer-events-auto translate-y-0' 
              : 'opacity-0 pointer-events-none translate-y-4'
          }`}
        >
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                size="icon"
                className={`w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 ${action.color}`}
                onClick={() => handleActionClick(action)}
                title={action.label}
              >
                <IconComponent className="w-5 h-5" />
              </Button>
            );
          })}
        </div>

        {/* Main FAB */}
        <Button
          size="icon"
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 bg-gradient-to-r from-primary to-secondary hover:scale-110 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
          onClick={toggleActions}
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
