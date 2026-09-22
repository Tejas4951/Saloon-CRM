import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createId, getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

export interface Employee {
  id: string;
  name: string;
  role: string;
  photo: string;
  available: boolean;
  specialties?: string[];
  rating?: number;
  nextAvailable?: string;
  workingHours?: {
    start: string;
    end: string;
  };
}

interface StaffContextType {
  employees: Employee[];
  availableStaffCount: number;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

import { isSupabaseConfigured } from '@/lib/supabase';

const initialStaffMembers: Employee[] = [
  { id: '1', name: 'Priyanka Patil', role: 'Master Barber & Stylist', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop', available: true, rating: 4.9, specialties: ['Haircut', 'Styling'] },
  { id: '2', name: 'Rahul Sharma', role: 'Senior Stylist', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', available: true, rating: 4.8, specialties: ['Coloring', 'Beard Grooming'] },
  { id: '3', name: 'Sneha Kapur', role: 'Skin & Spa Specialist', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop', available: true, rating: 4.9, specialties: ['Facials', 'Head Massage'] }
];

export function StaffProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('saloniq_staff');
    return saved ? JSON.parse(saved) : initialStaffMembers;
  });
  
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { data, error } = await supabase.from('staff_members').select('*').eq('shop_id', shopId).order('created_at');
        if (error) throw error;
        if (!active) return;
        const fetched = (data || []).map((row: any) => ({
          id: row.id, name: row.name, role: row.role, photo: row.photo || '', available: row.available,
          specialties: row.specialties || [], rating: Number(row.rating || 0), nextAvailable: row.next_available || undefined,
          workingHours: { start: (row.working_start || '09:00').slice(0, 5), end: (row.working_end || '18:00').slice(0, 5) },
        }));
        setEmployees(fetched);
        localStorage.setItem('saloniq_staff', JSON.stringify(fetched));
      } catch (error) {
        reportPersistenceError('staff.load', error);
      }
    })();
    return () => { active = false; };
  }, []);
  
  const availableStaffCount = employees.filter(emp => emp.available).length;
  
  // Log when employees or available count changes
  useEffect(() => {
    console.log('Available staff count updated:', availableStaffCount, 'out of', employees.length);
  }, [availableStaffCount, employees.length]);

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      )
    );
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof Employee, string]> = [
      ['name', 'name'], ['role', 'role'], ['photo', 'photo'], ['available', 'available'], ['specialties', 'specialties'],
      ['rating', 'rating'], ['nextAvailable', 'next_available'],
    ];
    fields.forEach(([source, target]) => { if (updates[source] !== undefined) payload[target] = updates[source]; });
    if (updates.workingHours) {
      payload.working_start = updates.workingHours.start;
      payload.working_end = updates.workingHours.end;
    }
    void supabase.from('staff_members').update(payload).eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('staff.update', error);
    });
  };

  const removeEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    void supabase.from('staff_members').delete().eq('id', id).then(({ error }) => {
      if (error) reportPersistenceError('staff.delete', error);
    });
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      id: createId(),
      ...employee
    };
    setEmployees(prev => [...prev, newEmployee]);
    void (async () => {
      try {
        const shopId = await getActiveShopId();
        const { error } = await supabase.from('staff_members').insert({
          id: newEmployee.id, shop_id: shopId, name: newEmployee.name, role: newEmployee.role,
          photo: newEmployee.photo || null, available: newEmployee.available, specialties: newEmployee.specialties || [],
          rating: newEmployee.rating || 0, next_available: newEmployee.nextAvailable || null,
          working_start: newEmployee.workingHours?.start || '09:00', working_end: newEmployee.workingHours?.end || '18:00',
        });
        if (error) throw error;
      } catch (error) {
        reportPersistenceError('staff.add', error);
        setEmployees(prev => prev.filter(entry => entry.id !== newEmployee.id));
      }
    })();
    return newEmployee;
  };

  return (
    <StaffContext.Provider 
      value={{
        employees,
        availableStaffCount,
        updateEmployee,
        removeEmployee,
        addEmployee
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}
