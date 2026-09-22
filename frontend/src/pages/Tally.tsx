import { useState, useMemo } from 'react';
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
  BarChart3
} from 'lucide-react';
import { useTally } from '@/contexts/TallyContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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

export default function TallyPage() {
  const { tallyItems } = useTally();
  const currentDate = new Date();

  // Mode: 'daily' | 'monthly'
  const [reportMode, setReportMode] = useState<'daily' | 'monthly'>('daily');

  // Daily Mode State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Monthly Mode State
  const [selectedMonth, setSelectedMonth] = useState<string>(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentDate.getFullYear()));

  // Filter tally items by selected mode (daily vs monthly)
  const filteredTallyItems = useMemo(() => {
    if (reportMode === 'daily') {
      if (!selectedDate) return tallyItems;
      return tallyItems.filter(item => {
        if (!item.date) return false;
        try {
          return isSameDay(parseISO(item.date), selectedDate);
        } catch {
          return item.date.split('T')[0] === format(selectedDate, 'yyyy-MM-dd');
        }
      });
    } else {
      // Monthly Mode
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      return tallyItems.filter(item => {
        if (!item.date) return false;
        const dateStr = item.date.split('T')[0];
        return dateStr.startsWith(targetPrefix);
      });
    }
  }, [tallyItems, reportMode, selectedDate, selectedMonth, selectedYear]);

  // Unique dates for calendar highlight
  const availableDates = useMemo(() => {
    return Array.from(new Set(
      tallyItems.map(item => item.date.split('T')[0])
    )).map(date => new Date(date));
  }, [tallyItems]);

  // CSV Export Function (Daily / Monthly / All)
  const handleExportCSV = (exportScope: 'daily' | 'monthly' | 'all') => {
    let itemsToExport = tallyItems;
    let filenamePrefix = 'tally_all';

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
      filenamePrefix = `tally_daily_${format(selectedDate, 'yyyy-MM-dd')}`;
    } else if (exportScope === 'monthly') {
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      itemsToExport = tallyItems.filter(item => item.date && item.date.split('T')[0].startsWith(targetPrefix));
      filenamePrefix = `tally_monthly_${selectedYear}_${selectedMonth}`;
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

  // PDF Export Function (Daily / Monthly)
  const handleExportPDF = (exportScope: 'daily' | 'monthly') => {
    let itemsToExport = tallyItems;
    let titleText = 'SALONIQ - Tally Records Report';
    let subtitleText = '';
    let filename = 'tally_report.pdf';

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
      titleText = 'SALONIQ - Daily Tally Statement';
      subtitleText = `Date: ${format(selectedDate, 'dd MMMM yyyy')}`;
      filename = `tally_daily_${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
    } else {
      const targetPrefix = `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
      itemsToExport = tallyItems.filter(item => item.date && item.date.split('T')[0].startsWith(targetPrefix));
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthLabel = monthNames[parseInt(selectedMonth, 10) - 1] || selectedMonth;
      titleText = 'SALONIQ - Monthly Tally Statement';
      subtitleText = `Period: ${monthLabel} ${selectedYear}`;
      filename = `tally_monthly_${selectedYear}_${selectedMonth}.pdf`;
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
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 40 },
        6: { cellWidth: 18 },
        7: { cellWidth: 18 },
        8: { cellWidth: 20, halign: 'right' }
      }
    });

    doc.save(filename);
    toast.success(`Generated ${exportScope.toUpperCase()} PDF report`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-500" />
            Tally Records & Revenue Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track daily sales, monthly revenue totals, and download statements in CSV or PDF formats.
          </p>
        </div>

        {/* Right Action Bar (Mode Switcher + Date/Month Filter + Export Dropdown) */}
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
                    "w-full sm:w-[220px] justify-start text-left text-xs font-medium border-slate-300 dark:border-slate-700",
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

          {/* Export Dropdown Menu (Daily & Monthly Download Options) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5">
                <Download className="h-4 w-4" />
                Export Reports
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

      {/* Main Table Container */}
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-md overflow-hidden bg-card">
        <Table>
          <TableCaption className="py-2 text-xs">
            Showing {reportMode === 'daily' ? 'Daily' : 'Monthly'} Tally Records ({filteredTallyItems.length} transactions)
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 font-bold text-foreground">Sr. No</TableHead>
              <TableHead className="font-bold text-foreground">Date</TableHead>
              <TableHead className="font-bold text-foreground">Time</TableHead>
              <TableHead className="font-bold text-foreground">Customer</TableHead>
              <TableHead className="font-bold text-foreground">Staff</TableHead>
              <TableHead className="font-bold text-foreground">Services</TableHead>
              <TableHead className="font-bold text-foreground">Payment Method</TableHead>
              <TableHead className="font-bold text-foreground">Status</TableHead>
              <TableHead className="text-right font-bold text-foreground">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTallyItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  {reportMode === 'daily' 
                    ? `No payment records found for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'selected date'}.`
                    : `No payment records found for month ${selectedMonth}/${selectedYear}.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredTallyItems.map((item, index) => (
                <TableRow 
                  key={item.id}
                  className={cn(
                    item.paymentStatus === 'cancelled' && 'bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-l-rose-500'
                  )}
                >
                  <TableCell className="font-medium text-xs">{index + 1}</TableCell>
                  <TableCell className="text-xs font-semibold">{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-xs">{item.time}</TableCell>
                  <TableCell className={cn("text-xs font-semibold", item.paymentStatus === 'cancelled' && 'text-rose-900 dark:text-rose-200')}>
                    {item.customerName}
                  </TableCell>
                  <TableCell className="text-xs">{item.staffName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.services.map((service, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-medium">{service.name}</span> - <span className="text-muted-foreground">₹{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs font-medium">{item.paymentMethod}</span>
                  </TableCell>
                  <TableCell>
                    {item.paymentStatus === 'completed' ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    ) : item.paymentStatus === 'failed' ? (
                      <Badge variant="destructive" className="text-[11px]">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : item.paymentStatus === 'cancelled' ? (
                      <Badge variant="destructive" className="bg-rose-600 dark:bg-rose-700 text-white font-bold border-rose-700 text-[11px]">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Cancelled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 font-semibold text-[11px]">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-semibold text-xs ${item.paymentStatus === 'cancelled' ? 'text-rose-600 dark:text-rose-400 font-bold line-through' : ''}`}>
                    ₹{item.totalCost.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Summary Section */}
        {filteredTallyItems.length > 0 && (
          <div className="border-t-2 border-slate-300 dark:border-slate-700 bg-muted/30">
            <div className="flex flex-col items-end px-6 py-3 space-y-2">
              {/* Subtotal (Completed + Cancelled) */}
              <div className="flex items-center justify-between w-64 text-xs">
                <span className="font-medium text-muted-foreground">Subtotal (Paid + Cancelled):</span>
                <span className="font-semibold text-foreground">
                  ₹{filteredTallyItems
                    .filter(item => ['completed', 'cancelled'].includes(item.paymentStatus))
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              
              {/* Cancelled Amount */}
              <div className="flex items-center justify-between w-64 text-xs">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Cancelled Amount:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  ₹{filteredTallyItems
                    .filter(item => item.paymentStatus === 'cancelled')
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
              
              {/* Total Earning (Subtotal - Cancelled) */}
              <div className="flex items-center justify-between w-64 pt-2 border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                <span className="font-bold text-foreground">
                  Total {reportMode === 'daily' ? 'Daily' : 'Monthly'} Net Earning:
                </span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{filteredTallyItems
                    .filter(item => item.paymentStatus === 'completed')
                    .reduce((sum, item) => sum + item.totalCost, 0)
                    .toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
