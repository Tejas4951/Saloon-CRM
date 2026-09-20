import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Package, 
  CreditCard, 
  Calendar, 
  XCircle, 
  Users, 
  Check, 
  CheckCheck, 
  Trash2, 
  ArrowRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications, NotificationItem } from '@/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

export const NotificationPopover: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts' | 'appointments'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="h-4 w-4 text-amber-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-rose-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      case 'staff':
        return <Users className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getBadgeStyle = (priority: NotificationItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'stock' || n.type === 'payment';
    if (filter === 'appointments') return n.type === 'appointment' || n.type === 'cancelled';
    return true;
  });

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-2xl border-border/70 rounded-xl overflow-hidden">
        {/* Popover Header */}
        <div className="bg-muted/40 p-3 px-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm text-foreground">Admin Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-2 bg-muted/20 border-b border-border/40 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={cn("px-2.5 py-1 rounded-md font-semibold transition-colors", filter === 'all' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn("px-2.5 py-1 rounded-md font-semibold transition-colors", filter === 'unread' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('alerts')}
            className={cn("px-2.5 py-1 rounded-md font-semibold transition-colors", filter === 'alerts' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            Alerts
          </button>
          <button
            onClick={() => setFilter('appointments')}
            className={cn("px-2.5 py-1 rounded-md font-semibold transition-colors", filter === 'appointments' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            Bookings
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-border/30">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-semibold">No notifications in this view</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">All salon modules are operating cleanly.</p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  "p-3 flex items-start gap-3 hover:bg-muted/40 transition-colors cursor-pointer group relative",
                  !item.read && "bg-amber-500/5 dark:bg-amber-500/10 font-medium"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-card border border-border/60 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className={cn("text-xs truncate", !item.read ? "font-bold text-foreground" : "font-semibold text-foreground/90")}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{item.message}</p>
                </div>

                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 text-muted-foreground hover:text-rose-500 transition-opacity"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/40 p-2.5 border-t border-border/50 text-center">
          <button 
            onClick={() => {
              setIsOpen(false);
              navigate('/index');
            }}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 w-full cursor-pointer"
          >
            <span>View All Dashboard Alerts</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
