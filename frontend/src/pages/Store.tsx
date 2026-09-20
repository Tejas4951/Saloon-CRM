import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store as StoreIcon, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Upload, 
  Image as ImageIcon, 
  Truck, 
  MapPin, 
  CreditCard,
  DollarSign,
  Package,
  Layers,
  ChevronRight
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
import { useStore, StoreProduct, StoreOrder } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Store() {
  const { 
    products, 
    orders, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateOrderStatus 
  } = useStore();

  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hair Care',
    brand: 'SalonPro',
    price: 499,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    description: '',
    status: 'active' as 'active' | 'out_of_stock' | 'draft'
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const defaultCategories = ['Hair Care', 'Skin Care', 'Nails', 'Color & Chemical', 'Accessories'];
  const availableCategories = Array.from(new Set([
    ...defaultCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]));
  const categoriesForFilter = ['All', ...availableCategories];

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setImagePreview(res);
        setFormData(prev => ({ ...prev, image: res }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditModal = (product: StoreProduct) => {
    setSelectedProduct(product);
    const isCustom = !defaultCategories.includes(product.category);
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      image: product.image,
      description: product.description,
      status: product.status
    });
    setIsCustomCategory(isCustom);
    setCustomCategoryInput(isCustom ? product.category : '');
    setImagePreview(product.image);
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Hair Care',
      brand: 'SalonPro',
      price: 499,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
      description: '',
      status: 'active'
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setImagePreview('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter product name.');
      return;
    }
    addProduct({
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'Salon Brand',
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      image: formData.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
      description: formData.description.trim(),
      status: formData.status
    });
    toast.success(`Published product "${formData.name}" to store! Customers can now purchase it on the public site.`);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !formData.name.trim()) return;

    updateProduct(selectedProduct.id, {
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      image: formData.image,
      description: formData.description.trim(),
      status: formData.status
    });

    toast.success(`Updated "${formData.name}" in store.`);
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (!selectedProduct) return;
    deleteProduct(selectedProduct.id);
    toast.success(`Removed "${selectedProduct.name}" from store.`);
    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  // Filter products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter orders
  const filteredOrders = orders.filter(ord => {
    if (orderStatusFilter === 'all') return true;
    return ord.orderStatus === orderStatusFilter;
  });

  const totalStoreRevenue = orders
    .filter(o => o.orderStatus === 'completed' || o.paymentStatus === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 dark:bg-card/40 p-5 rounded-xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <StoreIcon className="h-6 w-6 text-amber-500" />
            Salon Store & Orders Panel
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Post products to your online salon shop and manage customer orders placed from the public side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open('/public', '_blank')}
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            🌐 View Public Customer Store
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Post New Product
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Store Products Posted</p>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">{products.length} Items</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Live on Public Store</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Active Customer Orders</p>
              <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{pendingOrdersCount} Orders</h3>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">Needs fulfill / delivery</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Store Sales</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{totalStoreRevenue.toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">Customer store purchases</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="products" value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="products" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4" />
              <span>Posted Products Catalog ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950">
              <Package className="h-4 w-4" />
              <span>Customer Orders ({orders.length})</span>
              {pendingOrdersCount > 0 && (
                <Badge className="ml-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2">
                  {pendingOrdersCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'products' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search store products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs w-[160px] sm:w-[200px]"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesForFilter.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {activeTab === 'orders' && (
            <Select value={orderStatusFilter} onValueChange={(val: any) => setOrderStatusFilter(val)}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tab 1: Posted Products Management */}
        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="border-border/70 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between bg-card">
                <div>
                  <div className="relative h-44 w-full bg-muted/30 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop';
                      }}
                    />
                    <Badge className="absolute top-2 left-2 bg-slate-950/80 text-amber-400 text-[10px] border-amber-500/30">
                      {product.brand}
                    </Badge>
                    <Badge className={cn("absolute top-2 right-2 text-[10px] font-bold", 
                      product.status === 'active' ? "bg-emerald-600 text-white" : 
                      product.status === 'out_of_stock' ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground")}>
                      {product.status === 'active' ? 'Live on Store' : product.status === 'out_of_stock' ? 'Out of Stock' : 'Draft'}
                    </Badge>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{product.category}</span>
                      <h4 className="font-bold text-base text-foreground line-clamp-1">{product.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Stock</span>
                        <span className="font-bold text-xs text-foreground">{product.stock} units</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Selling Price</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-base">₹{product.price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-3 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(product)}
                    className="flex-1 text-xs h-8 font-semibold"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Product
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Customer Orders Management */}
        <TabsContent value="orders" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl p-8 bg-card">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="font-bold text-foreground text-base">No Customer Orders Found</h3>
              <p className="text-xs text-muted-foreground mt-1">Orders placed by customers on the public store will automatically appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const statusBadgeStyle = 
                  order.orderStatus === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' :
                  order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300' :
                  order.orderStatus === 'cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';

                return (
                  <Card key={order.id} className="border-border/70 shadow-xs bg-card overflow-hidden">
                    <CardHeader className="p-4 pb-3 bg-muted/30 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono font-extrabold text-xs bg-background">
                          {order.orderNumber}
                        </Badge>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{order.customerName}</h4>
                          <p className="text-xs text-muted-foreground">{order.customerPhone} • Placed on {order.orderDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={cn('text-xs font-bold px-2.5 py-0.5 border', statusBadgeStyle)}>
                          {order.orderStatus.toUpperCase()}
                        </Badge>

                        {/* Order Status Update Dropdown */}
                        <Select 
                          value={order.orderStatus} 
                          onValueChange={(val: any) => {
                            updateOrderStatus(order.id, val);
                            toast.success(`Updated order #${order.orderNumber} status to "${val.toUpperCase()}".`);
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-[130px] font-semibold bg-background">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {/* Purchased Items List */}
                      <div className="divide-y divide-border/30">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-md object-cover border bg-muted" />
                              <div>
                                <p className="font-bold text-foreground text-xs">{item.productName}</p>
                                <p className="text-[11px] text-muted-foreground">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            <span className="font-bold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary & Delivery Details */}
                      <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/20 p-3 rounded-lg">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Delivery Method</span>
                          <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                            {order.deliveryType === 'delivery' ? <Truck className="h-3.5 w-3.5 text-amber-500" /> : <MapPin className="h-3.5 w-3.5 text-blue-500" />}
                            {order.deliveryType === 'delivery' ? 'Home Delivery' : 'Salon Pickup'}
                          </span>
                          {order.address && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{order.address}</p>}
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block font-medium">Payment Info</span>
                          <span className="font-semibold text-foreground uppercase">{order.paymentMethod}</span>
                          <Badge variant="outline" className={cn("ml-2 text-[10px] py-0", order.paymentStatus === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200")}>
                            {order.paymentStatus}
                          </Badge>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block font-medium">Total Amount</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-base">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal 1: Add Store Product */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-500" />
              Post Product to Store
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload photo and details to list this item on the public customer store.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Product Title *</Label>
              <Input
                placeholder="e.g. Keratin Smooth Hair Care Kit"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <Select 
                  value={isCustomCategory ? '__custom__' : formData.category} 
                  onValueChange={val => {
                    if (val === '__custom__') {
                      setIsCustomCategory(true);
                      setFormData(prev => ({ ...prev, category: customCategoryInput || '' }));
                    } else {
                      setIsCustomCategory(false);
                      setFormData(prev => ({ ...prev, category: val }));
                    }
                  }}
                >
                  <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-amber-600 font-bold dark:text-amber-400">+ Add Custom Category...</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    placeholder="Enter custom category..."
                    value={customCategoryInput}
                    onChange={e => {
                      setCustomCategoryInput(e.target.value);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }}
                    className="text-xs mt-1.5 border-amber-500/50 focus:border-amber-500"
                    required
                  />
                )}
              </div>

              <div>
                <Label className="text-xs font-bold">Brand</Label>
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
                <Label className="text-xs font-bold">Price (₹) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1 font-bold text-amber-600"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Stock Qty</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Status</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Live)</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Photo Upload Option */}
            <div className="space-y-2 border-t pt-3 border-border/40">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-500" /> Product Photo (Upload or Link)
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
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden" 
                    id="store-product-photo"
                  />
                  <label 
                    htmlFor="store-product-photo" 
                    className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-md border text-xs font-semibold bg-muted/30 hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Upload Product Image
                  </label>

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
              <Label className="text-xs font-bold">Product Description</Label>
              <Textarea
                placeholder="Details, ingredients, or usage instructions..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="text-xs mt-1 h-20"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                Publish Product to Store
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Store Product */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />
              Edit Store Product
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Product Title *</Label>
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
                <Select 
                  value={isCustomCategory ? '__custom__' : formData.category} 
                  onValueChange={val => {
                    if (val === '__custom__') {
                      setIsCustomCategory(true);
                      setFormData(prev => ({ ...prev, category: customCategoryInput || '' }));
                    } else {
                      setIsCustomCategory(false);
                      setFormData(prev => ({ ...prev, category: val }));
                    }
                  }}
                >
                  <SelectTrigger className="text-xs mt-1"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__custom__" className="text-amber-600 font-bold dark:text-amber-400">+ Add Custom Category...</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    placeholder="Enter custom category..."
                    value={customCategoryInput}
                    onChange={e => {
                      setCustomCategoryInput(e.target.value);
                      setFormData(prev => ({ ...prev, category: e.target.value }));
                    }}
                    className="text-xs mt-1.5 border-amber-500/50 focus:border-amber-500"
                    required
                  />
                )}
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
                <Label className="text-xs font-bold">Price (₹)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1 font-bold text-amber-600"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Stock Qty</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Status</Label>
                <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Live)</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Photo Upload in Edit */}
            <div className="space-y-2 border-t pt-3 border-border/40">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-amber-500" /> Product Image
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
                    id="edit-store-photo"
                  />
                  <label 
                    htmlFor="edit-store-photo" 
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

      {/* Modal 3: Delete Confirmation */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Product
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove "{selectedProduct?.name}" from store?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}