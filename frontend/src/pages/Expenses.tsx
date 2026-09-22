import React, { useState, useEffect } from 'react';
import { useStaff } from '@/contexts/StaffContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useStore } from '@/contexts/StoreContext';
import { 
  Calculator, 
  DollarSign, 
  Zap, 
  Building2, 
  Boxes, 
  ReceiptText, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  UserCheck, 
  Search, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Sparkles,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface MiscExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export default function Expenses() {
  const { employees } = useStaff();
  const { items: inventoryItems } = useInventory();
  const { appointments } = useAppointments();
  const { orders } = useStore();

  // Date Filtering State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  // 1. Salaries State (map of staffId -> monthly salary amount)
  const [salaries, setSalaries] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('saloniq_expenses_salaries');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    // Default fallback salaries for initial staff
    return {
      '1': 35000, // Priyanka Patil
      '2': 28000, // Rahul Sharma
      '3': 26000  // Sneha Kapur
    };
  });

  // 2. Electricity & Rent Bills State
  const [electricityBill, setElectricityBill] = useState<number>(() => {
    const saved = localStorage.getItem('saloniq_expenses_electricity');
    return saved ? Number(saved) : 8500;
  });

  const [electricityStatus, setElectricityStatus] = useState<'paid' | 'pending'>(() => {
    const saved = localStorage.getItem('saloniq_expenses_electricity_status');
    return (saved as 'paid' | 'pending') || 'paid';
  });

  const [shopRent, setShopRent] = useState<number>(() => {
    const saved = localStorage.getItem('saloniq_expenses_shop_rent');
    return saved ? Number(saved) : 45000;
  });

  const [rentStatus, setRentStatus] = useState<'paid' | 'pending'>(() => {
    const saved = localStorage.getItem('saloniq_expenses_rent_status');
    return (saved as 'paid' | 'pending') || 'paid';
  });

  // 3. Material Purchased Quantities Override state { [itemId]: quantityPurchased }
  const [materialQty, setMaterialQty] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('saloniq_expenses_material_qty');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {};
  });

  // 4. Miscellaneous Expenses State
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>(() => {
    const saved = localStorage.getItem('saloniq_expenses_misc');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      { id: 'm-1', title: 'High-speed Fiber Internet & WiFi', category: 'Utilities', amount: 1499, date: `${selectedYear}-${selectedMonth}-05`, notes: 'Monthly Broadband Bill' },
      { id: 'm-2', title: 'Beverages & Client Refreshments', category: 'Hospitality', amount: 2450, date: `${selectedYear}-${selectedMonth}-10`, notes: 'Coffee beans, green tea bags, packaged water' },
      { id: 'm-3', title: 'Sanitization & Deep Cleaning Service', category: 'Maintenance', amount: 1800, date: `${selectedYear}-${selectedMonth}-15`, notes: 'Professional salon disinfectant spray & towels' }
    ];
  });

  // Material cost search filter
  const [inventorySearch, setInventorySearch] = useState('');

  // New Misc Expense Form Modal State
  const [isAddMiscOpen, setIsAddMiscOpen] = useState(false);
  const [newMiscTitle, setNewMiscTitle] = useState('');
  const [newMiscCategory, setNewMiscCategory] = useState('General');
  const [newMiscAmount, setNewMiscAmount] = useState('');
  const [newMiscDate, setNewMiscDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMiscNotes, setNewMiscNotes] = useState('');

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem('saloniq_expenses_salaries', JSON.stringify(salaries));
  }, [salaries]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_electricity', String(electricityBill));
  }, [electricityBill]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_electricity_status', electricityStatus);
  }, [electricityStatus]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_shop_rent', String(shopRent));
  }, [shopRent]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_rent_status', rentStatus);
  }, [rentStatus]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_material_qty', JSON.stringify(materialQty));
  }, [materialQty]);

  useEffect(() => {
    localStorage.setItem('saloniq_expenses_misc', JSON.stringify(miscExpenses));
  }, [miscExpenses]);

  // Handle salary updates
  const handleSalaryChange = (staffId: string, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setSalaries(prev => ({ ...prev, [staffId]: num }));
  };

  // Handle Material Purchased Qty change
  const handleMaterialQtyChange = (itemId: string, value: string) => {
    const qty = Math.max(0, Number(value) || 0);
    setMaterialQty(prev => ({ ...prev, [itemId]: qty }));
  };

  // Add new Miscellaneous Expense
  const handleAddMiscExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMiscTitle.trim() || !newMiscAmount || Number(newMiscAmount) <= 0) {
      toast.error('Please provide a valid title and cost amount.');
      return;
    }

    const newItem: MiscExpense = {
      id: 'm-' + Date.now(),
      title: newMiscTitle.trim(),
      category: newMiscCategory,
      amount: Number(newMiscAmount),
      date: newMiscDate,
      notes: newMiscNotes.trim() || undefined
    };

    setMiscExpenses(prev => [newItem, ...prev]);
    toast.success('Miscellaneous expense added successfully!');
    
    // Reset Form
    setNewMiscTitle('');
    setNewMiscCategory('General');
    setNewMiscAmount('');
    setNewMiscNotes('');
    setIsAddMiscOpen(false);
  };

  // Delete Miscellaneous Expense
  const handleDeleteMisc = (id: string) => {
    setMiscExpenses(prev => prev.filter(item => item.id !== id));
    toast.success('Expense item removed.');
  };

  // --- Financial Calculations for Selected Month & Year ---
  const formattedPeriodKey = `${selectedYear}-${selectedMonth}`;

  // 1. Monthly Revenue from Appointments
  const monthlyAppointmentRevenue = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.date && apt.date.startsWith(formattedPeriodKey))
    .reduce((sum, apt) => sum + (Number(apt.total) || 0), 0);

  // 2. Monthly Revenue from Store Product Orders
  const monthlyStoreRevenue = orders
    .filter(order => order.orderStatus !== 'cancelled' && order.orderDate && order.orderDate.startsWith(formattedPeriodKey))
    .reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

  const totalMonthlyRevenue = monthlyAppointmentRevenue + monthlyStoreRevenue;

  // 3. Category Expenses Totals
  // Salary Total
  const totalSalaries = employees.reduce((sum, emp) => {
    const salary = salaries[emp.id] !== undefined ? salaries[emp.id] : 25000;
    return sum + salary;
  }, 0);

  // Electricity & Rent
  const totalElectricity = electricityBill;
  const totalRent = shopRent;

  // Material Costs Total
  const totalMaterialCost = inventoryItems.reduce((sum, item) => {
    // Default purchased quantity equals current item stock if not overridden
    const purchasedQty = materialQty[item.id] !== undefined ? materialQty[item.id] : (item.stock || 1);
    const cost = (item.price || 0) * purchasedQty;
    return sum + cost;
  }, 0);

  // Miscellaneous Total
  const totalMiscCost = miscExpenses
    .filter(item => !item.date || item.date.startsWith(formattedPeriodKey))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Grand Total Expenses
  const totalExpenses = totalSalaries + totalElectricity + totalRent + totalMaterialCost + totalMiscCost;

  // Net Revenue = Total Revenue - Total Expenses
  const netRevenue = totalMonthlyRevenue - totalExpenses;
  const profitMargin = totalMonthlyRevenue > 0 ? ((netRevenue / totalMonthlyRevenue) * 100).toFixed(1) : '0';

  // Filtered Inventory items for Material Cost tab
  const filteredInventory = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Calculator className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                Expenses & Net Revenue
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage staff monthly salaries, utility bills, shop rent, material costs & custom expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Month & Year Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shrink-0">
          <CalendarIcon className="h-4 w-4 text-amber-400 ml-2" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-slate-900 border-slate-700 text-white font-medium">
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
            <SelectTrigger className="w-[90px] h-8 text-xs bg-slate-900 border-slate-700 text-white font-medium">
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
      </div>

      {/* Main Net Revenue Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Monthly Revenue Card */}
        <Card className="bg-gradient-to-br from-emerald-950/40 via-background to-emerald-900/10 border-emerald-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Monthly Revenue
            </CardTitle>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalMonthlyRevenue.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Appointments: ₹{monthlyAppointmentRevenue.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">Store: ₹{monthlyStoreRevenue.toLocaleString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Monthly Expenses Card */}
        <Card className="bg-gradient-to-br from-rose-950/40 via-background to-rose-900/10 border-rose-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Monthly Expenses
            </CardTitle>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <TrendingDown className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Sum of Salaries, Electricity, Rent, Materials & Misc Costs
            </p>
          </CardContent>
        </Card>

        {/* Net Revenue Formula Card */}
        <Card className={`shadow-xl border relative overflow-hidden ${
          netRevenue >= 0 
            ? 'bg-gradient-to-br from-amber-950/40 via-background to-amber-900/10 border-amber-500/30' 
            : 'bg-gradient-to-br from-red-950/40 via-background to-red-900/10 border-red-500/30'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Net Revenue (Profit / Loss)
              </CardTitle>
              <p className="text-[10px] text-amber-500 font-mono mt-0.5">
                Total Revenue - Total Expenses
              </p>
            </div>
            <Badge variant={netRevenue >= 0 ? 'default' : 'destructive'} className="font-bold text-xs py-1">
              {netRevenue >= 0 ? (
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5" /> Profit {profitMargin}%
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ArrowDownRight className="h-3.5 w-3.5" /> Loss
                </span>
              )}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${netRevenue >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
              ₹{netRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3 text-amber-400" />
              <span>Net balance for {new Date(Number(selectedYear), Number(selectedMonth) - 1).toLocaleString('default', { month: 'long' })} {selectedYear}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Expenses Tabs */}
      <Tabs defaultValue="salary" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-muted/70 rounded-2xl border border-border/60">
          <TabsTrigger value="salary" className="py-2.5 text-xs font-bold gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <UserCheck className="h-4 w-4 text-amber-500" />
            <span>Salary</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
              ₹{(totalSalaries/1000).toFixed(0)}k
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="electricity" className="py-2.5 text-xs font-bold gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Electricity Bill</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
              ₹{(totalElectricity/1000).toFixed(1)}k
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="rent" className="py-2.5 text-xs font-bold gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Shop Rent</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
              ₹{(totalRent/1000).toFixed(0)}k
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="material" className="py-2.5 text-xs font-bold gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Boxes className="h-4 w-4 text-purple-500" />
            <span>Material Cost</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
              ₹{(totalMaterialCost/1000).toFixed(1)}k
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="misc" className="py-2.5 text-xs font-bold gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ReceiptText className="h-4 w-4 text-emerald-500" />
            <span>Miscellaneous</span>
            <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-5">
              ₹{(totalMiscCost/1000).toFixed(1)}k
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* 1. SALARY TAB CONTENT */}
        <TabsContent value="salary" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-amber-500" /> Staff Monthly Salaries
                </CardTitle>
                <CardDescription className="text-xs">
                  All active salon staff members and their fixed monthly salary payouts.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-semibold">Total Salary Expense</p>
                <p className="text-lg font-black text-amber-500">₹{totalSalaries.toLocaleString('en-IN')}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => {
                  const currentSalary = salaries[emp.id] !== undefined ? salaries[emp.id] : 25000;
                  return (
                    <div key={emp.id} className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-amber-500/30">
                          <AvatarImage src={emp.photo} alt={emp.name} />
                          <AvatarFallback className="bg-amber-500 text-slate-950 font-bold">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-bold">{emp.name}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{emp.role}</p>
                          <Badge variant={emp.available ? "outline" : "secondary"} className="text-[10px] mt-1">
                            {emp.available ? 'Active Staff' : 'On Leave'}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">Monthly Salary Amount (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₹</span>
                          <Input
                            type="number"
                            value={currentSalary}
                            onChange={(e) => handleSalaryChange(emp.id, e.target.value)}
                            className="pl-7 text-xs font-bold h-9 bg-background focus-visible:ring-amber-500"
                            placeholder="Enter salary..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. ELECTRICITY BILL TAB CONTENT */}
        <TabsContent value="electricity" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" /> Monthly Electricity Bill
                </CardTitle>
                <CardDescription className="text-xs">
                  Record and manage utility electricity charges for the salon shop location.
                </CardDescription>
              </div>
              <Badge variant={electricityStatus === 'paid' ? 'default' : 'destructive'} className="text-xs px-3 py-1">
                {electricityStatus === 'paid' ? 'Paid ✓' : 'Payment Due'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Electricity Bill Amount (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                    <Input
                      type="number"
                      value={electricityBill}
                      onChange={(e) => setElectricityBill(Math.max(0, Number(e.target.value) || 0))}
                      className="pl-8 text-base font-black h-11 bg-background focus-visible:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Admin entered bill for {selectedMonth}/{selectedYear}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Payment Status</Label>
                  <Select value={electricityStatus} onValueChange={(val: 'paid' | 'pending') => setElectricityStatus(val)}>
                    <SelectTrigger className="h-11 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid ✓</SelectItem>
                      <SelectItem value="pending">Pending / Due ⚠️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between max-w-2xl">
                <div>
                  <p className="text-xs font-bold">Total Electricity Cost for Month</p>
                  <p className="text-2xl font-black text-yellow-500">₹{totalElectricity.toLocaleString('en-IN')}</p>
                </div>
                <Button size="sm" onClick={() => toast.success('Electricity bill saved!')} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SHOP RENT TAB CONTENT */}
        <TabsContent value="rent" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" /> Monthly Shop Rent
                </CardTitle>
                <CardDescription className="text-xs">
                  Commercial premises shop rent expense configuration.
                </CardDescription>
              </div>
              <Badge variant={rentStatus === 'paid' ? 'default' : 'destructive'} className="text-xs px-3 py-1">
                {rentStatus === 'paid' ? 'Paid ✓' : 'Payment Due'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Monthly Shop Rent Amount (₹)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                    <Input
                      type="number"
                      value={shopRent}
                      onChange={(e) => setShopRent(Math.max(0, Number(e.target.value) || 0))}
                      className="pl-8 text-base font-black h-11 bg-background focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">Rent Payment Status</Label>
                  <Select value={rentStatus} onValueChange={(val: 'paid' | 'pending') => setRentStatus(val)}>
                    <SelectTrigger className="h-11 text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid ✓</SelectItem>
                      <SelectItem value="pending">Pending / Due ⚠️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between max-w-2xl">
                <div>
                  <p className="text-xs font-bold">Total Rent Cost for Month</p>
                  <p className="text-2xl font-black text-blue-500">₹{totalRent.toLocaleString('en-IN')}</p>
                </div>
                <Button size="sm" onClick={() => toast.success('Shop rent details saved!')} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. MATERIAL COST TAB CONTENT (Autofetched Inventory) */}
        <TabsContent value="material" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-purple-500" /> Autofetched Material & Inventory Costs
                </CardTitle>
                <CardDescription className="text-xs">
                  Products, unit purchase prices, and quantities purchased till date of this month.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search material product..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground font-semibold">Total Material Expense</p>
                  <p className="text-base font-black text-purple-500">₹{totalMaterialCost.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 uppercase text-[10px] font-bold text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Unit Price (₹)</th>
                      <th className="py-3 px-4">Qty Purchased</th>
                      <th className="py-3 px-4 text-right">Total Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredInventory.map(item => {
                      const qty = materialQty[item.id] !== undefined ? materialQty[item.id] : (item.stock || 1);
                      const cost = (item.price || 0) * qty;
                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-bold flex items-center space-x-3">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="h-8 w-8 rounded-lg object-cover bg-muted shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-foreground">{item.name}</p>
                              {item.brand && <p className="text-[10px] text-muted-foreground">{item.brand}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            ₹{(item.price || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => handleMaterialQtyChange(item.id, e.target.value)}
                              className="w-24 h-8 text-xs font-bold"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-black text-purple-600 dark:text-purple-400">
                            ₹{cost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. MISCELLANEOUS COST TAB CONTENT */}
        <TabsContent value="misc" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-emerald-500" /> Miscellaneous & Custom Expenses
                </CardTitle>
                <CardDescription className="text-xs">
                  Add and track any customized salon operational expenses and their costs.
                </CardDescription>
              </div>

              {/* Add Expense Modal Trigger */}
              <Dialog open={isAddMiscOpen} onOpenChange={setIsAddMiscOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5">
                    <Plus className="h-4 w-4" /> Add Custom Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Add Custom Expense</DialogTitle>
                    <DialogDescription className="text-xs">
                      Enter the details of the custom operational expense.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMiscExpense} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Expense Title</Label>
                      <Input
                        placeholder="e.g. Snack & Coffee Supply, Repair Work"
                        value={newMiscTitle}
                        onChange={(e) => setNewMiscTitle(e.target.value)}
                        className="text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Category</Label>
                        <Select value={newMiscCategory} onValueChange={setNewMiscCategory}>
                          <SelectTrigger className="text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                            <SelectItem value="Hospitality">Hospitality</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Cost Amount (₹)</Label>
                        <Input
                          type="number"
                          placeholder="Amount in ₹"
                          value={newMiscAmount}
                          onChange={(e) => setNewMiscAmount(e.target.value)}
                          className="text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Date</Label>
                      <Input
                        type="date"
                        value={newMiscDate}
                        onChange={(e) => setNewMiscDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Notes (Optional)</Label>
                      <Input
                        placeholder="Additional notes or reference no."
                        value={newMiscNotes}
                        onChange={(e) => setNewMiscNotes(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMiscOpen(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                        Save Expense
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {miscExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  No miscellaneous expenses added for this month.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 uppercase text-[10px] font-bold text-muted-foreground border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">Title & Notes</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Cost (₹)</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {miscExpenses.map(item => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <p className="text-foreground">{item.title}</p>
                            {item.notes && <p className="text-[10px] text-muted-foreground font-normal">{item.notes}</p>}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted-foreground">{item.date}</td>
                          <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMisc(item.id)} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
