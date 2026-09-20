import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAppointments } from './AppointmentsContext';
import { useTally } from './TallyContext';
import { useCustomers } from './CustomersContext';
import { useInventory } from './InventoryContext';
import { useStaff } from './StaffContext';

export interface NotificationItem {
  id: string;
  type: 'stock' | 'payment' | 'appointment' | 'cancelled' | 'staff';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl: string;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { appointments } = useAppointments();
  const { tallyItems } = useTally();
  const { customers } = useCustomers();
  const { items: inventoryItems } = useInventory();
  const { employees } = useStaff();

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('salon_read_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [clearedIds, setClearedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('salon_cleared_notifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('salon_read_notifications', JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem('salon_cleared_notifications', JSON.stringify(Array.from(clearedIds)));
  }, [clearedIds]);

  // Dynamically compile real-time notifications from all app modules
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Low Stock Inventory Notifications
    inventoryItems.forEach(item => {
      if (item.stock <= item.minThreshold) {
        list.push({
          id: `stock-${item.id}`,
          type: 'stock',
          title: 'Low Inventory Warning',
          message: `"${item.name}" stock is critical (${item.stock} left, min threshold: ${item.minThreshold}).`,
          time: 'Just now',
          read: readIds.has(`stock-${item.id}`),
          actionUrl: '/inventory',
          priority: item.stock === 0 ? 'high' : 'medium'
        });
      }
    });

    // 2. Pending Payment Notifications (Tally & Customers)
    tallyItems.forEach(tx => {
      if (tx.paymentStatus === 'pending') {
        list.push({
          id: `payment-tally-${tx.id}`,
          type: 'payment',
          title: 'Pending Payment Due',
          message: `${tx.customerName} has pending payment of ₹${tx.totalCost.toLocaleString('en-IN')} for ${tx.services.map(s => s.name).join(', ')}.`,
          time: tx.time || 'Today',
          read: readIds.has(`payment-tally-${tx.id}`),
          actionUrl: '/tally',
          priority: 'high'
        });
      }
    });

    customers.forEach(cust => {
      if (cust.pendingAmount && cust.pendingAmount > 0) {
        list.push({
          id: `payment-cust-${cust.id}`,
          type: 'payment',
          title: 'Customer Pending Balance',
          message: `${cust.name} has total overdue balance of ₹${cust.pendingAmount.toLocaleString('en-IN')}.`,
          time: 'Recent',
          read: readIds.has(`payment-cust-${cust.id}`),
          actionUrl: '/customers',
          priority: 'high'
        });
      }
    });

    // 3. Appointment Notifications (Scheduled & Cancelled)
    appointments.forEach(apt => {
      if (apt.status === 'cancelled') {
        list.push({
          id: `apt-cancelled-${apt.id}`,
          type: 'cancelled',
          title: 'Appointment Cancelled',
          message: `Appointment for ${apt.time} was marked as cancelled.`,
          time: apt.date || 'Today',
          read: readIds.has(`apt-cancelled-${apt.id}`),
          actionUrl: '/booking',
          priority: 'medium'
        });
      } else if (apt.status === 'scheduled') {
        list.push({
          id: `apt-scheduled-${apt.id}`,
          type: 'appointment',
          title: 'Upcoming Appointment',
          message: `Scheduled booking at ${apt.time} (${apt.notes || 'Salon service'}).`,
          time: apt.time || 'Today',
          read: readIds.has(`apt-scheduled-${apt.id}`),
          actionUrl: '/booking',
          priority: 'low'
        });
      }
    });

    // 4. Staff Notifications
    const availableStaffCount = employees.filter(e => e.available).length;
    if (availableStaffCount < employees.length) {
      list.push({
        id: 'staff-status-alert',
        type: 'staff',
        title: 'Staff Duty Alert',
        message: `${availableStaffCount} out of ${employees.length} staff members are currently available.`,
        time: 'Active',
        read: readIds.has('staff-status-alert'),
        actionUrl: '/schedule',
        priority: 'low'
      });
    }

    // Filter out cleared notifications
    return list.filter(item => !clearedIds.has(item.id));
  }, [inventoryItems, tallyItems, customers, appointments, employees, readIds, clearedIds]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAsRead = (id: string) => {
    setReadIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const clearNotification = (id: string) => {
    setClearedIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
