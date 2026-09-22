import React, { useState, useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { useTally } from '@/contexts/TallyContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function TransactionsTab() {
  const { tallyItems } = useTally();
  const currentDate = new Date();

  // Mode: 'daily' | 'monthly'
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');

  // Daily Mode State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Monthly Mode State
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  // Search Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter tally items by date mode and search term
  const filteredTallyItems = useMemo(() => {
    let items = tallyItems;

    if (reportMode === 'daily') {
      if (selectedDate) {
        items = tallyItems.filter(item => {
          if (!item.date) return false;
          try {
            return isSameDay(parseISO(item.date), selectedDate);
          } catch {
            return item.date.split('T')[0] === format(selectedDate, 'yyyy-MM-dd');
          }
        });
      }
    } else {
      // Monthly Mode
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      items = tallyItems.filter(item => {
        if (!item.date) return false;
        return item.date.split('T')[0].startsWith(targetPrefix);
      });
    }

    // Apply search filter if typed
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.customerName.toLowerCase().includes(query) ||
        item.staffName.toLowerCase().includes(query) ||
        item.paymentMethod.toLowerCase().includes(query) ||
        item.paymentStatus.toLowerCase().includes(query) ||
        item.services.some(s => s.name.toLowerCase().includes(query))
      );
    }

    return items;
  }, [tallyItems, reportMode, selectedDate, selectedMonth, selectedYear, searchTerm]);

  // Unique dates for calendar highlight
  const availableDates = useMemo(() => {
    return Array.from(new Set(
      tallyItems.map(item => item.date.split('T')[0])
    )).map(date => new Date(date));
  }, [tallyItems]);

  // CSV Export Function
  const handleExportCSV = (exportScope: 'daily' | 'monthly' | 'all') => {
    let itemsToExport = tallyItems;
    let filenamePrefix = 'transactions_all';

    if (exportScope === 'daily') {
      if (!selectedDate) {
        toast.error('Please select a date first.');
        return;
      }
      itemsToExport = tallyItems.filter(item => {
        if (!item.date) return false;
        try {
          return isSameDay(parseISO(item.date), selectedDate);
        } catch {
          return item.date.split('T')[0] === format(selectedDate, 'yyyy-MM-dd');
        }
      });
      filenamePrefix = `transactions_daily_${format(selectedDate, 'yyyy-MM-dd')}`;
    } else if (exportScope === 'monthly') {
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      itemsToExport = tallyItems.filter(item => item.date && item.date.split('T')[0].startsWith(targetPrefix));
      filenamePrefix = `transactions_monthly_${selectedYear}_${selectedMonth}`;
    }

    if (itemsToExport.length === 0) {
      toast.error('No records available to export for this selection.');
      return;
    }

    const headers = [
      'Sr. No',
      'Date',
      'Time',
      'Customer Name',
      'Staff Name',
      'Services',
      'Amount (INR)',
      'Payment Method',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...itemsToExport.map((item, index) => (
        [
          index + 1,
          format(new Date(item.date), 'dd/MM/yyyy'),
          item.time,
          `"${item.customerName}"`,
          `"${item.staffName}"`,
          `"${item.services.map(s => `${s.name} (${s.price})`).join(' | ')}"`,
          item.totalCost,
          item.paymentMethod.toUpperCase(),
          item.paymentStatus.toUpperCase()
        ].join(',')
      ))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportScope.toUpperCase()} report as CSV (${itemsToExport.length} items)`);
  };

  // PDF Export Function
  const handleExportPDF = (exportScope: 'daily' | 'monthly') => {
    let itemsToExport = tallyItems;
    let titleText = 'SALONIQ - Transaction Logs';
    let subtitleText = '';
    let filename = 'transactions_report.pdf';

    if (exportScope === 'daily') {
      if (!selectedDate) {
        toast.error('Please select a date first.');
        return;
      }
      itemsToExport = tallyItems.filter(item => {
        if (!item.date) return false;
        try {
          return isSameDay(parseISO(item.date), selectedDate);
        } catch {
          return item.date.split('T')[0] === format(selectedDate, 'yyyy-MM-dd');
        }
      });
      titleText = 'SALONIQ - Daily Transactions Report';
      subtitleText = `Date: ${format(selectedDate, 'dd MMMM yyyy')}`;
      filename = `transactions_daily_${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
    } else {
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      itemsToExport = tallyItems.filter(item => item.date && item.date.split('T')[0].startsWith(targetPrefix));
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthLabel = monthNames[parseInt(selectedMonth, 10) - 1] || selectedMonth;
      titleText = 'SALONIQ - Monthly Transactions Report';
      subtitleText = `Period: ${monthLabel} ${selectedYear}`;
      filename = `transactions_monthly_${selectedYear}_${selectedMonth}.pdf`;
    }

    if (itemsToExport.length === 0) {
      toast.error('No records found to export PDF.');
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(234, 179, 8); // Gold accent
    doc.text('SALONIQ SALON MANAGEMENT', 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Dark slate
    doc.text(titleText, 14, 28);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitleText, 14, 34);
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 40);

    // Calculate Summary Stats
    const totalPaid = itemsToExport
      .filter(item => item.paymentStatus === 'completed')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const totalCancelled = itemsToExport
      .filter(item => item.paymentStatus === 'cancelled')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const subtotal = itemsToExport
      .filter(item => ['completed', 'cancelled'].includes(item.paymentStatus))
      .reduce((sum, item) => sum + item.totalCost, 0);

    // Summary Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 45, 182, 22, 3, 3, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Subtotal (Paid + Cancelled): INR ${subtotal.toLocaleString('en-IN')}`, 20, 53);
    doc.setTextColor(225, 29, 72); // Rose red
    doc.text(`Cancelled Amount: INR ${totalCancelled.toLocaleString('en-IN')}`, 20, 60);
    doc.setTextColor(16, 185, 129); // Emerald green
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Net Earnings: INR ${totalPaid.toLocaleString('en-IN')}`, 110, 57);

    // Transactions Table
    const tableData = itemsToExport.map((item, index) => [
      index + 1,
      format(new Date(item.date), 'dd/MM/yyyy'),
      item.time,
      item.customerName,
      item.staffName,
      item.services.map(s => `${s.name} (INR ${s.price})`).join(', '),
      item.paymentMethod.toUpperCase(),
      item.paymentStatus.toUpperCase(),
      `INR ${item.totalCost.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: 72,
      head: [['#', 'Date', 'Time', 'Customer', 'Staff', 'Services', 'Method', 'Status', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      }
    });

    doc.save(filename);
    toast.success(`Generated ${exportScope.toUpperCase()} PDF report`);
  };

  // Summary Metrics for current filtered items
  const paidTotal = filteredTallyItems
    .filter(item => item.paymentStatus === 'completed')
    .reduce((sum, item) => sum + item.totalCost, 0);

  const cancelledTotal = filteredTallyItems
    .filter(item => item.paymentStatus === 'cancelled')
    .reduce((sum, item) => sum + item.totalCost, 0);

  const subtotalTotal = filteredTallyItems
    .filter(item => ['completed', 'cancelled'].includes(item.paymentStatus))
    .reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Switcher Bar */}
      <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md bg-card p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-500" />
              Transaction & Tally Logs
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              View and download daily or monthly payment records and revenue statements.
            </p>
          </div>

          {/* Right Action Controls: Mode Switcher + Date/Month Filter + Search + Export */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Mode Switcher Tabs (Daily vs Monthly) */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setReportMode('daily')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  reportMode === 'daily'
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Daily View
              </button>
              <button
                onClick={() => setReportMode('monthly')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  reportMode === 'monthly'
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Monthly View
              </button>
            </div>

            {/* Daily Date Selector */}
            {reportMode === 'daily' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[200px] justify-start text-left text-xs font-medium border-slate-300 dark:border-slate-700 h-9",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-amber-500" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date > new Date()}
                    modifiers={{
                      hasRecords: availableDates.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                    }}
                    modifiersStyles={{
                      hasRecords: {
                        border: '2px solid #22c55e',
                        borderRadius: '50%'
                      }
                    }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Monthly Selectors (Month & Year) */}
            {reportMode === 'monthly' && (
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[120px] text-xs h-9 border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="Month" />
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
                  <SelectTrigger className="w-[90px] text-xs h-9 border-slate-300 dark:border-slate-700">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {['2024', '2025', '2026', '2027', '2028'].map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs w-full sm:w-[180px] border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Export Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 h-9">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  Daily Exports
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleExportCSV('daily')}
                  className="text-xs cursor-pointer gap-2 font-medium"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Export Daily Report (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportPDF('daily')}
                  className="text-xs cursor-pointer gap-2 font-medium"
                >
                  <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  Export Daily Report (PDF)
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  Monthly Exports
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleExportCSV('monthly')}
                  className="text-xs cursor-pointer gap-2 font-semibold text-amber-600 dark:text-amber-400"
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                  Export Monthly Report (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExportPDF('monthly')}
                  className="text-xs cursor-pointer gap-2 font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Export Monthly Report (PDF)
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem 
                  onClick={() => handleExportCSV('all')}
                  className="text-xs cursor-pointer gap-2 text-muted-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Complete History (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Transactions List Card */}
      <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md p-4 bg-card">
        <div className="flex justify-between items-center mb-3 pb-3 border-b-2 border-slate-300 dark:border-slate-700">
          <span className="text-xs text-muted-foreground font-semibold">
            Showing <strong className="text-foreground">{filteredTallyItems.length}</strong> {reportMode === 'daily' ? 'Daily' : 'Monthly'} Transactions
          </span>
          <span className="text-xs font-bold text-primary">
            Mode: {reportMode === 'daily' ? (selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Daily') : `${selectedMonth}/${selectedYear}`}
          </span>
        </div>

        <div className="divide-y-2 divide-slate-200 dark:divide-slate-800 space-y-2">
          {filteredTallyItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No transaction logs found for {reportMode === 'daily' ? 'selected day' : 'selected month'}.
            </div>
          ) : (
            filteredTallyItems.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs hover:bg-muted/40 px-2 rounded-lg transition-colors">
                <div>
                  <p className="font-bold text-foreground text-sm">{tx.customerName}</p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {tx.date} • {tx.staffName} • <span className="font-semibold text-foreground">{tx.paymentMethod.toUpperCase()}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Services: <span className="font-medium">{tx.services.map(s => `${s.name} (₹${s.price})`).join(', ')}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-extrabold text-sm ${tx.paymentStatus === 'cancelled' ? 'text-rose-600 line-through' : 'text-foreground'}`}>
                    ₹{tx.totalCost.toLocaleString('en-IN')}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    tx.paymentStatus === 'cancelled' 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' 
                      : tx.paymentStatus === 'pending'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  }`}>
                    {tx.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {filteredTallyItems.length > 0 && (
          <div className="mt-4 pt-3 border-t-2 border-slate-300 dark:border-slate-700 bg-muted/30 p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Subtotal (Paid + Cancelled): </span>
              <span className="font-bold">₹{subtotalTotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Cancelled: </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">₹{cancelledTotal.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Net Earning: </span>
              <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">₹{paidTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
