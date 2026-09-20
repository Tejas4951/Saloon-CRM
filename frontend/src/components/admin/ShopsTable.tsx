'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { shopService, Shop } from '@/services/shopService';
import { Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ShopsTableProps {
  shops: Shop;
  onShopStatusChange: () => Promise<void>;
}
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ShopsTable({ shops, onShopStatusChange }: ShopsTableProps) {
  const { user } = useAuth();
  const [shopStatus, setShopStatus] = useState<{[key: string]: boolean}>(() => {
    // Initialize all shops as active by default
    const initialStatus: {[key: string]: boolean} = {};
    Object.keys(shops || {}).forEach(shopId => {
      initialStatus[shopId] = true; // Default to active
    });
    return initialStatus;
  });
  const [isToggling, setIsToggling] = useState<{[key: string]: boolean}>({});
  
  const handleToggleStatus = async (shopId: string) => {
    if (!user?.token) return;
    
    try {
      setIsToggling(prev => ({ ...prev, [shopId]: true }));
      const result = await shopService.toggleShopStatus(parseInt(shopId), user.token);
      
      // Update the local state to reflect the change
      setShopStatus(prev => ({
        ...prev,
        [shopId]: result.isAvailable
      }));
      
      // Notify parent component to refresh shops list
      await onShopStatusChange();
      
      toast({
        title: 'Success',
        description: `Shop ${result.isAvailable ? 'opened' : 'closed'} successfully`,
        duration: 1000, // Show for 1 second
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update shop status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => document.querySelector('[role="alert"]')?.remove()}
            className="ml-2"
          >
            OK
          </Button>
        ),
      });
    } finally {
      setIsToggling(prev => ({ ...prev, [shopId]: false }));
    }
  };

  // Update shopStatus when shops prop changes
  useEffect(() => {
    const newStatus = { ...shopStatus };
    let needsUpdate = false;
    
    // Add any new shops to the status
    Object.keys(shops || {}).forEach(shopId => {
      if (newStatus[shopId] === undefined) {
        newStatus[shopId] = true; // Default to active
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      setShopStatus(newStatus);
    }
  }, [shops]);

  if (Object.keys(shops || {}).length === 0) {
    return <div className="text-center py-8 text-gray-500">No shops found</div>;
  }

  return (
    <div className="w-full">
      <Table className="w-full">
        <TableCaption className="sr-only">List of shops</TableCaption>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="w-[60px] px-2 sm:px-4 py-2 text-xs sm:text-sm">ID</TableHead>
            <TableHead className="px-2 sm:px-4 py-2 text-xs sm:text-sm">Shop Name</TableHead>
            <TableHead className="w-[100px] px-2 sm:px-4 py-2 text-xs sm:text-sm text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(shops).map(([id, name]) => (
            <TableRow key={id} className="border-b">
              <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium">{id}</TableCell>
              <TableCell className="px-2 sm:px-4 py-2 text-xs sm:text-sm">{name}</TableCell>
              <TableCell className="px-2 sm:px-4 py-2">
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(id)}
                    disabled={isToggling[id]}
                    className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${isToggling[id] ? 'cursor-wait opacity-70' : 'cursor-pointer'} ${
                      shopStatus[id] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className="sr-only">Toggle shop status</span>
                    {isToggling[id] ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 animate-spin text-white" />
                      </span>
                    ) : (
                      <span
                        className={`absolute left-0.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white shadow-sm sm:shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                          shopStatus[id] ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0.5'
                        }`}
                      >
                        {shopStatus[id] ? (
                          <Check className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />
                        ) : (
                          <X className="h-2 w-2 sm:h-3 sm:w-3 text-gray-500" />
                        )}
                      </span>
                    )}
                  </button>
                  <span className={`ml-2 text-[10px] sm:text-xs font-medium ${
                    shopStatus[id] ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {shopStatus[id] ? 'Open' : 'Closed'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
