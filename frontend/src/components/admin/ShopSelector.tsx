import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ShopSelectorProps {
  selectedShop: string;
  onShopChange: (value: string) => void;
  shops: Record<string, string>;
  isLoading: boolean;
}

export function ShopSelector({ selectedShop, onShopChange, shops, isLoading }: ShopSelectorProps) {
  return (
    <div className="mb-4">
      <Select
        value={selectedShop}
        onValueChange={onShopChange}
        disabled={isLoading || Object.keys(shops).length === 0}
      >
        <SelectTrigger className="w-full sm:w-[300px]">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading shops...
            </div>
          ) : (
            <SelectValue placeholder="Select a shop" />
          )}
        </SelectTrigger>
        <SelectContent>
          {Object.entries(shops).map(([shopId, shopName]) => (
            <SelectItem key={shopId} value={shopId}>
              {String(shopName)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
