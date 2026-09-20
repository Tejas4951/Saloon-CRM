import React from 'react';
import { CalendarPlus, FileText, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  onNewAppointment?: () => void;
  onAddCustomer?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNewAppointment,
  onAddCustomer,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'new-appointment',
      title: 'New Appointment',
      icon: CalendarPlus,
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
      onClick: () => {
        if (onNewAppointment) onNewAppointment();
        else navigate('/booking');
      },
    },
    {
      id: 'new-bill',
      title: 'New Bill',
      icon: FileText,
      bgClass: 'bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
      onClick: () => navigate('/tally'),
    },
    {
      id: 'add-customer',
      title: 'Add Customer',
      icon: UserPlus,
      bgClass: 'bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
      onClick: () => {
        if (onAddCustomer) onAddCustomer();
        else navigate('/customers');
      },
    },
    {
      id: 'walk-in',
      title: 'Walk-In',
      icon: Users,
      bgClass: 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
      onClick: () => navigate('/booking'),
    },
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-amber-500">⚡</span> Quick Actions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${action.bgClass} shadow-xs hover:shadow-sm cursor-pointer group`}
              >
                <div className={`p-2.5 rounded-xl ${action.iconBg} mb-2 transition-transform group-hover:scale-110`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-center">{action.title}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
