import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockEmployees } from '@/data/mockData';

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

export function StaffProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Initialize with mock data
  useEffect(() => {
    setEmployees(mockEmployees);
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
  };

  const removeEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      id: Date.now().toString(),
      ...employee
    };
    setEmployees(prev => [...prev, newEmployee]);
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
