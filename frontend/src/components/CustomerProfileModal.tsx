import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/contexts/CustomersContext';
import { useTally } from '@/contexts/TallyContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { TallyItem } from '@/data/mockData';
import { Phone, Mail, Calendar, Clock, DollarSign, AlertCircle, CheckCircle2, User, Star, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerProfileModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAppointment?: (customerId: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  open,
  onOpenChange,
  onBookAppointment,
}) => {
  const { tallyItems, updatePaymentStatus } = useTally();
  const { appointments } = useAppointments();
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'info'>('pending');

  if (!customer) return null;

  // Filter pending tally items for this customer
  const pendingTallyItems = tallyItems.filter(
    (item) =>
      (item.customerPhone === customer.phone || item.customerName.toLowerCase() === customer.name.toLowerCase()) &&
      item.paymentStatus === 'pending'
  );

  // Fallback: If customer has pendingAmount > 0 but no specific tally items, generate date-wise pending entry
  const displayPendingItems: Array<{
    id: string;
    date: string;
    time: string;
    services: string;
    staff: string;
    amount: number;
  }> = pendingTallyItems.length > 0
    ? pendingTallyItems.map((item) => ({
        id: item.id,
        date: item.date,
        time: item.time || '10:00 AM',
        services: item.services.map((s) => s.name).join(', ') || 'Salon Service',
        staff: item.staffName || 'Staff',
        amount: item.totalCost,
      }))
    : (customer.pendingAmount || 0) > 0
    ? [
        {
          id: 'p-default',
          date: customer.lastVisit ? new Date(customer.lastVisit).toISOString().split('T')[0] : '2026-09-20',
          time: 'Today',
          services: customer.preferredServices.join(', ') || 'Pending Services',
          staff: 'Assigned Stylist',
          amount: customer.pendingAmount || 0,
        },
      ]
    : [];

  const totalPending = (customer.pendingAmount || 0) > 0 
    ? customer.pendingAmount 
    : pendingTallyItems.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSettlePayment = (itemId: string, amount: number) => {
    if (itemId !== 'p-default') {
      updatePaymentStatus(itemId, 'completed');
    }
    toast.success(`Pending payment of ₹${amount.toLocaleString('en-IN')} marked as paid!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 text-white font-extrabold text-xl flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {customer.photo ? (
                <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
              ) : (
                customer.name.split(' ').map((n) => n[0]).join('')
              )}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span>{customer.name}</span>
                <Badge className="bg-amber-600 text-white text-[10px]">Customer</Badge>
              </DialogTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-amber-500" /> {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-amber-500" /> {customer.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-muted/40 rounded-xl border text-center">
            <div className="text-lg font-bold text-foreground">{customer.visitCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Visits</div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Total Spent</div>
          </div>

          <div className={`p-3 rounded-xl border text-center ${
            (totalPending || 0) > 0 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300' 
              : 'bg-muted/40 text-muted-foreground'
          }`}>
            <div className="text-lg font-extrabold">
              ₹{(totalPending || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] uppercase font-bold">Pending Amount</div>
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border text-center">
            <div className="text-lg font-bold text-foreground">
              {customer.lastVisit 
                ? `${Math.floor((Date.now() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24))}d` 
                : 'N/A'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Days Ago</div>
          </div>
        </div>

        {/* Modal Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pending" className="text-xs font-bold flex items-center justify-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
              <span>Pending Details ({(totalPending || 0) > 0 ? `₹${totalPending}` : '₹0'})</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-bold flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-amber-500" />
              <span>Visit History</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs font-bold flex items-center justify-center gap-1.5">
              <User className="h-3.5 w-3.5 text-blue-500" />
              <span>Customer Notes</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Payment Breakdown (Date-wise) */}
          <TabsContent value="pending" className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Date-Wise Pending Payments
              </h4>
              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200">
                Total Pending: ₹{(totalPending || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {displayPendingItems.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {displayPendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900 dark:text-rose-200">{item.date}</span>
                        <span className="text-muted-foreground">• {item.time}</span>
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Services:</span> {item.services}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold">Stylist:</span> {item.staff}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-extrabold text-rose-700 dark:text-rose-300">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                      <Button
                        size="sm"
                        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2"
                        onClick={() => handleSettlePayment(item.id, item.amount)}
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl bg-muted/20">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-foreground">No Pending Payments!</p>
                <p className="mt-1 text-[11px]">All previous bills for {customer.name} have been cleared.</p>
              </div>
            )}
          </TabsContent>

          {/* Visit History */}
          <TabsContent value="history" className="pt-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Appointments & Orders</h4>
            <div className="p-4 border rounded-xl bg-muted/20 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <p className="font-bold">Haircut & Styling</p>
                  <p className="text-muted-foreground text-[11px]">Completed • 15 Sep 2026</p>
                </div>
                <span className="font-bold text-emerald-600">₹1,500 Paid</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Facial & Beard Spa</p>
                  <p className="text-muted-foreground text-[11px]">Completed • 02 Aug 2026</p>
                </div>
                <span className="font-bold text-emerald-600">₹3,000 Paid</span>
              </div>
            </div>
          </TabsContent>

          {/* Customer Info & Notes */}
          <TabsContent value="info" className="pt-3 space-y-3 text-xs">
            <div>
              <h4 className="font-bold mb-1 flex items-center gap-1.5 text-foreground">
                <Star className="h-3.5 w-3.5 text-amber-500" /> Preferred Services
              </h4>
              <div className="flex flex-wrap gap-1">
                {customer.preferredServices.map((service) => (
                  <Badge key={service} variant="secondary" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-1 flex items-center gap-1.5 text-foreground">
                <FileText className="h-3.5 w-3.5 text-blue-500" /> Customer Notes
              </h4>
              <p className="p-3 bg-muted/30 rounded-xl border text-muted-foreground">
                {customer.notes || 'No special notes recorded for this customer.'}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t mt-4">
          {onBookAppointment && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
              onClick={() => {
                onOpenChange(false);
                onBookAppointment(customer.id);
              }}
            >
              <Calendar className="h-3.5 w-3.5 mr-1" /> Book Appointment
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
