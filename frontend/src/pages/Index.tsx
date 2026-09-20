import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import {
  BarChart,
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadDataTab } from '@/components/DownloadDataTab';
import { AnalyticsTab } from '@/components/AnalyticsTab';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentMethod } from "@/data/mockData";
import { toast } from "sonner";
import { 
  Award,
  Bell, 
  Calendar, 
  Clock, 
  CreditCard, 
  DollarSign, 
  Mail, 
  Phone, 
  Plus, 
  Scissors,
  Search, 
  Star,
  Store, 
  TrendingDown, 
  TrendingUp, 
  User,
  Users, 
  CalendarDays, 
  Download,
  BarChart3,
  X,
  Repeat,
  Sun,
  Wallet,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Eye,
  MoreVertical,
  UserCheck
} from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";
import { AddCustomerButton } from "@/components/AddCustomerButton";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useTally } from "@/contexts/TallyContext";
import { useCustomers } from "@/contexts/CustomersContext";
import { useStaff } from "@/contexts/StaffContext";
import { mockCustomers as initialMockCustomers, mockServices, mockTransactions } from "@/data/mockData";
import { cn } from "@/lib/utils";

// Dashboard Widget Sub-components
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";
import { StaffPerformanceWidget } from "@/components/dashboard/StaffPerformanceWidget";
import { CustomerRetentionWidget } from "@/components/dashboard/CustomerRetentionWidget";
import { BusinessSummaryWidget } from "@/components/dashboard/BusinessSummaryWidget";

// Format price with Indian Rupee symbol
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};

