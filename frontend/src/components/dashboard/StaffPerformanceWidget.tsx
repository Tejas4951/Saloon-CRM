import React from 'react';
import { ArrowRight, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockStaffPerformance } from '@/data/mockData';

export const StaffPerformanceWidget: React.FC = () => {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-emerald-500" />
          <span>Staff Performance</span>
        </CardTitle>
        <button className="text-xs text-primary font-medium flex items-center hover:underline cursor-pointer">
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b text-muted-foreground font-medium">
                <th className="py-2.5 px-2 font-medium">Staff</th>
                <th className="py-2.5 px-2 text-center font-medium">Services</th>
                <th className="py-2.5 px-2 text-right font-medium">Revenue</th>
                <th className="py-2.5 px-2 text-right font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {mockStaffPerformance.map((staff) => (
                <tr key={staff.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-2 font-medium flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {staff.initials}
                    </div>
                    <span className="truncate max-w-[120px]">{staff.name}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-muted-foreground">
                    {staff.servicesCount}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold">
                    ₹{staff.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{staff.commission.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
