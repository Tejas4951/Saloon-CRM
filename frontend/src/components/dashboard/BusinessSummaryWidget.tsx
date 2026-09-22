import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from 'lucide-react';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { useTally } from '@/contexts/TallyContext';

export const BusinessSummaryWidget: React.FC = () => {
  const { appointments } = useAppointments();
  const { customers } = useCustomers();
  const { tallyItems } = useTally();
  const now = new Date();
  const isCurrentMonth = (value: string) => {
    const date = new Date(value);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };
  const monthlyAppointments = appointments.filter(item => isCurrentMonth(item.date));
  const monthlyPayments = tallyItems.filter(item => item.paymentStatus === 'completed' && isCurrentMonth(item.date));
  const monthlyRevenue = monthlyPayments.reduce((sum, item) => sum + item.totalCost, 0);
  const averageBill = monthlyPayments.length ? Math.round(monthlyRevenue / monthlyPayments.length) : 0;
  const summary = [
    { id: 'customers', label: 'Total Customers', value: customers.length.toLocaleString('en-IN') },
    { id: 'appointments', label: 'Appointments (This Month)', value: monthlyAppointments.length.toLocaleString('en-IN') },
    { id: 'revenue', label: 'Revenue (This Month)', value: `₹${monthlyRevenue.toLocaleString('en-IN')}` },
    { id: 'average', label: 'Average Bill Value', value: `₹${averageBill.toLocaleString('en-IN')}` },
  ];

  return (
    <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart className="h-4 w-4 text-indigo-500" />
          <span>Business Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          {summary.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b-2 border-slate-200 dark:border-slate-700 last:border-0 text-xs"
            >
              <span className="text-muted-foreground font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
