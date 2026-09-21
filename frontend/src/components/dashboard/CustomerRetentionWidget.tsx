import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RotateCw, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { useCustomers } from '@/contexts/CustomersContext';

export const CustomerRetentionWidget: React.FC = () => {
  const { customers } = useCustomers();
  const totalCustomers = customers.length;
  const returningCustomers = customers.filter(customer => customer.visitCount > 1).length;
  const repeatRate = totalCustomers ? Math.round((returningCustomers / totalCustomers) * 100) : 0;
  const customersWithVisits = customers.filter(customer => customer.visitCount > 0);
  const avgVisitIntervalDays = customersWithVisits.length
    ? Math.round(customersWithVisits.reduce((sum, customer) => sum + Math.max(1, 365 / customer.visitCount), 0) / customersWithVisits.length)
    : 0;
  const insight = totalCustomers
    ? `${returningCustomers} of ${totalCustomers} customers have returned for another visit.`
    : 'Customer retention will appear after real customer visits are recorded.';
  
  // Calculate SVG donut circumference for 68%
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (repeatRate / 100) * circumference;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <RotateCw className="h-4 w-4 text-teal-500" />
          <span>Customer Retention</span>
        </CardTitle>
        <button className="text-xs text-primary font-medium flex items-center hover:underline cursor-pointer">
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        <div className="flex items-center gap-6">
          {/* Circular Donut Progress Chart */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-muted/30 stroke-current"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-teal-500 stroke-current transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-foreground">{repeatRate}%</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Repeat Rate</span>
            </div>
          </div>

          {/* Stats breakdown */}
          <div className="space-y-2 flex-1 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-500" /> Total Customers
              </span>
              <span className="font-bold">{totalCustomers.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <RotateCw className="h-3.5 w-3.5 text-teal-500" /> Returning Customers
              </span>
              <span className="font-bold">{returningCustomers.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-500" /> Avg. Visit Interval
              </span>
              <span className="font-bold">{avgVisitIntervalDays} days</span>
            </div>
          </div>
        </div>

        {/* Insight Banner */}
        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 text-teal-800 dark:text-teal-200 text-xs flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-medium text-[11px]">{insight}</span>
        </div>
      </CardContent>
    </Card>
  );
};
