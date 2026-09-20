import { createContext, useContext, useState, ReactNode } from 'react';
import { useEffect } from 'react';
import { mockAppointments } from '@/data/mockData';

export interface Appointment {
  id: string;
  customerId: string;
  employeeId: string;
  serviceIds: string[];
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  total: number;
  notes: string;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Initialize with mock data
  useEffect(() => {
    setAppointments(mockAppointments);
  }, []);

  const addAppointment = (newAppointment: Appointment) => {
    setAppointments(prev => [...prev, newAppointment]);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appt => 
        appt.id === id ? { ...appt, ...updates } : appt
      )
    );
  };

  return (
    <AppointmentsContext.Provider 
      value={{ 
        appointments, 
        selectedCustomerId,
        setSelectedCustomerId,
        addAppointment, 
        updateAppointment 
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}
