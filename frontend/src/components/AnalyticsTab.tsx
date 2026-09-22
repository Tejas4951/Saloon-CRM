import React, { useState, useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LabelList 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  Scissors, 
  Award, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useTally } from '@/contexts/TallyContext';
import { useStaff } from '@/contexts/StaffContext';
import { useServices } from '@/contexts/ServicesContext';

// Detailed Analytics Sub-widgets
import { StaffPerformanceWidget } from "@/components/dashboard/StaffPerformanceWidget";
import { CustomerRetentionWidget } from "@/components/dashboard/CustomerRetentionWidget";
import { BusinessSummaryWidget } from "@/components/dashboard/BusinessSummaryWidget";
import { AlertsWidget } from "@/components/dashboard/AlertsWidget";

export function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { appointments } = useAppointments();
  const { tallyItems } = useTally();
  const { employees } = useStaff();
  const { services } = useServices();

  // Helper format price
  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Compute Revenue Trends Bar Chart Data based on timeRange & selectedDate
  const revenueChartData = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    if (timeRange === 'Day') {
      // 16 Hourly slots: 9 AM to 12 PM (Midnight)
      const hoursList = [
        { label: '9 AM', hour: 9 }, { label: '10 AM', hour: 10 }, { label: '11 AM', hour: 11 },
        { label: '12 PM', hour: 12 }, { label: '1 PM', hour: 13 }, { label: '2 PM', hour: 14 },
        { label: '3 PM', hour: 15 }, { label: '4 PM', hour: 16 }, { label: '5 PM', hour: 17 },
        { label: '6 PM', hour: 18 }, { label: '7 PM', hour: 19 }, { label: '8 PM', hour: 20 },
        { label: '9 PM', hour: 21 }, { label: '10 PM', hour: 22 }, { label: '11 PM', hour: 23 },
        { label: '12 AM', hour: 24 }
      ];

      // Calculate actual hourly revenue for selected date
      const dateItems = tallyItems.filter(item => item.date.startsWith(dateStr) && item.paymentStatus === 'completed');

      return hoursList.map(h => {
        let actualRev = 0;
        dateItems.forEach(item => {
          if (!item.time) return;
          const isPm = item.time.toUpperCase().includes('PM');
          const isAm = item.time.toUpperCase().includes('AM');
          let [hrStr] = item.time.split(':');
          let hr = parseInt(hrStr, 10) || 0;
          if (isPm && hr < 12) hr += 12;
          if (isAm && hr === 12) hr = 0;

          if (hr === h.hour || (h.hour === 24 && hr === 0)) {
            actualRev += item.totalCost;
          }
        });

        const revenue = actualRev;

        return {
          time: h.label,
          revenue: revenue,
          formattedRev: revenue > 0 ? `₹${revenue.toLocaleString('en-IN')}` : '₹0'
        };
      });
    }

    if (timeRange === 'Week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return days.map((dayLabel, idx) => {
        const curDay = addDays(start, idx);
        const curDayStr = format(curDay, 'yyyy-MM-dd');
        const dayRev = tallyItems
          .filter(item => item.date.startsWith(curDayStr) && item.paymentStatus === 'completed')
          .reduce((sum, item) => sum + item.totalCost, 0);

        return {
          time: dayLabel,
          revenue: dayRev,
          formattedRev: `₹${dayRev.toLocaleString('en-IN')}`
        };
      });
    }

    if (timeRange === 'Month') {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
      return Array.from({ length: Math.ceil(monthDays.length / 7) }, (_, weekIndex) => {
        const weekDates = monthDays.slice(weekIndex * 7, weekIndex * 7 + 7).map(date => format(date, 'yyyy-MM-dd'));
        const revenue = tallyItems
          .filter(item => weekDates.includes(item.date.slice(0, 10)) && item.paymentStatus === 'completed')
          .reduce((sum, item) => sum + item.totalCost, 0);
        return { time: `Week ${weekIndex + 1}`, revenue, formattedRev: `₹${revenue.toLocaleString('en-IN')}` };
      });
    }

    // Year
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((mLabel, idx) => {
      const revenue = tallyItems
        .filter(item => {
          const date = new Date(item.date);
          return item.paymentStatus === 'completed' && date.getFullYear() === selectedDate.getFullYear() && date.getMonth() === idx;
        })
        .reduce((sum, item) => sum + item.totalCost, 0);
      return { time: mLabel, revenue, formattedRev: `₹${revenue.toLocaleString('en-IN')}` };
    });
  }, [timeRange, selectedDate, tallyItems]);

  // Compute Top Services data
  const topServicesData = useMemo(() => {
    const counts: Record<string, { name: string; appts: number; revenue: number }> = {};

    appointments.forEach(apt => {
      apt.serviceIds.forEach(id => {
        const s = services.find(srv => srv.id === id);
        const sName = s?.name || `Service ${id}`;
        const price = s?.price || 0;
        if (!counts[sName]) {
          counts[sName] = { name: sName, appts: 0, revenue: 0 };
        }
        counts[sName].appts += 1;
        counts[sName].revenue += price;
      });
    });

    const list = Object.values(counts).sort((a, b) => b.appts - a.appts);

    return list.slice(0, 5);
  }, [appointments, services]);

  // Compute Top Performers data
  const topPerformersData = useMemo(() => {
    const staffMap: Record<string, { name: string; appts: number; revenue: number; photo?: string }> = {};

    employees.forEach(emp => {
      staffMap[emp.name] = { name: emp.name, appts: 0, revenue: 0, photo: emp.photo };
    });

    tallyItems.forEach(tx => {
      if (tx.paymentStatus === 'completed' && tx.staffName) {
        if (!staffMap[tx.staffName]) {
          staffMap[tx.staffName] = { name: tx.staffName, appts: 0, revenue: 0 };
        }
        staffMap[tx.staffName].revenue += tx.totalCost;
        staffMap[tx.staffName].appts += 1;
      }
    });

    const list = Object.values(staffMap).sort((a, b) => b.revenue - a.revenue);

    return list.slice(0, 4);
  }, [employees, tallyItems]);

  const totalTopPerformerRevenue = useMemo(() => {
    return topPerformersData.reduce((sum, item) => sum + item.revenue, 0);
  }, [topPerformersData]);

  const totalTopPerformerAppts = useMemo(() => {
    return topPerformersData.reduce((sum, item) => sum + item.appts, 0);
  }, [topPerformersData]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-md">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            Business Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Detailed performance metrics and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <SelectTrigger className="w-[110px] h-9 text-xs font-semibold border-2 border-slate-300 dark:border-slate-700">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Day</SelectItem>
              <SelectItem value="Week">Week</SelectItem>
              <SelectItem value="Month">Month</SelectItem>
              <SelectItem value="Year">Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold border-2 border-slate-300 dark:border-slate-700 flex items-center gap-2"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-indigo-500" />
                <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="hidden md:inline-block text-xs text-muted-foreground font-semibold bg-muted/40 px-2.5 py-1 rounded-md border-2 border-slate-300 dark:border-slate-700">
            Viewing data for {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Main Chart Card: Revenue Trends */}
      <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md bg-card overflow-hidden">
        <CardHeader className="pb-2 border-b-2 border-slate-300 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <span>Revenue Trends</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Revenue for {format(selectedDate, 'MMMM d, yyyy')} ({timeRange} View)
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-300 dark:border-indigo-800 text-xs font-bold px-2.5 py-1">
              Live Trends
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartData}
                margin={{ top: 25, right: 10, left: 10, bottom: 5 }}
                barSize={timeRange === 'Day' ? 28 : 42}
              >
                <defs>
                  <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                  dx={-5}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover text-popover-foreground border-2 border-slate-300 dark:border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-semibold">{data.time}</p>
                          <p className="text-indigo-500 font-bold text-sm">
                            Revenue: {data.formattedRev}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#purpleBarGrad)" 
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList 
                    dataKey="revenue" 
                    position="top" 
                    formatter={(val: number) => val > 0 ? `₹${val.toLocaleString('en-IN')}` : ''}
                    style={{ fontSize: '10px', fontWeight: 600, fill: '#818cf8' }}
                  />
                  {revenueChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.revenue > 0 ? 'url(#purpleBarGrad)' : 'rgba(161, 161, 170, 0.2)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Middle Row: Top Services & Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Top Services */}
        <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md bg-card">
          <CardHeader className="p-4 border-b-2 border-slate-300 dark:border-slate-700 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-500" />
              <span>Top Services</span>
            </CardTitle>
            <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-800 text-[11px] font-semibold">
              Today
            </Badge>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-200 dark:divide-slate-800">
            {topServicesData.map((svc, idx) => (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Scissors className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-xs sm:text-sm">{svc.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatCurrency(svc.revenue)} generated</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {svc.appts}
                </Badge>
              </div>
            ))}
            {topServicesData.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No service data yet</p>}
          </CardContent>
        </Card>

        {/* Right Card: Top Performers */}
        <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md bg-card">
          <CardHeader className="p-4 border-b-2 border-slate-300 dark:border-slate-700 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Top Performers</span>
            </CardTitle>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Today</span>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalTopPerformerRevenue)}
              </p>
              <span className="text-[10px] text-muted-foreground block">{totalTopPerformerAppts} appts</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {topPerformersData.map((staff, idx) => {
              const rankColor = 
                idx === 0 ? 'bg-amber-500 text-white font-bold' : 
                idx === 1 ? 'bg-slate-400 text-white font-bold' : 
                idx === 2 ? 'bg-amber-700 text-white font-bold' : 
                'bg-muted text-muted-foreground';

              return (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-xs', rankColor)}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{staff.name}</p>
                      <span className="text-[11px] text-muted-foreground">{staff.appts} appt{staff.appts !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs sm:text-sm text-foreground">{formatCurrency(staff.revenue)}</p>
                  </div>
                </div>
              );
            })}
            {topPerformersData.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No staff performance data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Preserved Detailed Analytics & Insights Widgets */}
      <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-700">
        <h3 className="text-base font-bold text-foreground mb-4">Detailed Performance & Commission Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaffPerformanceWidget />
          <CustomerRetentionWidget />
          <BusinessSummaryWidget />
          <AlertsWidget />
        </div>
      </div>
    </div>
  );
}
