import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart } from 'lucide-react';
import { mockBusinessSummary } from '@/data/mockData';

export const BusinessSummaryWidget: React.FC = () => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart className="h-4 w-4 text-indigo-500" />
          <span>Business Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          {mockBusinessSummary.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs"
            >
              <span className="text-muted-foreground font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{item.value}</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                  {item.growth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
