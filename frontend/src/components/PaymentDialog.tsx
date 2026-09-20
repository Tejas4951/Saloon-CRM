import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Wallet, Smartphone, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { PaymentMethod } from '@/contexts/TallyContext';

export type ExtendedPaymentMethod = PaymentMethod | 'cancel' | 'pending';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerPhone: string;
  onPaymentComplete: (method: PaymentMethod | 'pending', upiTransactionId?: string, pendingAmount?: number) => Promise<void>;
  onCancelAppointment?: () => Promise<void>;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  amount, 
  customerPhone, 
  onPaymentComplete,
  onCancelAppointment 
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<ExtendedPaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | 'error' | null>(null);
  const [upiId, setUpiId] = useState('');
  const [pendingAmount, setPendingAmount] = useState<number>(amount);

  useEffect(() => {
    setPendingAmount(amount);
  }, [amount]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    try {
      setIsProcessing(true);

      if (selectedMethod === 'cancel') {
        if (onCancelAppointment) {
          await onCancelAppointment();
        }
        setPaymentStatus('cancelled');
      } else if (selectedMethod === 'pending') {
        const numPending = typeof pendingAmount === 'number' && !isNaN(pendingAmount) ? pendingAmount : amount;
        await onPaymentComplete('pending', undefined, numPending);
        setPaymentStatus('success');
      } else if (selectedMethod === 'upi') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const transactionId = `TXN${Date.now()}`;
        await onPaymentComplete('upi', transactionId);
        setPaymentStatus('success');
      } else {
        await onPaymentComplete(selectedMethod as PaymentMethod);
        setPaymentStatus('success');
      }
    } catch (error) {
      console.error('Payment / Action failed:', error);
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSelectedMethod(null);
      setPaymentStatus(null);
      setUpiId('');
      setPendingAmount(amount);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment & Action</DialogTitle>
          <DialogDescription>
            {!paymentStatus && `Total amount: ₹${amount.toLocaleString('en-IN')}`}
          </DialogDescription>
        </DialogHeader>

        {!paymentStatus && (
          <div className="space-y-4">
            {/* 5 Options Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Cash */}
              <Button
                variant={selectedMethod === 'cash' ? 'default' : 'outline'}
                className="h-20 flex-col gap-1 text-xs"
                onClick={() => setSelectedMethod('cash')}
              >
                <Wallet className="h-5 w-5 text-emerald-500" />
                <span>Cash</span>
              </Button>

              {/* Card */}
              <Button
                variant={selectedMethod === 'card' ? 'default' : 'outline'}
                className="h-20 flex-col gap-1 text-xs"
                onClick={() => setSelectedMethod('card')}
              >
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>Card</span>
              </Button>

              {/* UPI */}
              <Button
                variant={selectedMethod === 'upi' ? 'default' : 'outline'}
                className="h-20 flex-col gap-1 text-xs"
                onClick={() => setSelectedMethod('upi')}
              >
                <Smartphone className="h-5 w-5 text-purple-500" />
                <span>UPI</span>
              </Button>

              {/* Cancel Appointment Card */}
              <Button
                variant={selectedMethod === 'cancel' ? 'destructive' : 'outline'}
                className={`h-20 flex-col gap-1 text-xs ${
                  selectedMethod === 'cancel' 
                    ? 'bg-rose-600 text-white' 
                    : 'border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                }`}
                onClick={() => setSelectedMethod('cancel')}
              >
                <XCircle className="h-5 w-5 text-rose-500" />
                <span className="text-[11px] font-semibold">Cancel Appt</span>
              </Button>

              {/* Pending Payment Card */}
              <Button
                variant={selectedMethod === 'pending' ? 'default' : 'outline'}
                className={`h-20 flex-col gap-1 text-xs ${
                  selectedMethod === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
                onClick={() => setSelectedMethod('pending')}
              >
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-[11px] font-semibold">Pending Payment</span>
              </Button>
            </div>

            {/* UPI ID Input */}
            {selectedMethod === 'upi' && (
              <div className="space-y-2 bg-muted/40 p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  A payment link will be sent to {customerPhone}
                </p>
                <Input
                  placeholder="Enter UPI ID (optional)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            {/* Pending Payment Input */}
            {selectedMethod === 'pending' && (
              <div className="space-y-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <Label className="text-xs font-bold text-amber-800 dark:text-amber-200">
                  Enter Pending Amount (₹)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={amount}
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(Number(e.target.value))}
                  placeholder="Enter pending amount"
                  className="text-sm bg-white dark:bg-gray-900 font-bold"
                />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  This pending amount will be recorded on the customer's profile card.
                </p>
              </div>
            )}

            {/* Cancel Appointment Warning */}
            {selectedMethod === 'cancel' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cancel this appointment?</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    The appointment will be marked red and excluded from total revenue statistics.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className={`w-full mt-4 font-bold ${
                selectedMethod === 'cancel' 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : selectedMethod === 'pending'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-primary hover:bg-primary/90'
              }`}
              disabled={!selectedMethod || isProcessing}
              onClick={handlePayment}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : selectedMethod === 'cancel' ? (
                'Confirm Cancellation'
              ) : selectedMethod === 'pending' ? (
                `Save Pending Payment (₹${(pendingAmount || amount).toLocaleString('en-IN')})`
              ) : (
                `Pay ₹${amount.toLocaleString('en-IN')}`
              )}
            </Button>
          </div>
        )}

        {/* Status: Success */}
        {paymentStatus === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <h3 className="text-base font-bold">Action Completed!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedMethod === 'pending'
                ? `Pending payment of ₹${pendingAmount.toLocaleString('en-IN')} added to customer profile.`
                : 'Payment recorded successfully.'}
            </p>
            <Button className="mt-4 text-xs font-bold" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {/* Status: Cancelled */}
        {paymentStatus === 'cancelled' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <XCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-600">Appointment Cancelled</h3>
            <p className="text-xs text-muted-foreground mt-1">
              The appointment has been cancelled and excluded from revenue totals.
            </p>
            <Button className="mt-4 text-xs font-bold" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}

        {/* Status: Error */}
        {paymentStatus === 'error' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <XCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold">Action Failed</h3>
            <p className="text-xs text-muted-foreground mt-1">
              An error occurred. Please try again.
            </p>
            <Button variant="outline" className="mt-4 text-xs font-bold" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
