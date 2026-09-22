import React from 'react';
import { ArrowRight, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaff } from '@/contexts/StaffContext';
import { useTally } from '@/contexts/TallyContext';

export const StaffPerformanceWidget: React.FC = () => {
  const { employees } = useStaff();
  const { tallyItems } = useTally();
  const staffPerformance = employees.map(employee => {
    const entries = tallyItems.filter(item => item.staffName === employee.name && item.paymentStatus === 'completed');
    const revenue = entries.reduce((sum, item) => sum + item.totalCost, 0);
    return {
      id: employee.id,
      name: employee.name,
      initials: employee.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
      servicesCount: entries.reduce((sum, item) => sum + item.services.length, 0),
      revenue,
      commission: Math.round(revenue * 0.2),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
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
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 text-foreground font-bold">
                <th className="py-2.5 px-2">Staff</th>
                <th className="py-2.5 px-2 text-center">Services</th>
                <th className="py-2.5 px-2 text-right">Revenue</th>
                <th className="py-2.5 px-2 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {staffPerformance.map((staff) => (
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
              {staffPerformance.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No staff records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
