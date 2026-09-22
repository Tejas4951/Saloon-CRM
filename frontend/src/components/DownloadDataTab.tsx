import React, { useState, useMemo } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  DollarSign, 
  Users, 
  Scissors, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Check, 
  X,
  Calculator,
  Zap,
  Building2,
  Boxes,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  UserCheck
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useTally } from '@/contexts/TallyContext';
import { useStaff } from '@/contexts/StaffContext';
import { useServices } from '@/contexts/ServicesContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useStore } from '@/contexts/StoreContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function DownloadDataTab() {
  // Report Mode: 'daily' | 'monthly'
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');

  // Daily Mode State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Monthly Mode State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  // Context Hooks
  const { appointments } = useAppointments();
  const { tallyItems } = useTally();
  const { employees } = useStaff();
  const { services } = useServices();
  const { customers } = useCustomers();
  const { items: inventoryItems } = useInventory();
  const { orders: storeOrders } = useStore();

  // Time slots for daily schedule
  const timeSlots = [
    { display: "9-10 AM", start: "9:00 AM" },
    { display: "10-11 AM", start: "10:00 AM" },
    { display: "11-12 PM", start: "11:00 AM" },
    { display: "12-1 PM", start: "12:00 PM" },
    { display: "1-2 PM", start: "1:00 PM" },
    { display: "2-3 PM", start: "2:00 PM" },
    { display: "3-4 PM", start: "3:00 PM" },
    { display: "4-5 PM", start: "4:00 PM" },
    { display: "5-6 PM", start: "5:00 PM" },
    { display: "6-7 PM", start: "6:00 PM" },
    { display: "7-8 PM", start: "7:00 PM" },
    { display: "8-9 PM", start: "8:00 PM" },
    { display: "9-10 PM", start: "9:00 PM" },
    { display: "10-11 PM", start: "10:00 PM" },
    { display: "11-12 AM", start: "11:00 PM" }
  ];

  const formatTime = (time: string) => {
    if (time.includes('AM') || time.includes('PM')) return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getAppointmentForSlot = (staffId: string, timeSlot: string) => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const formattedTimeSlot = formatTime(timeSlot);
    return appointments.find(apt => {
      if (apt.employeeId !== staffId || apt.date !== dateStr) return false;
      return formatTime(apt.time) === formattedTimeSlot;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'no-show': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper to load expenses from localStorage with fallbacks
  const loadExpensesData = () => {
    const salariesRaw = localStorage.getItem('saloniq_expenses_salaries');
    const salaries: Record<string, number> = salariesRaw 
      ? JSON.parse(salariesRaw) 
      : { '1': 35000, '2': 28000, '3': 26000 };

    const electricity = Number(localStorage.getItem('saloniq_expenses_electricity')) || 8500;
    const shopRent = Number(localStorage.getItem('saloniq_expenses_shop_rent')) || 45000;

    const materialQtyRaw = localStorage.getItem('saloniq_expenses_material_qty');
    const materialQty: Record<string, number> = materialQtyRaw ? JSON.parse(materialQtyRaw) : {};

    const miscRaw = localStorage.getItem('saloniq_expenses_misc');
    const miscExpenses: Array<{ id: string; title: string; category: string; amount: number; date: string; notes?: string }> = miscRaw
      ? JSON.parse(miscRaw)
      : [
          { id: 'm-1', title: 'High-speed Fiber Internet & WiFi', category: 'Utilities', amount: 1499, date: `${selectedYear}-${selectedMonth}-05`, notes: 'Monthly Broadband Bill' },
          { id: 'm-2', title: 'Beverages & Client Refreshments', category: 'Hospitality', amount: 2450, date: `${selectedYear}-${selectedMonth}-10`, notes: 'Coffee beans, green tea bags, packaged water' },
          { id: 'm-3', title: 'Sanitization & Deep Cleaning Service', category: 'Maintenance', amount: 1800, date: `${selectedYear}-${selectedMonth}-15`, notes: 'Professional salon disinfectant spray & towels' }
        ];

    return { salaries, electricity, shopRent, materialQty, miscExpenses };
  };

  // Main Aggregated Data Calculation (Daily or Monthly)
  const filteredData = useMemo(() => {
    const periodKey = reportMode === 'daily'
      ? (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '')
      : `${selectedYear}-${selectedMonth}`;

    const periodLabel = reportMode === 'daily'
      ? (selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'No Date')
      : `${new Date(Number(selectedYear), Number(selectedMonth) - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`;

    // Filter appointments
    const filteredAppointments = appointments.filter(appt => {
      if (!appt.date) return false;
      const apptDate = appt.date.split('T')[0];
      return reportMode === 'daily' ? apptDate === periodKey : apptDate.startsWith(periodKey);
    });

    // Filter tally transactions
    const filteredTransactions = tallyItems.filter(item => {
      if (!item.date) return false;
      const itemDate = item.date.split('T')[0];
      return reportMode === 'daily' ? itemDate === periodKey : itemDate.startsWith(periodKey);
    });

    // Filter store product orders
    const filteredStoreOrders = storeOrders.filter(order => {
      if (!order.orderDate) return false;
      const orderDate = order.orderDate.split('T')[0];
      return reportMode === 'daily' ? orderDate === periodKey : orderDate.startsWith(periodKey);
    });

    const workingStaff = employees.filter(emp => emp.available);

    // Booked services
    const bookedServices = filteredAppointments.flatMap(appt => 
      appt.serviceIds.map(id => ({
        id,
        name: services.find(s => s.id === id)?.name || 'Unknown Service',
        price: services.find(s => s.id === id)?.price || 0,
        duration: services.find(s => s.id === id)?.duration || 0
      }))
    );

    // Revenue calculations
    const completedTransactions = filteredTransactions.filter(tx => tx.paymentStatus === 'completed');
    const tallyRevenue = completedTransactions.reduce((sum, tx) => sum + tx.totalCost, 0);

    const completedStoreOrders = filteredStoreOrders.filter(o => o.orderStatus !== 'cancelled');
    const storeRevenue = completedStoreOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const appointmentRevenue = filteredAppointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.total || 0), 0);

    // Total gross revenue (using tally completed + store completed, fallback to appointment revenue if tally is 0)
    const totalRevenue = Math.max(tallyRevenue + storeRevenue, appointmentRevenue + storeRevenue);

    const completedAppointments = filteredAppointments.filter(appt => appt.status === 'completed').length;
    const cancelledAppointments = filteredAppointments.filter(appt => appt.status === 'cancelled').length;

    // --- EXPENSES CALCULATIONS ---
    const { salaries, electricity, shopRent, materialQty, miscExpenses } = loadExpensesData();

    // Staff Salaries Expense
    const monthlySalariesTotal = employees.reduce((sum, emp) => {
      const sal = salaries[emp.id] !== undefined ? salaries[emp.id] : 25000;
      return sum + sal;
    }, 0);

    // Material Cost Expense
    const monthlyMaterialCostTotal = inventoryItems.reduce((sum, item) => {
      const qty = materialQty[item.id] !== undefined ? materialQty[item.id] : (item.stock || 1);
      return sum + ((item.price || 0) * qty);
    }, 0);

    // Miscellaneous Cost Expense
    const relevantMiscExpenses = miscExpenses.filter(item => {
      if (!item.date) return true;
      return reportMode === 'daily' ? item.date === periodKey : item.date.startsWith(periodKey);
    });
    const miscCostTotal = relevantMiscExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Days ratio for Daily Proration
    const numDaysInMonth = selectedDate ? getDaysInMonth(selectedDate) : 30;

    const expSalaries = reportMode === 'daily' ? (monthlySalariesTotal / numDaysInMonth) : monthlySalariesTotal;
    const expElectricity = reportMode === 'daily' ? (electricity / numDaysInMonth) : electricity;
    const expShopRent = reportMode === 'daily' ? (shopRent / numDaysInMonth) : shopRent;
    const expMaterial = reportMode === 'daily' ? (monthlyMaterialCostTotal / numDaysInMonth) : monthlyMaterialCostTotal;
    const expMisc = reportMode === 'daily' ? (miscCostTotal > 0 ? miscCostTotal : (miscExpenses.reduce((s,i)=>s+i.amount,0)/numDaysInMonth)) : miscCostTotal;

    const totalExpenses = expSalaries + expElectricity + expShopRent + expMaterial + expMisc;
    const netRevenue = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(1) : '0';

    // Analytics Breakdown
    const serviceRevenue: Record<string, number> = {};
    const paymentMethods: Record<string, number> = {};
    const staffPerformance: Record<string, { count: number; revenue: number }> = {};

    completedTransactions.forEach(tx => {
      tx.services.forEach(service => {
        serviceRevenue[service.name] = (serviceRevenue[service.name] || 0) + service.price;
      });
      paymentMethods[tx.paymentMethod] = (paymentMethods[tx.paymentMethod] || 0) + 1;

      if (!staffPerformance[tx.staffName]) {
        staffPerformance[tx.staffName] = { count: 0, revenue: 0 };
      }
      staffPerformance[tx.staffName].count += 1;
      staffPerformance[tx.staffName].revenue += tx.totalCost;
    });

    const tallyRecords = filteredTransactions.map(tx => ({
      id: tx.id,
      time: tx.time,
      customerName: tx.customerName,
      staffName: tx.staffName,
      services: tx.services.map(s => s.name).join(', '),
      amount: tx.totalCost,
      paymentMethod: tx.paymentMethod,
      status: tx.paymentStatus
    }));

    // Daily Schedule Slots
    interface AppointmentSlot {
      time: string;
      appointments: Array<{
        time: string;
        customer: string;
        services: string;
        staff: string;
        status: string;
      }>;
      availableStaff: number;
    }

    const timeSlotsArr: AppointmentSlot[] = [];
    const startHour = 9;
    const endHour = 21;
    const targetDate = reportMode === 'daily' ? periodKey : `${selectedYear}-${selectedMonth}-01`;

    const rangeAppointments = appointments
      .filter(appt => appt.date && (reportMode === 'daily' ? appt.date === periodKey : appt.date.startsWith(periodKey)))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const formatTimeRange = (hour: number) => {
      const startHour12 = hour % 12 || 12;
      const endHour12 = (hour + 1) % 12 || 12;
      const period = hour < 12 ? 'AM' : 'PM';
      const nextPeriod = (hour + 1) < 12 ? 'AM' : 'PM';
      return `${startHour12} ${period} - ${endHour12} ${nextPeriod}`;
    };

    const appointmentsByHour: Record<string, { timeRange: string, appointments: typeof rangeAppointments }> = {};
    for (let hour = startHour; hour < endHour; hour++) {
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      appointmentsByHour[timeKey] = {
        timeRange: formatTimeRange(hour),
        appointments: []
      };
    }

    rangeAppointments.forEach(appt => {
      if (!appt.time) return;
      const hour = appt.time.split(':')[0];
      const timeKey = `${hour.padStart(2, '0')}:00`;
      if (appointmentsByHour[timeKey] !== undefined) {
        appointmentsByHour[timeKey].appointments.push(appt);
      }
    });

    Object.entries(appointmentsByHour).forEach(([timeKey, { timeRange, appointments: slotApps }]) => {
      const slotAppointments = slotApps.map(appt => {
        const customer = customers.find(c => c.id === appt.customerId);
        const customerName = customer?.name || `Customer ${appt.customerId?.substring(0, 4) || 'N/A'}`;
        const appointmentTime = appt.time ? formatTime(appt.time) : '10:00 AM';
        const serviceNames = appt.serviceIds.map(id => services.find(s => s.id === id)?.name || 'Unknown Service').join(', ');
        const staff = employees.find(e => e.id === appt.employeeId);
        const staffName = staff?.name || 'Unassigned';

        return {
          time: appointmentTime,
          customer: customerName,
          services: serviceNames,
          staff: staffName,
          status: appt.status || 'scheduled'
        };
      });

      timeSlotsArr.push({
        time: timeRange,
        appointments: slotAppointments,
        availableStaff: workingStaff.length - slotAppointments.length
      });
    });

    return {
      periodKey,
      periodLabel,
      appointments: filteredAppointments,
      transactions: filteredTransactions,
      storeOrders: filteredStoreOrders,
      staff: workingStaff,
      services: [...new Map(bookedServices.map(item => [item.id, item])).values()],
      expensesBreakdown: {
        salaries: expSalaries,
        electricity: expElectricity,
        shopRent: expShopRent,
        materialCost: expMaterial,
        miscCost: expMisc,
        totalExpenses,
        netRevenue,
        profitMargin,
        miscList: relevantMiscExpenses
      },
      stats: {
        totalAppointments: filteredAppointments.length,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        tallyRevenue,
        storeRevenue,
        totalTransactions: filteredTransactions.length + filteredStoreOrders.length,
        staffCount: workingStaff.length,
        uniqueServices: [...new Set(bookedServices.map(s => s.id))].length,
        averageTransactionValue: completedTransactions.length > 0 ? (totalRevenue / completedTransactions.length) : 0,
        conversionRate: filteredAppointments.length > 0 ? ((completedAppointments / filteredAppointments.length) * 100) : 0
      },
      analytics: {
        serviceRevenue: Object.entries(serviceRevenue)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue),
        paymentMethods: Object.entries(paymentMethods)
          .map(([method, count]) => ({ method, count }))
          .sort((a, b) => b.count - a.count),
        staffPerformance: Object.entries(staffPerformance)
          .map(([name, { count, revenue }]) => ({
            name,
            appointments: count,
            revenue,
            averageRevenue: revenue / count
          }))
          .sort((a, b) => b.revenue - a.revenue)
      },
      tallyRecords,
      dailySchedule: timeSlotsArr
    };
  }, [reportMode, selectedDate, selectedMonth, selectedYear, appointments, tallyItems, storeOrders, employees, inventoryItems]);

  // Export to CSV Function
  const exportAllToCSV = () => {
    try {
      const { periodLabel, stats, expensesBreakdown, analytics, tallyRecords, dailySchedule, storeOrders: ordersList } = filteredData;
      const csvLines: string[] = [];

      // Header
      csvLines.push(`"SALONIQ - ${reportMode === 'monthly' ? 'MONTHLY' : 'DAILY'} SALON REPORT"`);
      csvLines.push(`"Report Period","${periodLabel}"`);
      csvLines.push(`"Report Mode","${reportMode.toUpperCase()}"`);
      csvLines.push(`"Generated At","${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}"`);
      csvLines.push('');

      // Executive Summary
      csvLines.push(`"--- 1. EXECUTIVE FINANCIAL SUMMARY ---"`);
      csvLines.push(`"Metric","Value (INR)"`);
      csvLines.push(`"Total Monthly/Daily Revenue","INR ${stats.totalRevenue.toFixed(2)}"`);
      csvLines.push(`"  - Appointment & Tally Revenue","INR ${stats.tallyRevenue.toFixed(2)}"`);
      csvLines.push(`"  - Store Sales Revenue","INR ${stats.storeRevenue.toFixed(2)}"`);
      csvLines.push(`"Total Operational Expenses","INR ${expensesBreakdown.totalExpenses.toFixed(2)}"`);
      csvLines.push(`"Net Revenue (Profit/Loss)","INR ${expensesBreakdown.netRevenue.toFixed(2)}"`);
      csvLines.push(`"Profit Margin (%)","${expensesBreakdown.profitMargin}%"`);
      csvLines.push(`"Completed Appointments","${stats.completedAppointments}"`);
      csvLines.push(`"Total Transactions","${stats.totalTransactions}"`);
      csvLines.push(`"Conversion Rate","${stats.conversionRate.toFixed(1)}%"`);
      csvLines.push(`"Average Transaction Value","INR ${stats.averageTransactionValue.toFixed(2)}"`);
      csvLines.push('');

      // Expenses Breakdown Section
      csvLines.push(`"--- 2. EXPENSES BREAKDOWN ---"`);
      csvLines.push(`"Expense Category","Amount (INR)","Description"`);
      csvLines.push(`"Staff Monthly Salaries","${expensesBreakdown.salaries.toFixed(2)}","Fixed payouts for ${employees.length} staff members"`);
      csvLines.push(`"Electricity Utility Bill","${expensesBreakdown.electricity.toFixed(2)}","Electricity utility charges"`);
      csvLines.push(`"Shop Premises Rent","${expensesBreakdown.shopRent.toFixed(2)}","Monthly commercial shop rent"`);
      csvLines.push(`"Material & Inventory Cost","${expensesBreakdown.materialCost.toFixed(2)}","Autofetched inventory restock costs"`);
      csvLines.push(`"Miscellaneous & Custom Expenses","${expensesBreakdown.miscCost.toFixed(2)}","Custom operational costs"`);
      csvLines.push(`"GRAND TOTAL EXPENSES","${expensesBreakdown.totalExpenses.toFixed(2)}","Total expenses for period"`);
      csvLines.push('');

      // Itemized Miscellaneous Expenses
      csvLines.push(`"--- 3. ITEMIZED MISCELLANEOUS EXPENSES ---"`);
      csvLines.push(`"Expense Title","Category","Date","Cost (INR)"`);
      if (expensesBreakdown.miscList.length > 0) {
        expensesBreakdown.miscList.forEach(m => {
          csvLines.push(`"${m.title}","${m.category}","${m.date}","${m.amount.toFixed(2)}"`);
        });
      } else {
        csvLines.push(`"No custom expenses logged for this period","","",""`);
      }
      csvLines.push('');

      // Schedule & Appointments
      csvLines.push(`"--- 4. SCHEDULE & APPOINTMENTS ---"`);
      csvLines.push(`"Time Slot","Customer","Services","Staff","Status"`);
      let hasSchedule = false;
      dailySchedule.forEach(slot => {
        slot.appointments.forEach(apt => {
          hasSchedule = true;
          csvLines.push(`"${slot.time}","${apt.customer}","${(apt.services || '').replace(/"/g, '""')}","${apt.staff}","${apt.status}"`);
        });
      });
      if (!hasSchedule) csvLines.push(`"No scheduled appointments for this period","","","",""`);
      csvLines.push('');

      // Tally Billing Records
      csvLines.push(`"--- 5. TALLY & BILLING RECORDS ---"`);
      csvLines.push(`"Time","Customer Name","Staff Name","Services","Amount (INR)","Payment Method","Status"`);
      if (tallyRecords.length > 0) {
        tallyRecords.forEach(rec => {
          csvLines.push(`"${rec.time}","${rec.customerName}","${rec.staffName || ''}","${(rec.services || '').replace(/"/g, '""')}","${rec.amount}","${rec.paymentMethod}","${rec.status}"`);
        });
      } else {
        csvLines.push(`"No billing records for this period","","","","","",""`);
      }
      csvLines.push('');

      // Store Product Orders
      csvLines.push(`"--- 6. ONLINE STORE ORDERS ---"`);
      csvLines.push(`"Order #","Customer","Date","Items Count","Total Amount (INR)","Payment","Status"`);
      if (ordersList.length > 0) {
        ordersList.forEach(ord => {
          csvLines.push(`"${ord.orderNumber}","${ord.customerName}","${ord.orderDate}","${ord.items.length}","${ord.totalAmount}","${ord.paymentMethod}","${ord.orderStatus}"`);
        });
      } else {
        csvLines.push(`"No store orders for this period","","","","","",""`);
      }
      csvLines.push('');

      // Service Revenue
      csvLines.push(`"--- 7. SERVICE REVENUE BREAKDOWN ---"`);
      csvLines.push(`"Service Name","Revenue (INR)","Percentage Share"`);
      if (analytics.serviceRevenue.length > 0) {
        const totalRev = stats.totalRevenue || 1;
        analytics.serviceRevenue.forEach(svc => {
          const share = ((svc.revenue / totalRev) * 100).toFixed(1);
          csvLines.push(`"${svc.name}","${svc.revenue.toFixed(2)}","${share}%"`);
        });
      } else {
        csvLines.push(`"No service revenue for this period","",""`);
      }
      csvLines.push('');

      // Staff Performance
      csvLines.push(`"--- 8. STAFF PERFORMANCE ---"`);
      csvLines.push(`"Staff Name","Appointments","Total Revenue (INR)","Average Revenue per Appt (INR)"`);
      if (analytics.staffPerformance.length > 0) {
        analytics.staffPerformance.forEach(st => {
          csvLines.push(`"${st.name}","${st.appointments}","${st.revenue.toFixed(2)}","${st.averageRevenue.toFixed(2)}"`);
        });
      } else {
        csvLines.push(`"No staff performance data for this period","","",""`);
      }

      // Download CSV File
      const csvContent = csvLines.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `saloniq-${reportMode}-report-${filteredData.periodKey}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`CSV report downloaded: ${fileName}`);
    } catch (err) {
      console.error('CSV Generation error:', err);
      toast.error('Failed to generate CSV report. Please try again.');
    }
  };

  // Export to PDF Function
  const generatePDF = () => {
    try {
      const { periodLabel, stats, expensesBreakdown, analytics, tallyRecords, dailySchedule, storeOrders: ordersList } = filteredData;
      const doc = new jsPDF();
      let yPos = 20;

      // Header Title
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text('SALONIQ - Salon Management Report', 105, 25, { align: 'center' });

      doc.setFontSize(13);
      doc.setTextColor(217, 119, 6);
      doc.text(`Report Period: ${periodLabel} (${reportMode.toUpperCase()} REPORT)`, 105, 34, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 105, 41, { align: 'center' });

      yPos = 50;

      // Section 1: Executive Financial Summary (Revenue vs Expenses vs Net Revenue)
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('1. Executive Financial Summary', 14, yPos);
      yPos += 5;

      const summaryRows = [
        ['Total Revenue (Appointments + Store Sales)', `INR ${stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Total Operational Expenses', `INR ${expensesBreakdown.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
        ['Net Revenue (Profit / Loss)', `INR ${expensesBreakdown.netRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${expensesBreakdown.profitMargin}% margin)`],
        ['Completed Appointments', `${stats.completedAppointments}`],
        ['Total Billing & Store Transactions', `${stats.totalTransactions}`],
        ['Appointment Conversion Rate', `${stats.conversionRate.toFixed(1)}%`],
        ['Average Transaction Value', `INR ${stats.averageTransactionValue.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Financial & Operational Metric', 'Value']],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 110 },
          1: { cellWidth: 65 }
        }
      });

      yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : yPos + 40;

      // Section 2: Expenses Breakdown Table
      if (yPos > 230) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Operational Expenses Breakdown', 14, yPos);
      yPos += 5;

      const expensesRows = [
        ['Staff Monthly Salaries', `INR ${expensesBreakdown.salaries.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${expensesBreakdown.totalExpenses > 0 ? ((expensesBreakdown.salaries / expensesBreakdown.totalExpenses) * 100).toFixed(1) : 0}%`],
        ['Electricity Utility Bill', `INR ${expensesBreakdown.electricity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${expensesBreakdown.totalExpenses > 0 ? ((expensesBreakdown.electricity / expensesBreakdown.totalExpenses) * 100).toFixed(1) : 0}%`],
        ['Commercial Premises Shop Rent', `INR ${expensesBreakdown.shopRent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${expensesBreakdown.totalExpenses > 0 ? ((expensesBreakdown.shopRent / expensesBreakdown.totalExpenses) * 100).toFixed(1) : 0}%`],
        ['Material & Inventory Purchases', `INR ${expensesBreakdown.materialCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${expensesBreakdown.totalExpenses > 0 ? ((expensesBreakdown.materialCost / expensesBreakdown.totalExpenses) * 100).toFixed(1) : 0}%`],
        ['Miscellaneous & Custom Costs', `INR ${expensesBreakdown.miscCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, `${expensesBreakdown.totalExpenses > 0 ? ((expensesBreakdown.miscCost / expensesBreakdown.totalExpenses) * 100).toFixed(1) : 0}%`],
        ['TOTAL OPERATIONAL EXPENSES', `INR ${expensesBreakdown.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, '100%']
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Expense Category', 'Cost Amount', 'Expense Share']],
        body: expensesRows,
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
        styles: { fontSize: 8.5, cellPadding: 3.5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 95 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 }
        }
      });

      yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : yPos + 35;

      // Section 3: Schedule & Appointments
      if (yPos > 230) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Schedule & Appointments', 14, yPos);
      yPos += 5;

      const scheduleRows: Array<[string, string, string, string, string]> = [];
      dailySchedule.forEach(slot => {
        slot.appointments.forEach(apt => {
          scheduleRows.push([
            slot.time,
            apt.customer,
            apt.services,
            apt.staff,
            apt.status.toUpperCase()
          ]);
        });
      });

      if (scheduleRows.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Time Slot', 'Customer', 'Services', 'Staff', 'Status']],
          body: scheduleRows,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 55 },
            3: { cellWidth: 35 },
            4: { cellWidth: 20 }
          }
        });
        yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : yPos + 30;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('No scheduled appointments for this period.', 14, yPos + 4);
        yPos += 12;
      }

      // Section 4: Tally Billing Records
      if (yPos > 230) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Tally & Billing Records', 14, yPos);
      yPos += 5;

      if (tallyRecords.length > 0) {
        const tallyData = tallyRecords.map(tx => [
          tx.time || '',
          tx.customerName || 'Walk-in Customer',
          tx.staffName || 'N/A',
          tx.services || '',
          `INR ${tx.amount || 0}`,
          tx.paymentMethod || 'Cash',
          (tx.status || 'completed').toUpperCase()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Time', 'Customer', 'Staff', 'Services', 'Amount', 'Method', 'Status']],
          body: tallyData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 45 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 }
          }
        });
        yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : yPos + 30;
      } else {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('No tally/billing records for this period.', 14, yPos + 4);
        yPos += 12;
      }

      // Section 5: Staff Performance
      if (yPos > 230) { doc.addPage(); yPos = 20; }
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('5. Staff Performance Summary', 14, yPos);
      yPos += 5;

      if (analytics.staffPerformance.length > 0) {
        const staffData = analytics.staffPerformance.map(staff => [
          staff.name,
          `${staff.appointments}`,
          `INR ${staff.revenue.toFixed(2)}`,
          `INR ${staff.averageRevenue.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Staff Name', 'Appointments', 'Total Revenue', 'Avg per Appt']],
          body: staffData,
          theme: 'grid',
          headStyles: { fillColor: [236, 72, 153], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 3 }
        });
      } else {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('No staff performance data for this period.', 14, yPos + 4);
      }

      // Footer Page Numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${totalPages}  |  SALONIQ ${reportMode.toUpperCase()} Report  |  ${periodLabel}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      const fileName = `saloniq-${reportMode}-report-${filteredData.periodKey}.pdf`;
      doc.save(fileName);
      toast.success(`PDF report downloaded: ${fileName}`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      toast.error('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Options Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-800">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-400" /> Download Business Reports
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export comprehensive daily or monthly reports containing revenue, expenses, net profit, tally, and appointments.
          </p>
        </div>

        {/* Mode Selector & Date Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Report Mode Tabs */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
            <button
              type="button"
              onClick={() => setReportMode('daily')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                reportMode === 'daily'
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Daily Report
            </button>
            <button
              type="button"
              onClick={() => setReportMode('monthly')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                reportMode === 'monthly'
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Monthly Report
            </button>
          </div>

          {/* Daily Mode Date Picker */}
          {reportMode === 'daily' ? (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 text-xs bg-slate-900 border-slate-700 text-white font-medium min-w-[150px]',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-amber-400" />
                  <span>{selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Pick Date'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            /* Monthly Mode Month/Year Dropdown */
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
              <CalendarIcon className="h-4 w-4 text-amber-400 ml-1.5" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] h-8 text-xs bg-slate-900 border-slate-700 text-white font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[85px] h-8 text-xs bg-slate-900 border-slate-700 text-white font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 shadow-md cursor-pointer gap-1.5"
              onClick={generatePDF}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs h-9 cursor-pointer gap-1.5"
              onClick={exportAllToCSV}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Report Preview Content */}
      <div className="space-y-6">
        {/* Executive Summary Grid (With Expenses & Net Revenue) */}
        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-6 bg-card shadow-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Executive Financial Summary
              </h3>
              <p className="text-xs text-muted-foreground">
                Revenue, expenses, net revenue & operational KPIs for {filteredData.periodLabel}
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-bold px-3 py-1 border-2 border-amber-500/50 text-amber-500">
              {filteredData.periodLabel} ({reportMode.toUpperCase()})
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Total Revenue */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-800">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Total Revenue</p>
              <p className="text-xl font-black text-foreground mt-1">₹{filteredData.stats.totalRevenue.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Appts + Store Sales</p>
            </div>

            {/* Total Expenses */}
            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border-2 border-rose-300 dark:border-rose-800">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Total Expenses</p>
              <p className="text-xl font-black text-foreground mt-1">₹{filteredData.expensesBreakdown.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Salaries, Rent, Bills, Materials</p>
            </div>

            {/* Net Revenue */}
            <div className={`p-4 rounded-xl border-2 ${
              filteredData.expensesBreakdown.netRevenue >= 0
                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
            }`}>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Net Revenue (Profit)</p>
              <p className={`text-xl font-black mt-1 ${filteredData.expensesBreakdown.netRevenue >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                ₹{filteredData.expensesBreakdown.netRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{filteredData.expensesBreakdown.profitMargin}% Profit Margin</p>
            </div>

            {/* Completed Appointments */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border-2 border-blue-300 dark:border-blue-800">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Appointments</p>
              <p className="text-xl font-black text-foreground mt-1">{filteredData.stats.completedAppointments}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Completed visits</p>
            </div>

            {/* Total Billing Transactions */}
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border-2 border-purple-300 dark:border-purple-800">
              <p className="text-xs font-bold text-purple-700 dark:text-purple-400">Transactions</p>
              <p className="text-xl font-black text-foreground mt-1">{filteredData.stats.totalTransactions}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Billing + Store orders</p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-xl border-2 border-yellow-300 dark:border-yellow-800">
              <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Conversion Rate</p>
              <p className="text-xl font-black text-foreground mt-1">{filteredData.stats.conversionRate.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">Completed / Booked</p>
            </div>
          </div>
        </div>

        {/* Expenses Breakdown Section Card */}
        <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-500" /> Operational Expenses Section
              </CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of operational expenses calculated for {filteredData.periodLabel}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-semibold">Total Expenses</p>
              <p className="text-lg font-black text-rose-500">₹{filteredData.expensesBreakdown.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-3.5 rounded-xl bg-muted/40 border-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
                  <UserCheck className="h-4 w-4" /> Staff Salaries
                </div>
                <p className="text-lg font-black text-foreground">₹{filteredData.expensesBreakdown.salaries.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Fixed staff payouts</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-yellow-500 mb-1">
                  <Zap className="h-4 w-4" /> Electricity Bill
                </div>
                <p className="text-lg font-black text-foreground">₹{filteredData.expensesBreakdown.electricity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Utility electricity charge</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-500 mb-1">
                  <Building2 className="h-4 w-4" /> Shop Rent
                </div>
                <p className="text-lg font-black text-foreground">₹{filteredData.expensesBreakdown.shopRent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Commercial premises rent</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-500 mb-1">
                  <Boxes className="h-4 w-4" /> Material Cost
                </div>
                <p className="text-lg font-black text-foreground">₹{filteredData.expensesBreakdown.materialCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Autofetched inventory restock</p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border-2 border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-1">
                  <ReceiptText className="h-4 w-4" /> Miscellaneous
                </div>
                <p className="text-lg font-black text-foreground">₹{filteredData.expensesBreakdown.miscCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Custom operational costs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tally & Billing Records Table */}
        <div className="rounded-2xl border-2 border-slate-300 dark:border-slate-700 p-4 sm:p-6 bg-card shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold">Tally & Billing Records</h3>
            <Badge variant="outline" className="text-xs font-bold border-2 border-slate-300 dark:border-slate-700">{filteredData.periodLabel}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 uppercase text-[10px] font-bold text-foreground border-b-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Staff</th>
                  <th className="py-2.5 px-3">Services</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredData.tallyRecords.length > 0 ? (
                  filteredData.tallyRecords.map((record, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-medium">{record.time}</td>
                      <td className="py-2.5 px-3 font-bold">{record.customerName}</td>
                      <td className="py-2.5 px-3 font-medium">{record.staffName || '-'}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{record.services}</td>
                      <td className="py-2.5 px-3 text-right font-black">₹{record.amount}</td>
                      <td className="py-2.5 px-3 font-medium">{record.paymentMethod}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={record.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No billing records found for {filteredData.periodLabel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Service Revenue */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Service Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredData.analytics.serviceRevenue.length > 0 ? (
                filteredData.analytics.serviceRevenue.map((service, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{service.name}</span>
                      <span className="font-bold">₹{service.revenue.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{
                          width: `${filteredData.stats.totalRevenue > 0 ? (service.revenue / filteredData.stats.totalRevenue) * 100 : 0}%`,
                          maxWidth: '100%'
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No service revenue recorded for this period.</p>
              )}
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Staff Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredData.analytics.staffPerformance.length > 0 ? (
                filteredData.analytics.staffPerformance.map((staff, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">{staff.name}</p>
                      <p className="text-[10px] text-muted-foreground">{staff.appointments} appointment(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-500">₹{staff.revenue.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Avg ₹{staff.averageRevenue.toFixed(0)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No staff performance recorded for this period.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
