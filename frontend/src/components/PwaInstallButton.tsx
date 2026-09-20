import { CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface PwaInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export function PwaInstallButton({ compact = false, className }: PwaInstallButtonProps) {
  const { install, installed } = usePwaInstall();

  const handleInstall = async () => {
    const result = await install();

    if (result === 'accepted') toast.success('SALONIQ is being installed on this device.');
    if (result === 'dismissed') toast.info('App installation was cancelled.');
    if (result === 'ios') {
      toast.info('In Safari, tap Share and choose “Add to Home Screen”.', { duration: 6000 });
    }
    if (result === 'unavailable') {
      toast.info('Open this page in Chrome or Edge, then try Install App again.', { duration: 5000 });
    }
  };

  return (
    <Button
      type="button"
      onClick={handleInstall}
      disabled={installed}
      aria-label={installed ? 'SALONIQ app is installed' : 'Install SALONIQ app'}
      className={cn(
        'font-bold transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2',
        compact
          ? 'h-9 w-full justify-start rounded-xl border border-gray-700 bg-gray-900 px-3 text-xs text-gray-100 shadow-none hover:bg-gray-800 disabled:border-emerald-500/20 disabled:bg-gray-900 disabled:text-emerald-400'
          : 'h-10 rounded-xl bg-violet-600 px-4 text-xs text-white shadow-md shadow-violet-600/20 hover:bg-violet-500 disabled:bg-emerald-600 disabled:text-white',
        className
      )}
    >
      {installed ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
      {installed ? 'App Installed' : compact ? 'Install Admin App' : 'Install SALONIQ App'}
    </Button>
  );
}
