import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Pencil, 
  Trash2, 
  ArrowRightLeft, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  CheckCheck, 
  DollarSign, 
  Layers, 
  Grid, 
  List, 
  X,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory, InventoryItem, InUseRecord } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Inventory() {
  const { 
    items, 
    inUseRecords, 
    addItem, 
    updateItem, 
    deleteItem, 
    moveToInUse, 
    returnToStock, 
    markFinishedInUse 
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'in-use' | 'low-stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInUseModalOpen, setIsInUseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item for edit, delete, or move-to-in-use
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hair Care',
    brand: '',
    stock: 10,
    minThreshold: 5,
    price: 500,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    description: ''
  });

  // Image upload preview state
  const [imagePreview, setImagePreview] = useState<string>('');

  // Form states for Move to In-Use
  const [inUseQty, setInUseQty] = useState<number>(1);
  const [inUseStation, setInUseStation] = useState<string>('Station 1');
  const [inUseNotes, setInUseNotes] = useState<string>('');

  // Preset categories
  const categories = ['All', 'Hair Care', 'Skin Care', 'Nails', 'Color & Chemical', 'Consumables & Tools'];

  // Handle Image File Upload (Convert to Base64 preview)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size too large. Please select an image smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand,
      stock: item.stock,
      minThreshold: item.minThreshold,
      price: item.price,
      image: item.image,
      description: item.description || ''
    });
    setImagePreview(item.image);
    setIsEditModalOpen(true);
  };

  // Open Move to In-Use Modal
  const openMoveInUseModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setInUseQty(1);
    setInUseStation('Station 1');
    setInUseNotes('');
    setIsInUseModalOpen(true);
  };

  // Submit Add Material
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please provide a material name.');
      return;
    }
    addItem({
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'General Salon',
      stock: Number(formData.stock) || 0,
      minThreshold: Number(formData.minThreshold) || 3,
      price: Number(formData.price) || 0,
      image: formData.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
      description: formData.description.trim()
    });
    toast.success(`Added "${formData.name}" to inventory!`);
    setIsAddModalOpen(false);
    resetForm();
  };

  // Submit Edit Material
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !formData.name.trim()) return;

    updateItem(selectedItem.id, {
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim(),
      stock: Number(formData.stock),
      minThreshold: Number(formData.minThreshold),
      price: Number(formData.price),
      image: formData.image,
      description: formData.description.trim()
    });

    toast.success(`Updated "${formData.name}" details.`);
    setIsEditModalOpen(false);
    setSelectedItem(null);
    resetForm();
  };

  // Submit Move to In-Use (Auto-updates quantity)
  const handleMoveInUseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (inUseQty <= 0) {
      toast.error('Please specify a valid quantity.');
      return;
    }

    if (inUseQty > selectedItem.stock) {
      toast.error(`Only ${selectedItem.stock} items available in stock.`);
      return;
    }

    moveToInUse(selectedItem.id, inUseQty, inUseStation, inUseNotes);
    toast.success(`Moved ${inUseQty} unit(s) of "${selectedItem.name}" to (In Used)! Quantity in stock updated automatically.`);
    setIsInUseModalOpen(false);
    setSelectedItem(null);
  };

  // Confirm Delete
  const handleDeleteConfirm = () => {
    if (!selectedItem) return;
    deleteItem(selectedItem.id);
    toast.success(`Removed "${selectedItem.name}" from inventory.`);
    setIsDeleteModalOpen(false);
    setSelectedItem(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Hair Care',
      brand: '',
      stock: 10,
      minThreshold: 5,
      price: 500,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
      description: ''
    });
    setImagePreview('');
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    if (activeTab === 'low-stock') {
      return matchesSearch && matchesCategory && item.stock <= item.minThreshold;
    }

    return matchesSearch && matchesCategory;
  });

  // Calculate Metrics
  const totalStockCount = items.reduce((sum, item) => sum + item.stock, 0);
  const totalInUseCount = items.reduce((sum, item) => sum + item.inUseStock, 0);
  const totalValuation = items.reduce((sum, item) => sum + (item.stock * item.price), 0);
  const lowStockCount = items.filter(item => item.stock <= item.minThreshold).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 dark:bg-card/40 p-5 rounded-xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-500" />
            Inventory & Material Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage salon materials, update products with photos, and track active workstation (In Used) items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add New Material
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Products</p>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">{items.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{totalStockCount} units available</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Inventory Valuation</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{totalValuation.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Unopened stock value</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Active (In Used)</p>
              <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{totalInUseCount} units</h3>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">At workstations</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Flame className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-border/60 shadow-xs bg-card", lowStockCount > 0 && "border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20")}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Low Stock Warning</p>
              <h3 className={cn("text-xl font-extrabold mt-0.5", lowStockCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                {lowStockCount} items
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Below min threshold</p>
            </div>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", lowStockCount > 0 ? "bg-rose-500/20 text-rose-600" : "bg-muted text-muted-foreground")}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              <span>All Inventory ({items.length})</span>
            </TabsTrigger>
            <TabsTrigger value="in-use" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              <Flame className="h-4 w-4" />
              <span>(In Used) Products ({inUseRecords.length})</span>
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>Low Stock ({lowStockCount})</span>
            </TabsTrigger>
          </TabsList>

          {/* Controls bar (Search, Category, View toggle) */}
          {activeTab !== 'in-use' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name or brand..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs w-[140px] sm:w-[180px]"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1 rounded text-xs", viewMode === 'grid' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn("p-1 rounded text-xs", viewMode === 'table' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground")}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: All Inventory / Stock */}
        <TabsContent value="all" className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-card/40">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-bold text-foreground">No materials found</h3>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting search criteria or add a new material.</p>
              <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="mt-4 bg-amber-500 text-slate-950 font-bold">
                <Plus className="h-4 w-4 mr-1" /> Add Material
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const isLowStock = item.stock <= item.minThreshold;

                return (
                  <Card key={item.id} className="border-border/70 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between bg-card">
                    <div>
                      {/* Product Image */}
                      <div className="relative h-44 w-full bg-muted/30 overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop';
                          }}
                        />
                        <Badge className="absolute top-2 left-2 bg-slate-950/80 text-amber-400 backdrop-blur-xs text-[10px] border-amber-500/30">
                          {item.brand}
                        </Badge>
                        <Badge className={cn("absolute top-2 right-2 text-[10px] font-bold", isLowStock ? "bg-rose-600 text-white" : "bg-emerald-600 text-white")}>
                          {isLowStock ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </div>

                      <CardContent className="p-4 space-y-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.category}</span>
                          <h4 className="font-bold text-base text-foreground line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description || 'Professional salon material'}</p>
                        </div>

                        <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-muted/30 p-2 rounded-md">
                            <span className="text-[10px] text-muted-foreground block">Available Stock</span>
                            <span className={cn("font-bold text-sm", isLowStock ? "text-rose-600" : "text-foreground")}>
                              {item.stock} units
                            </span>
                          </div>
                          <div className="bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-semibold">(In Used)</span>
                            <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                              {item.inUseStock} units
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-muted-foreground">Price per unit:</span>
                          <span className="font-extrabold text-foreground text-sm">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                      </CardContent>
                    </div>

                    <CardFooter className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMoveInUseModal(item)}
                        disabled={item.stock <= 0}
                        className="flex-1 text-[11px] h-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold"
                      >
                        <Flame className="h-3 w-3 mr-1 text-amber-500" /> Move to (In Used)
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelectedItem(item);
                          setIsDeleteModalOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-left">
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">Available Stock</th>
                    <th className="p-3">(In Used)</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="p-3 flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover bg-muted" />
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{item.description}</p>
                        </div>
                      </td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.brand}</td>
                      <td className="p-3 font-bold">
                        <span className={item.stock <= item.minThreshold ? "text-rose-600 font-extrabold" : ""}>
                          {item.stock} units
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          {item.inUseStock} units in use
                        </Badge>
                      </td>
                      <td className="p-3 font-bold">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMoveInUseModal(item)}
                          disabled={item.stock <= 0}
                          className="text-[11px] h-7 bg-amber-500/10 text-amber-600 border-amber-500/30"
                        >
                          <Flame className="h-3 w-3 mr-1" /> Use
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditModal(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => { setSelectedItem(item); setIsDeleteModalOpen(true); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: (In Used) Products */}
        <TabsContent value="in-use" className="space-y-4">
          <Card className="border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                Active Workstation (In Used) Materials
              </CardTitle>
              <CardDescription className="text-xs">
                These materials are opened and currently in use at salon stations. Moving items here automatically deducts their quantity from main stock.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {inUseRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg p-6 bg-card">
                  <Flame className="h-8 w-8 text-amber-400 mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-sm">No items currently marked as (In Used)</p>
                  <p className="text-xs text-muted-foreground mt-1">Go to "All Inventory" and click "Move to (In Used)" on any product to open it for salon use.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inUseRecords.map(record => (
                    <Card key={record.id} className="border-amber-500/30 bg-card shadow-xs">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <img src={record.itemImage} alt={record.itemName} className="w-12 h-12 rounded-lg object-cover bg-muted border" />
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{record.itemName}</h4>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{record.assignedStation || 'General Station'}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Opened: {record.openedDate}</p>
                          </div>
                          <Badge className="bg-amber-500 text-slate-950 font-extrabold text-xs">
                            {record.quantity} In-Use
                          </Badge>
                        </div>

                        {record.notes && (
                          <div className="bg-muted/40 p-2 rounded text-[11px] text-muted-foreground">
                            Note: {record.notes}
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              returnToStock(record.id);
                              toast.success(`Returned "${record.itemName}" back to unopened stock.`);
                            }}
                            className="flex-1 text-[11px] h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Return to Stock
                          </Button>

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              markFinishedInUse(record.id);
                              toast.success(`Marked "${record.itemName}" as empty / finished.`);
                            }}
                            className="flex-1 text-[11px] h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark Empty
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Low Stock */}
        <TabsContent value="low-stock" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.filter(i => i.stock <= i.minThreshold).map(item => (
              <Card key={item.id} className="border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10 shadow-xs">
                <CardContent className="p-4 flex gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover bg-muted" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">Only {item.stock} left (Min: {item.minThreshold})</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Cost: ₹{item.price}</p>
                  </div>
                  <Button size="sm" onClick={() => openEditModal(item)} className="bg-rose-600 hover:bg-rose-700 text-white text-xs">
                    Restock
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Add New Material (with Image Upload) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Add New Material / Product
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in product details and upload a photo to add to salon inventory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Material Name *</Label>
              <Input
                placeholder="e.g. L'Oreal Hair Color Cream"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Brand / Supplier</Label>
                <Input
                  placeholder="e.g. SalonPro"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Unit Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Min Warning</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.minThreshold}
                  onChange={e => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 3 })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            {/* Image Upload Option */}
            <div className="space-y-2 border-t pt-3 border-border/40">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                Product Image (Upload Photo or URL)
              </Label>
              
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {imagePreview || formData.image ? (
                    <img src={imagePreview || formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden" 
                      id="product-photo-upload"
                    />
                    <label 
                      htmlFor="product-photo-upload" 
                      className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md border border-border/80 text-xs font-semibold bg-muted/30 hover:bg-muted transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      Upload Photo from Computer
                    </label>
                  </div>
                  
                  <Input
                    placeholder="or paste Image URL..."
                    value={formData.image}
                    onChange={e => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    className="text-xs h-7"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Description / Notes</Label>
              <Textarea
                placeholder="Product usage instructions, ingredients, or notes..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-xs mt-1 h-20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                Save Material
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Material */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />
              Edit Material Details
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Material Name *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                  <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">Available Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Unit Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Min Threshold</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.minThreshold}
                  onChange={e => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 3 })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            {/* Photo Upload in Edit */}
            <div className="space-y-2 border-t pt-3 border-border/40">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-500" />
                Product Image
              </Label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img src={imagePreview || formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden" 
                    id="edit-photo-upload"
                  />
                  <label 
                    htmlFor="edit-photo-upload" 
                    className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-semibold bg-muted/30 hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Upload New Photo
                  </label>
                  <Input
                    value={formData.image}
                    onChange={e => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    className="text-xs h-7"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-xs mt-1 h-20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Move Product to (In Used) */}
      <Dialog open={isInUseModalOpen} onOpenChange={setIsInUseModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Flame className="h-5 w-5" />
              Move to (In Used) Workstation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Specify quantity to open for salon use. Moving will automatically deduct quantity from main stock.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <form onSubmit={handleMoveInUseSubmit} className="space-y-4 pt-2">
              <div className="bg-muted/40 p-3 rounded-lg flex items-center gap-3 border border-border/40">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-10 h-10 rounded-md object-cover" />
                <div>
                  <h4 className="font-bold text-xs text-foreground">{selectedItem.name}</h4>
                  <p className="text-[11px] text-muted-foreground">Available Stock: <strong className="text-emerald-600">{selectedItem.stock} units</strong></p>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold">Quantity to Move *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem.stock}
                  value={inUseQty}
                  onChange={e => setInUseQty(parseInt(e.target.value) || 1)}
                  className="text-xs mt-1 font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Assigned Workstation / Section</Label>
                <Select value={inUseStation} onValueChange={setInUseStation}>
                  <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Station 1 (Styling)">Station 1 (Styling)</SelectItem>
                    <SelectItem value="Station 2 (Hair Treatment)">Station 2 (Hair Treatment)</SelectItem>
                    <SelectItem value="Wash Station 1">Wash Station 1</SelectItem>
                    <SelectItem value="Spa Room 1">Spa Room 1</SelectItem>
                    <SelectItem value="Nail Bar">Nail Bar</SelectItem>
                    <SelectItem value="General Station">General Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">Usage Note (Optional)</Label>
                <Input
                  placeholder="e.g. Opened for morning client appointments"
                  value={inUseNotes}
                  onChange={e => setInUseNotes(e.target.value)}
                  className="text-xs mt-1"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsInUseModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Confirm & Deduct Stock
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 4: Delete Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remove Material
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>Delete Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