// Image modal component
const ImageModal = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out touch-none"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-end mb-2">
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg bg-white">
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-contain max-h-[calc(90vh-60px)]"
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllStats, setShowAllStats] = useState<boolean>(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  const scrollToTabs = useCallback(() => {
    setTimeout(() => {
      if (tabsRef.current) {
        tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 10);
  }, []);
  
  const [transactionSearch, setTransactionSearch] = useState("");
  
  const { appointments, updateAppointment } = useAppointments();
  const { tallyItems, addTallyItem, updatePaymentStatus } = useTally();
  const { customers, addPendingAmount } = useCustomers();
  const { employees } = useStaff();
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    customerName: string;
    customerPhone: string;
    amount: number;
  } | null>(null);

  const todaysAppointments = appointments
    .filter((appointment) => appointment.date === format(selectedDate, "yyyy-MM-dd"))
    .sort((a, b) => {
      if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
      if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return a.time.localeCompare(b.time);
    });

  // Calculate today's revenue (strictly excluding cancelled items)
  const todaysRevenue = tallyItems
    .filter(item => item.date === format(new Date(), 'yyyy-MM-dd') && item.paymentStatus === 'completed')
    .reduce((sum, item) => sum + item.totalCost, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border-sky-200">In Progress</Badge>;
      case 'confirmed':
        return <Badge className="bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border-teal-200">Confirmed</Badge>;
      case 'waiting':
        return <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border-amber-200">Waiting</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-rose-600 text-white font-bold border-rose-700">Cancelled</Badge>;
      default:
        return <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border-purple-200">Booked</Badge>;
    }
  };

  // 7-day revenue & appointments data for ComposedChart
  const getWeeklyComboData = () => {
    return [
      { day: '16 Sep', revenue: 35000, appointments: 28 },
      { day: '17 Sep', revenue: 42000, appointments: 35 },
      { day: '18 Sep', revenue: 38000, appointments: 30 },
      { day: '19 Sep', revenue: 52000, appointments: 42 },
      { day: '20 Sep', revenue: 48000, appointments: 38 },
      { day: '21 Sep', revenue: 58000, appointments: 45 },
      { day: '22 Sep', revenue: 38450, appointments: 42 },
    ];
  };

  return (
    <div className="space-y-6 pb-12">
      {zoomedImage && (
        <ImageModal 
          src={zoomedImage.src} 
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}

      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent p-5 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            <Sun className="h-6 w-6 text-amber-500 animate-pulse" />
            <span>Good morning, Owner</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Here's what's happening at your salon today.
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="bg-card border-border/60 text-foreground font-semibold text-xs h-9 shadow-xs">
              <CalendarDays className="h-3.5 w-3.5 mr-2 text-amber-500" />
              {format(selectedDate, "EEE, dd MMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* SALONIQ 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <Card className="border-border/60 shadow-xs hover:shadow-md transition-shadow bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Today's Revenue</p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">
                  ₹{todaysRevenue ? todaysRevenue.toLocaleString('en-IN') : '38,450'}
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>↑ 12% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shadow-xs">
                ₹
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="border-border/60 shadow-xs hover:shadow-md transition-shadow bg-sky-50/40 dark:bg-sky-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Appointments</p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">
                  {todaysAppointments.length > 0 ? todaysAppointments.length : 42}
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 mt-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>↑ 18% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Customers */}
        <Card className="border-border/60 shadow-xs hover:shadow-md transition-shadow bg-purple-50/40 dark:bg-purple-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">New Customers</p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">8</h3>
                <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>↑ 33% vs yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border-border/60 shadow-xs hover:shadow-md transition-shadow bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-extrabold text-foreground mt-1">₹4,800</h3>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  3 bills pending
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Extra Stats Cards */}
      <div>
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllStats(!showAllStats)}
            className="text-xs text-primary font-semibold hover:bg-muted"
          >
            {showAllStats ? 'Hide Extra Stats ▲' : 'View More Stats ▼'}
          </Button>
        </div>

        {showAllStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 pb-4">
            <StatsCard title="Staff" value={`${employees.filter(e => e.available).length}/${employees.length}`} description="Available/Total" icon={<Users className="h-3.5 w-3.5" />} compact={true} />
            <StatsCard title="Weekly Rev" value="₹10,300" description="Last 7 days" icon={<TrendingUp className="h-3.5 w-3.5" />} compact={true} />
            <StatsCard title="Monthly Rev" value="₹10,300" description="This month" icon={<TrendingUp className="h-3.5 w-3.5" />} compact={true} />
            <StatsCard title="Weekly Appts" value={appointments.length.toString()} description="Last 7 days" icon={<Calendar className="h-3.5 w-3.5" />} compact={true} />
            <StatsCard title="Yearly Rev" value="₹10,300" description="This year" icon={<TrendingUp className="h-3.5 w-3.5" />} compact={true} />
            <StatsCard title="Retention" value="91%" description="21 returning" icon={<Repeat className="h-3.5 w-3.5" />} compact={true} />
          </div>
        )}
      </div>

      {/* Main 4 Dashboard Tabs */}
      <div ref={tabsRef} id="tabs-section">
        <Tabs defaultValue="schedule" className="space-y-6" onValueChange={scrollToTabs}>
          <TabsList className="flex w-full justify-start border-b rounded-none p-0 bg-transparent space-x-4">
            <TabsTrigger 
              value="schedule" 
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground data-[state=active]:text-amber-500 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none bg-transparent"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground data-[state=active]:text-amber-500 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground data-[state=active]:text-amber-500 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none bg-transparent"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="download" 
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-muted-foreground data-[state=active]:text-amber-500 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Today's Appointments Table & Widgets Grid */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Today's Appointments Table */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">Today's Appointments</CardTitle>
                      <CardDescription className="text-xs">Manage and track today's schedule</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-primary font-medium" onClick={() => navigate('/booking')}>
                      View All →
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {todaysAppointments.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b text-muted-foreground font-medium">
                              <th className="py-2.5 px-2">Time</th>
                              <th className="py-2.5 px-2">Customer</th>
                              <th className="py-2.5 px-2">Service(s)</th>
                              <th className="py-2.5 px-2">Stylist / Staff</th>
                              <th className="py-2.5 px-2 text-center">Status</th>
                              <th className="py-2.5 px-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {todaysAppointments.map((apt) => {
                              const customer = customers.find(c => c.id === apt.customerId);
                              const employee = employees.find(e => e.id === apt.employeeId);
                              const serviceNames = apt.serviceIds
                                .map(id => mockServices.find(s => s.id === id)?.name)
                                .filter(Boolean)
                                .join(', ');

                              const isCancelled = apt.status === 'cancelled';

                              return (
                                <tr 
                                  key={apt.id} 
                                  className={`transition-colors border-b ${
                                    isCancelled 
                                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-4 border-l-rose-500 hover:bg-rose-100/60' 
                                      : 'hover:bg-muted/40'
                                  }`}
                                >
                                  <td className={`py-3 px-2 font-bold ${isCancelled ? 'text-rose-700 dark:text-rose-300 line-through' : 'text-foreground'}`}>
                                    {apt.time}
                                  </td>
                                  <td className={`py-3 px-2 font-medium ${isCancelled ? 'text-rose-900 dark:text-rose-200 font-bold' : ''}`}>
                                    {customer?.name || 'Customer'}
                                  </td>
                                  <td className={`py-3 px-2 truncate max-w-[140px] ${isCancelled ? 'text-rose-700 dark:text-rose-300 font-medium' : 'text-muted-foreground'}`}>
                                    {serviceNames || 'Haircut'}
                                  </td>
                                  <td className={`py-3 px-2 ${isCancelled ? 'text-rose-700 dark:text-rose-300' : 'text-muted-foreground'}`}>
                                    {employee?.name || 'Stylist'}
                                  </td>
                                  <td className="py-3 px-2 text-center">{getStatusBadge(apt.status)}</td>
                                  <td className="py-3 px-2 text-right space-x-1">
                                    {!isCancelled ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-[11px] px-2 font-semibold"
                                        onClick={() => {
                                          if (customer && employee) {
                                            setSelectedAppointment({
                                              id: apt.id,
                                              customerName: customer.name,
                                              customerPhone: customer.phone,
                                              amount: apt.total
                                            });
                                            setPaymentDialogOpen(true);
                                          }
                                        }}
                                      >
                                        Pay ₹{apt.total}
                                      </Button>
                                    ) : (
                                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded">
                                        Cancelled
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center space-y-3">
                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground/60" />
                        <p className="text-xs text-muted-foreground">No appointments scheduled for today</p>
                        <Button size="sm" className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" onClick={() => navigate('/booking')}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Appointment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 7-Day Revenue & Appointments Overview Chart */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                        <span>Revenue Overview (Last 7 Days)</span>
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Total Revenue</span>
                      <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹2,34,500</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={getWeeklyComboData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="day" style={{ fontSize: '11px' }} />
                          <YAxis yAxisId="left" style={{ fontSize: '11px' }} />
                          <YAxis yAxisId="right" orientation="right" style={{ fontSize: '11px' }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="appointments" name="Appointments" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Staff Performance & Commissions */}
                <StaffPerformanceWidget />
              </div>

              {/* Right Column: Widgets */}
              <div className="space-y-6">
                <QuickActions 
                  onNewAppointment={() => navigate('/booking')} 
                  onAddCustomer={() => setIsAddCustomerOpen(true)} 
                />
                <AlertsWidget />
                <CustomerRetentionWidget />
                <BusinessSummaryWidget />
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>

          {/* Tab 3: Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="border-border/60 shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold">Transaction & Tally Logs</h3>
                <Input
                  placeholder="Search transactions..."
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                  className="max-w-xs text-xs h-8"
                />
              </div>

              <div className="divide-y divide-border/40 space-y-2">
                {tallyItems.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold">{tx.customerName}</p>
                      <p className="text-muted-foreground">{tx.date} • {tx.staffName} • {tx.paymentMethod.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-foreground">₹{tx.totalCost.toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tx.paymentStatus === 'cancelled' 
                          ? 'bg-rose-100 text-rose-700' 
                          : tx.paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {tx.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab 4: Download Data */}
          <TabsContent value="download" className="space-y-6">
            <DownloadDataTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      {selectedAppointment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          amount={selectedAppointment.amount}
          customerPhone={selectedAppointment.customerPhone}
          onCancelAppointment={async (): Promise<void> => {
            const appointment = appointments.find(a => a.id === selectedAppointment.id);
            if (!appointment) return;
            
            await updateAppointment(appointment.id, { status: 'cancelled' });
            const customer = customers.find(c => c.id === appointment.customerId);
            const employee = employees.find(e => e.id === appointment.employeeId);
            
            if (customer && employee) {
              addTallyItem({
                date: appointment.date,
                time: appointment.time,
                customerName: customer.name,
                customerPhone: customer.phone,
                staffName: employee.name,
                services: appointment.serviceIds
                  .map(id => ({
                    name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
                    price: mockServices.find(s => s.id === id)?.price || 0
                  }))
                  .filter(service => service.name !== 'Unknown Service'),
                totalCost: selectedAppointment.amount,
                paymentMethod: 'cash',
                paymentStatus: 'cancelled'
              });
            }
            toast.success('Appointment cancelled successfully');
          }}
          onPaymentComplete={async (method: PaymentMethod | 'pending', upiTransactionId?: string, pendingAmount?: number): Promise<void> => {
            const appointment = appointments.find(a => a.id === selectedAppointment.id);
            if (!appointment) {
              toast.error('Appointment not found');
              return;
            }
            
            const customer = customers.find(c => c.id === appointment.customerId);
            const employee = employees.find(e => e.id === appointment.employeeId);
            
            if (method === 'pending') {
              const pendingAmt = pendingAmount !== undefined ? pendingAmount : selectedAppointment.amount;
              await updateAppointment(appointment.id, { status: 'completed' });
              
              if (customer) {
                addPendingAmount(customer.id, pendingAmt);
              }

              if (customer && employee) {
                addTallyItem({
                  date: appointment.date,
                  time: appointment.time,
                  customerName: customer.name,
                  customerPhone: customer.phone,
                  staffName: employee.name,
                  services: appointment.serviceIds
                    .map(id => ({
                      name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
                      price: mockServices.find(s => s.id === id)?.price || 0
                    }))
                    .filter(service => service.name !== 'Unknown Service'),
                  totalCost: pendingAmt,
                  paymentMethod: 'cash',
                  paymentStatus: 'pending'
                });
              }
              toast.success(`Pending payment of ₹${pendingAmt.toLocaleString('en-IN')} added to ${customer?.name || 'customer'}`);
            } else {
              await updateAppointment(appointment.id, { status: 'completed' });
              
              if (customer && employee) {
                const newTallyItem = addTallyItem({
                  date: appointment.date,
                  time: appointment.time,
                  customerName: customer.name,
                  customerPhone: customer.phone,
                  staffName: employee.name,
                  services: appointment.serviceIds
                    .map(id => ({
                      name: mockServices.find(s => s.id === id)?.name || 'Unknown Service',
                      price: mockServices.find(s => s.id === id)?.price || 0
                    }))
                    .filter(service => service.name !== 'Unknown Service'),
                  totalCost: selectedAppointment.amount,
                  paymentMethod: method,
                  paymentStatus: 'completed'
                });
                
                if (method === 'upi' && upiTransactionId) {
                  updatePaymentStatus(newTallyItem.id, 'completed', upiTransactionId);
                }
              }
              toast.success('Payment processed successfully');
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
