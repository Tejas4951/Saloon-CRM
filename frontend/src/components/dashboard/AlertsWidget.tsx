import React from 'react';
import { Bell, Package, CreditCard, Calendar, XCircle, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications, NotificationItem } from '@/contexts/NotificationsContext';
import { useNavigate } from 'react-router-dom';

export const AlertsWidget: React.FC = () => {
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case 'staff':
        return <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const getBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock':
      case 'cancelled':
        return 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50';
      case 'payment':
        return 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50';
      case 'appointment':
        return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50';
      case 'staff':
        return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50';
    }
  };

  const displayList = notifications.slice(0, 4);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500" />
          <span>Alerts & Real-Time Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {displayList.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No active alerts at the moment.
          </div>
        ) : (
          displayList.map((alert) => (
            <div
              key={alert.id}
              onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${getBg(alert.type)} transition-colors hover:shadow-xs cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-900 shadow-xs mt-0.5`}>
                  {getIcon(alert.type)}
                </div>
                <div>
                  <h4 className="text-xs font-bold">{alert.title}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                {alert.time}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
