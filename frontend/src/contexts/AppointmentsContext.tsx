import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createId, getActiveShopId, isUuid, reportPersistenceError, toDatabaseTime, toDisplayTime } from '@/services/salonDataService';

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

  useEffect(() => {
    let active = true;
    const loadAppointments = async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase
          .from('appointments')
          .select('id, customer_id, staff_member_id, employee_id, employee_name, service_ids, appointment_date, appointment_time, status, total, notes')
          .eq('shop_id', shopId)
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: true });
        if (error) throw error;
        if (!active) return;
        setAppointments((data || []).map((row: any) => ({
          id: row.id,
          customerId: row.customer_id || '',
          employeeId: row.staff_member_id || row.employee_id || row.employee_name || '',
          serviceIds: (row.service_ids || []).map(String),
          date: row.appointment_date,
          time: toDisplayTime(row.appointment_time),
          status: row.status === 'in_progress' ? 'scheduled' : row.status,
          total: Number(row.total || 0),
          notes: row.notes || '',
        })));
      } catch (error) {
        reportPersistenceError('appointments.load', error);
        if (active) setAppointments([]);
      }
    };
    void loadAppointments();
    return () => { active = false; };
  }, []);

  const addAppointment = (newAppointment: Appointment) => {
    const appointment = { ...newAppointment, id: isUuid(newAppointment.id) ? newAppointment.id : createId() };
    setAppointments(prev => [...prev, appointment]);
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const [{ data: customer }, { data: dbServices }, { data: staffMember }] = await Promise.all([
          isUuid(appointment.customerId)
            ? supabase.from('customers').select('name, phone').eq('id', appointment.customerId).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from('services').select('id, service_name').in('id', appointment.serviceIds.map(Number).filter(Number.isFinite)),
          isUuid(appointment.employeeId)
            ? supabase.from('staff_members').select('name').eq('id', appointment.employeeId).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        const serviceNames = appointment.serviceIds.map(id =>
          dbServices?.find((item: any) => String(item.id) === id)?.service_name || id
        );
        const { error } = await supabase.from('appointments').insert({
          id: appointment.id,
          shop_id: shopId,
          customer_id: isUuid(appointment.customerId) ? appointment.customerId : null,
          customer_name: customer?.name || 'Walk-in Customer',
          customer_phone: customer?.phone || null,
          staff_member_id: isUuid(appointment.employeeId) ? appointment.employeeId : null,
          employee_id: null,
          employee_name: staffMember?.name || appointment.employeeId || null,
          service_ids: appointment.serviceIds.map(Number).filter(Number.isFinite),
          service_names: serviceNames,
          appointment_date: appointment.date,
          appointment_time: toDatabaseTime(appointment.time),
          status: appointment.status,
          total: appointment.total,
          notes: appointment.notes,
        });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('appointments.add', error);
        setAppointments(prev => prev.filter(item => item.id !== appointment.id));
      }
    })();
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(appt => 
        appt.id === id ? { ...appt, ...updates } : appt
      )
    );
    const dbUpdates: Record<string, unknown> = {};
    if (updates.customerId !== undefined) dbUpdates.customer_id = isUuid(updates.customerId) ? updates.customerId : null;
    if (updates.employeeId !== undefined) dbUpdates.staff_member_id = isUuid(updates.employeeId) ? updates.employeeId : null;
    if (updates.serviceIds !== undefined) dbUpdates.service_ids = updates.serviceIds.map(Number).filter(Number.isFinite);
    if (updates.date !== undefined) dbUpdates.appointment_date = updates.date;
    if (updates.time !== undefined) dbUpdates.appointment_time = toDatabaseTime(updates.time);
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    dbUpdates.updated_at = new Date().toISOString();
    void supabase.from('appointments').update(dbUpdates).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('appointments.update', error);
    });
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
