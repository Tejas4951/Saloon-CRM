import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  compact?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className,
  compact = false
}: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('total')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val);
      }
    }
    return val;
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden bg-gradient-card border-2 border-slate-300 dark:border-slate-700 shadow-md transition-all duration-200 hover:shadow-lg hover:border-amber-500/80",
        compact ? 'h-full' : '',
        className
      )}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        compact ? 'p-3 sm:p-4 pb-1 sm:pb-2' : 'pb-2'
      )}>
        <CardTitle className={cn(
          "font-medium text-muted-foreground",
          compact ? 'text-xs sm:text-sm' : 'text-sm'
        )}>
          {title}
        </CardTitle>
        <div className={cn(
          "rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300",
          compact ? 'p-1.5' : 'p-2'
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className={compact ? 'p-3 sm:p-4 pt-0 sm:pt-0' : ''}>
        <div className={cn(
          'font-bold',
          compact ? 'text-lg sm:text-xl' : 'text-2xl'
        )}>
          {formatValue(value)}
        </div>
        {description && (
          <p className={cn(
            'text-muted-foreground',
            compact ? 'text-[10px] sm:text-xs mt-0.5' : 'text-xs mt-1'
          )}>
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'flex items-center',
            trend.value >= 0 ? 'text-green-500' : 'text-red-500',
            compact ? 'text-[10px] sm:text-xs mt-1' : 'text-xs mt-2'
          )}>
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {trend.value}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}