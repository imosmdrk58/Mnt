import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'destructive';
}

export default function AnalyticsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'primary',
}: AnalyticsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary/10 text-primary';
      case 'secondary':
        return 'bg-secondary/10 text-secondary';
      case 'accent':
        return 'bg-accent/10 text-accent';
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-warning/10 text-warning';
      case 'destructive':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="glassmorphism">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">
              {formatValue(value)}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center">
            {change > 0 ? (
              <div className="flex items-center text-success">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">+{change}%</span>
              </div>
            ) : change < 0 ? (
              <div className="flex items-center text-destructive">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{change}%</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No change</span>
            )}
            {changeLabel && (
              <span className="text-muted-foreground text-sm ml-2">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
