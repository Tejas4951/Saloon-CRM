import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ShoppingBag, 
  User, 
  Sparkles, 
  Scissors, 
  Clock, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Phone, 
  CreditCard, 
  Search, 
  Filter, 
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  Crown,
  Heart,
  UserCheck,
  Upload,
  Pencil,
  Mail,
  Tag,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore, StoreProduct, StoreOrderItem } from '@/contexts/StoreContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useStaff } from '@/contexts/StaffContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { mockServices } from '@/data/mockData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSalonLogo } from '@/hooks/useSalonLogo';
import { PwaInstallButton } from '@/components/PwaInstallButton';

export interface PublicCustomerProfile {
  name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  preferredServices: string;
  notes: string;
  photo: string;
}

export default function PublicPortal() {
  const navigate = useNavigate();
  const { products, orders, placeOrder } = useStore();
  const { addAppointment } = useAppointments();
  const { employees } = useStaff();
  const { addCustomer } = useCustomers();
  const { logo } = useSalonLogo();

  const [activeTab, setActiveTab] = useState<'booking' | 'store' | 'orders' | 'saved' | 'profile'>('booking');

  // --- Customer Signup / Profile State ---
  const [customerProfile, setCustomerProfile] = useState<PublicCustomerProfile | null>(() => {
    const saved = localStorage.getItem('salon_public_customer_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormData, setProfileFormData] = useState<PublicCustomerProfile>({
    name: customerProfile?.name || '',
    phone: customerProfile?.phone || '',
    email: customerProfile?.email || '',
    gender: customerProfile?.gender || 'Male',
    preferredServices: customerProfile?.preferredServices || '',
    notes: customerProfile?.notes || '',
    photo: customerProfile?.photo || ''
  });

  // --- Store & Cart States ---
  const [cartItems, setCartItems] = useState<StoreOrderItem[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Pagination state for Store tab
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  // Checkout Form State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerName: customerProfile?.name || '',
    customerPhone: customerProfile?.phone || '',
    deliveryType: 'pickup' as 'pickup' | 'delivery',
    address: '',
    paymentMethod: 'upi' as 'upi' | 'card' | 'cash',
    notes: ''
  });

  // --- Booking Wizard Flow States ---
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([mockServices[0]?.id || '1']);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(employees[0]?.id || '1');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>('10:00 AM');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingCustomerName, setBookingCustomerName] = useState<string>(customerProfile?.name || '');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState<string>(customerProfile?.phone || '');

  // Keep customer name & phone auto-filled when profile exists
  useEffect(() => {
    if (customerProfile) {
      setBookingCustomerName(customerProfile.name);
      setBookingCustomerPhone(customerProfile.phone);
      setCheckoutData(prev => ({
        ...prev,
        customerName: customerProfile.name,
        customerPhone: customerProfile.phone
      }));
    }
  }, [customerProfile]);

  // Handle Photo Upload for Signup / Profile
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        setProfileFormData(prev => ({ ...prev, photo: res }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Customer Profile / Signup
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormData.name.trim() || !profileFormData.phone.trim()) {
      toast.error('Please enter name and phone number.');
      return;
    }

    const updatedProfile: PublicCustomerProfile = {
      name: profileFormData.name.trim(),
      phone: profileFormData.phone.trim(),
      email: profileFormData.email.trim(),
      gender: profileFormData.gender,
      preferredServices: profileFormData.preferredServices.trim(),
      notes: profileFormData.notes.trim(),
      photo: profileFormData.photo
    };

    setCustomerProfile(updatedProfile);
    localStorage.setItem('salon_public_customer_profile', JSON.stringify(updatedProfile));

    // Automatically sync public customer signup to Admin Customers tab
    addCustomer({
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      email: updatedProfile.email,
      gender: updatedProfile.gender === 'Female' ? 'female' : 'male',
      preferredServices: updatedProfile.preferredServices ? updatedProfile.preferredServices.split(',').map(s => s.trim()) : [],
      notes: updatedProfile.notes ? `Registered via Public Portal | Notes: ${updatedProfile.notes}` : 'Registered via Public Portal',
      photo: updatedProfile.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      visitCount: 0,
      totalSpent: 0
    });

    toast.success('Account created & profile saved! Admin can now view your details under Customers.');
    setIsProfileModalOpen(false);
  };

  const bookingSteps = [
    { number: 1, title: "Select Services" },
    { number: 2, title: "Staff & Time" },
    { number: 3, title: "Confirm" }
  ];

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const selectedServicesData = mockServices.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServicesData.reduce((acc, s) => acc + s.duration, 0);
  const totalPrice = selectedServicesData.reduce((acc, s) => acc + s.price, 0);
  const selectedEmployeeData = employees.find(e => e.id === selectedEmployeeId);

  const timeSlotsList = [
    { display: "9:00 AM", start: "9:00 AM" },
    { display: "10:00 AM", start: "10:00 AM" },
    { display: "11:00 AM", start: "11:00 AM" },
    { display: "12:00 PM", start: "12:00 PM" },
    { display: "01:30 PM", start: "01:30 PM" },
    { display: "03:00 PM", start: "03:00 PM" },
    { display: "05:00 PM", start: "05:00 PM" },
    { display: "06:30 PM", start: "06:30 PM" },
    { display: "08:00 PM", start: "08:00 PM" }
  ];

  // Toggle Saved Wishlist
  const toggleSaveProduct = (productId: string) => {
    setSavedProductIds(prev => {
      if (prev.includes(productId)) {
        toast.info('Removed from saved items.');
        return prev.filter(id => id !== productId);
      } else {
        toast.success('Saved to your wishlist!');
        return [...prev, productId];
      }
    });
  };

  // Cart operations
  const addToCart = (product: StoreProduct) => {
    if (product.stock <= 0) {
      toast.error('Product is currently out of stock.');
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units available.`);
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        quantity: 1
      }];
    });
    toast.success(`Added "${product.name}" to cart!`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    const targetProduct = products.find(p => p.id === productId);
    setCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (targetProduct && newQty > targetProduct.stock) {
            toast.error(`Maximum available stock reached (${targetProduct.stock}).`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as StoreOrderItem[];
    });
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Handle Checkout Order Submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.customerName.trim() || !checkoutData.customerPhone.trim()) {
      toast.error('Please fill in your name and phone number.');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    // Place order in shared StoreContext (visible in Admin panel's Store -> Orders tab)
    const createdOrder = placeOrder({
      customerName: checkoutData.customerName.trim(),
      customerPhone: checkoutData.customerPhone.trim(),
      deliveryType: checkoutData.deliveryType,
      address: checkoutData.deliveryType === 'delivery' ? checkoutData.address.trim() : undefined,
      items: cartItems,
      totalAmount: cartTotal,
      paymentMethod: checkoutData.paymentMethod,
      paymentStatus: checkoutData.paymentMethod === 'cash' ? 'pending' : 'completed',
      orderStatus: 'pending',
      notes: checkoutData.notes.trim()
    });

    // Automatically record or update customer in Admin panel's Customers tab
    addCustomer({
      name: checkoutData.customerName.trim(),
      phone: checkoutData.customerPhone.trim(),
      email: customerProfile?.email || '',
      gender: customerProfile?.gender === 'Female' ? 'female' : 'male',
      totalSpent: cartTotal,
      visitCount: 1,
      preferredServices: [],
      notes: `Store Order #${createdOrder.orderNumber}` + (checkoutData.notes.trim() ? `: ${checkoutData.notes.trim()}` : ''),
      photo: customerProfile?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
    });

    toast.success(`Order #${createdOrder.orderNumber} placed successfully! We have notified the salon admin.`);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveTab('orders');
  };

  // Handle Appointment Booking Submission (Step 3 Confirm)
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCustomerName.trim() || !bookingCustomerPhone.trim()) {
      toast.error('Please enter your full name and contact phone number.');
      return;
    }

    if (!selectedEmployeeId || !selectedTimeSlot || selectedServices.length === 0) {
      toast.error('Please complete all booking steps.');
      return;
    }

    const selectedStaffObj = employees.find(e => e.id === selectedEmployeeId);

    // Sync appointment to shared AppointmentsContext
    addAppointment({
      id: `apt-${Date.now()}`,
      customerId: 'cust-public-online',
      employeeId: selectedEmployeeId,
      serviceIds: selectedServices,
      date: bookingDate,
      time: selectedTimeSlot,
      status: 'scheduled',
      total: totalPrice,
      notes: `Public Booking: ${bookingCustomerName} (${bookingCustomerPhone})`
    });

    // Automatically sync customer to Admin Customers tab
    addCustomer({
      name: bookingCustomerName.trim(),
      phone: bookingCustomerPhone.trim(),
      email: customerProfile?.email || '',
      gender: customerProfile?.gender === 'Female' ? 'female' : 'male',
      totalSpent: totalPrice,
      visitCount: 1,
      preferredServices: selectedServicesData.map(s => s.name),
      notes: `Public Appointment: ${bookingDate} at ${selectedTimeSlot}`,
      photo: customerProfile?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
    });

    toast.success(`Booking Confirmed! Stylist: ${selectedStaffObj?.name || 'Staff'}, Date: ${bookingDate} at ${selectedTimeSlot}`);
    
    // Reset booking wizard state
    setBookingStep(1);
    setSelectedServices([mockServices[0]?.id || '1']);
    setSelectedTimeSlot('10:00 AM');
    setActiveTab('orders');
  };

  // Filter public products
  const activeProducts = products.filter(p => p.status === 'active');
  const defaultCategories = ['Hair Care', 'Skin Care', 'Nails', 'Color & Chemical', 'Accessories'];
  const categories = ['All', ...Array.from(new Set([
    ...defaultCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]))];

  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const savedProducts = activeProducts.filter(p => savedProductIds.includes(p.id));

  return (
    <div className="yepsta-theme min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-20 sm:pb-0 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/25 via-stone-950 to-stone-950">
      {/* Top Banner & Header */}
      <header className="bg-stone-900/90 backdrop-blur-md border-b border-violet-500/30 sticky top-0 z-50 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-purple-950/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-stone-200 via-amber-100 to-stone-100 text-neutral-950 font-extrabold flex items-center justify-center overflow-hidden shadow-md shadow-violet-500/30 shrink-0">
              {logo ? (
                <img src={logo} alt="Salon logo" className="h-full w-full object-contain bg-white" />
              ) : (
                <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white flex items-center gap-1.5 truncate">
                SALONIQ <span className="hidden sm:inline-block text-violet-300 font-semibold text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30">Official Store & Booking</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-violet-300/70 truncate">Pune • Koregaon Park Branch</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Profile / Signup Avatar Button */}
            <Button
              onClick={() => {
                if (customerProfile) {
                  setProfileFormData(customerProfile);
                } else {
                  setProfileFormData({
                    name: '',
                    phone: '',
                    email: '',
                    gender: 'Male',
                    preferredServices: '',
                    notes: '',
                    photo: ''
                  });
                }
                setIsProfileModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="text-xs border-violet-500/40 text-violet-300 hover:bg-violet-950/40 hidden sm:flex items-center gap-1.5 h-8 sm:h-9"
            >
              {customerProfile?.photo ? (
                <img src={customerProfile.photo} alt={customerProfile.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-violet-400" />
              )}
              <span>{customerProfile ? customerProfile.name : 'Sign Up'}</span>
            </Button>

            {/* Shopping Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-gradient-to-r from-stone-100 via-amber-50 to-stone-200 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-8 sm:h-9 px-3 sm:px-3.5 shadow-md shadow-violet-600/30"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-extrabold text-[10px] h-4.5 min-w-4.5 flex items-center justify-center rounded-full p-0 shadow-sm">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Navigation Tabs (Desktop & Tablet) */}
        <div className="hidden sm:flex bg-stone-900/90 p-1.5 rounded-xl border border-stone-800 items-center justify-center max-w-3xl mx-auto shadow-lg backdrop-blur-md">
          <button
            onClick={() => setActiveTab('booking')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === 'booking' ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Book Appointment</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === 'store' ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" : "text-stone-400 hover:text-stone-200"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Store</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === 'orders' ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Package className="h-4 w-4" />
            <span>Orders</span>
            {orders.length > 0 && (
              <Badge className="ml-1 bg-violet-500/20 text-violet-300 text-[10px] px-1.5 py-0 h-4 min-w-4 rounded-full border border-violet-500/30">
                {orders.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === 'saved' ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Heart className="h-4 w-4" />
            <span>Saved</span>
            {savedProductIds.length > 0 && (
              <Badge className="ml-1 bg-rose-600 text-white text-[10px] px-1.5 py-0 h-4 min-w-4 rounded-full">
                {savedProductIds.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === 'profile' ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" : "text-stone-400 hover:text-stone-200"
            )}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
        </div>

        {/* Tab 1: Book Appointment (Exact Admin Dashboard 3-Step Flow) */}
        {activeTab === 'booking' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Title */}
            <div className="bg-stone-900/80 p-4 sm:p-5 rounded-2xl border border-violet-500/20 shadow-lg backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
                <Scissors className="h-6 w-6 text-violet-400" /> Book Appointment
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Choose your preferred services, stylist, and time slot to confirm your booking.
              </p>
            </div>

            {/* Steps Indicator Bar */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
              {bookingSteps.map((stepItem) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className={cn(
                    "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold transition-all",
                    bookingStep >= stepItem.number 
                      ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" 
                      : "bg-stone-800 text-stone-400"
                  )}>
                    {stepItem.number}
                  </div>
                  <span className={cn(
                    "ml-1.5 sm:ml-2 text-xs sm:text-sm font-semibold",
                    bookingStep >= stepItem.number ? "text-white" : "text-stone-400"
                  )}>
                    {stepItem.title}
                  </span>
                  {stepItem.number < 3 && (
                    <div className={cn(
                      "w-6 sm:w-12 h-0.5 mx-2 sm:mx-4",
                      bookingStep > stepItem.number ? "bg-violet-500" : "bg-stone-800"
                    )} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Select Services */}
            {bookingStep === 1 && (
              <Card className="bg-stone-900/90 border-stone-800 text-white backdrop-blur-md shadow-xl">
                <CardHeader className="pb-3 border-b border-stone-800">
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    Select Services
                  </CardTitle>
                  <CardDescription className="text-stone-400 text-xs">
                    Choose the services you'd like to book for your appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockServices.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => handleServiceToggle(service.id)}
                          className={cn(
                            "p-3.5 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between space-y-2",
                            isSelected
                              ? "border-violet-500 bg-violet-500/10 shadow-md shadow-violet-900/20"
                              : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <h3 className="font-bold text-sm text-white">{service.name}</h3>
                              <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-stone-800/60">
                            <Badge variant="secondary" className="text-[10px] bg-stone-800 text-stone-300">
                              <Clock className="h-3 w-3 mr-1 text-violet-400" />
                              {service.duration} mins
                            </Badge>
                            <span className="font-extrabold text-sm text-violet-400">
                              ₹{service.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="p-3.5 bg-violet-950/40 border border-violet-500/30 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {totalDuration} minutes total
                        </div>
                      </div>
                      <div className="text-base font-extrabold text-violet-400">
                        ₹{totalPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => setBookingStep(2)}
                      disabled={selectedServices.length === 0}
                      className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-10 px-6 shadow-md shadow-violet-600/30"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Staff & Time */}
            {bookingStep === 2 && (
              <Card className="bg-stone-900/90 border-stone-800 text-white backdrop-blur-md shadow-xl">
                <CardHeader className="pb-3 border-b border-stone-800">
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    Select Staff & Time
                  </CardTitle>
                  <CardDescription className="text-stone-400 text-xs">
                    Choose your preferred staff member and time slot for the appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Staff List */}
                    <div className="lg:col-span-1 space-y-3">
                      <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider">Select Staff</h3>
                      <div className="space-y-2">
                        {employees.map((emp) => {
                          const isSelected = selectedEmployeeId === emp.id;
                          return (
                            <div
                              key={emp.id}
                              onClick={() => {
                                setSelectedEmployeeId(emp.id);
                                setSelectedTimeSlot(null);
                              }}
                              className={cn(
                                "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                                isSelected
                                  ? "border-violet-500 bg-violet-500/10 shadow-md shadow-violet-900/20"
                                  : "border-stone-800 bg-stone-950/60 hover:border-stone-700"
                              )}
                            >
                              <img src={emp.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} alt={emp.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-white truncate">{emp.name}</h4>
                                <p className="text-[11px] text-stone-400 truncate">{emp.role}</p>
                                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span>{emp.rating || '4.9'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="lg:col-span-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider">
                          {selectedEmployeeId 
                            ? `Available Time Slots for ${employees.find(e => e.id === selectedEmployeeId)?.name}` 
                            : 'Select a staff member'}
                        </h3>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-stone-400">Date</Label>
                          <Input
                            type="date"
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                            className="bg-stone-950 border-stone-800 text-xs h-8 text-white focus:border-violet-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-stone-950/60 rounded-xl border border-stone-800">
                        {timeSlotsList.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.start;
                          return (
                            <div
                              key={slot.start}
                              onClick={() => setSelectedTimeSlot(slot.start)}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all text-center",
                                isSelected
                                  ? "border-violet-500 bg-violet-600 text-white font-extrabold shadow-md shadow-violet-600/30"
                                  : "border-stone-800 bg-stone-900 hover:border-violet-500/40 text-stone-300"
                              )}
                            >
                              <div className="text-xs font-bold">{slot.display}</div>
                              <div className={cn("text-[10px] mt-0.5 font-semibold", isSelected ? "text-violet-200" : "text-emerald-400")}>
                                Available
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-stone-800">
                    <Button variant="outline" onClick={() => setBookingStep(1)} className="text-xs border-stone-700 text-stone-300">
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        if (!selectedEmployeeId || !selectedTimeSlot) {
                          toast.error('Please select both a staff member and a time slot.');
                          return;
                        }
                        setBookingStep(3);
                      }}
                      disabled={!selectedEmployeeId || !selectedTimeSlot}
                      className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-10 px-6 shadow-md shadow-violet-600/30"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirm Your Appointment (Customer Auto-Selected, No Change Modal) */}
            {bookingStep === 3 && (
              <Card className="bg-stone-900/90 border-stone-800 text-white backdrop-blur-md shadow-xl">
                <CardHeader className="pb-3 border-b border-stone-800">
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    Confirm Your Appointment
                  </CardTitle>
                  <CardDescription className="text-stone-400 text-xs">
                    Please review your booking details before confirming
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleBookingSubmit}>
                  <CardContent className="pt-4 space-y-6">
                    {/* Auto-selected Customer Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-400" /> Customer Information
                        </h3>
                        <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Customer Auto-Selected
                        </Badge>
                      </div>

                      <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-bold text-stone-300">Your Full Name *</Label>
                            <Input
                              placeholder="e.g. Ananya Gupta"
                              value={bookingCustomerName}
                              onChange={e => setBookingCustomerName(e.target.value)}
                              className="bg-stone-900 border-stone-800 text-xs h-9 text-white focus:border-violet-500 mt-1"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-bold text-stone-300">Phone Number *</Label>
                            <Input
                              placeholder="+91 98765 43210"
                              value={bookingCustomerPhone}
                              onChange={e => setBookingCustomerPhone(e.target.value)}
                              className="bg-stone-900 border-stone-800 text-xs h-9 text-white focus:border-violet-500 mt-1"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services Summary */}
                    <div>
                      <h3 className="font-bold text-sm text-white mb-2.5">Services Summary</h3>
                      <div className="space-y-2">
                        {selectedServicesData.map((service) => (
                          <div key={service.id} className="flex justify-between items-center p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-xs">
                            <div>
                              <div className="font-bold text-white">{service.name}</div>
                              <div className="text-[11px] text-stone-400">{service.duration} mins</div>
                            </div>
                            <div className="font-extrabold text-violet-400">₹{service.price.toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Staff & Time Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-bold text-sm text-white mb-2.5">Staff Member</h3>
                        <div className="flex items-center gap-3 p-3 bg-stone-950/60 border border-stone-800 rounded-xl">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={selectedEmployeeData?.photo} alt={selectedEmployeeData?.name} />
                            <AvatarFallback>{selectedEmployeeData?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-xs text-white">{selectedEmployeeData?.name}</div>
                            <div className="text-[11px] text-stone-400">{selectedEmployeeData?.role}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-white mb-2.5">Appointment Time</h3>
                        <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center gap-2 text-white font-bold">
                            <Calendar className="h-3.5 w-3.5 text-violet-400" />
                            <span>{bookingDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-violet-400 font-extrabold">
                            <Clock className="h-3.5 w-3.5 text-violet-400" />
                            <span>{selectedTimeSlot}</span>
                          </div>
                          <div className="text-[11px] text-stone-400">
                            Duration: {totalDuration} minutes
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-300">Total Amount</span>
                      <span className="text-xl font-extrabold text-violet-400">₹{totalPrice.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-stone-800">
                      <Button type="button" variant="outline" onClick={() => setBookingStep(2)} className="text-xs border-stone-700 text-stone-300">
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-stone-100 via-amber-50 to-stone-200 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-11 px-8 shadow-lg shadow-violet-600/30"
                      >
                        Confirm Booking
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Order Products (Public Store) */}
        {activeTab === 'store' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Search & Category Header */}
            <div className="bg-stone-900/80 p-3 sm:p-4 rounded-xl border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md backdrop-blur-md">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-violet-400" />
                <Input
                  placeholder="Search products or brands..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-stone-950 border-stone-800 text-xs h-9 text-stone-200 focus:border-violet-500"
                />
              </div>

              {/* Category Pills with Horizontal Scroll on Mobile */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 flex-nowrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer border",
                      selectedCategory === cat 
                        ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 font-extrabold border-violet-400 shadow-md shadow-violet-600/30" 
                        : "bg-stone-800/80 text-stone-300 hover:bg-stone-700/80 border-stone-700/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {paginatedProducts.map(product => {
                const isSaved = savedProductIds.includes(product.id);
                return (
                  <Card key={product.id} className="bg-stone-900/90 border-stone-800 hover:border-violet-500/50 hover:shadow-xl hover:shadow-purple-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg group backdrop-blur-md">
                    <div>
                      <div className="relative h-44 sm:h-48 w-full bg-stone-950 overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop';
                          }}
                        />
                        <Badge className="absolute top-2 left-2 bg-stone-950/80 text-violet-300 text-[10px] border border-violet-500/30 backdrop-blur-xs">
                          {product.brand}
                        </Badge>
                        <Badge className={cn("absolute bottom-2 left-2 text-[10px] font-bold", product.stock > 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                          {product.stock > 0 ? `${product.stock} available` : 'Out of Stock'}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProduct(product.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-950/80 backdrop-blur-xs border border-stone-700/50 text-stone-300 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Heart className={cn("h-4 w-4", isSaved ? "fill-rose-500 text-rose-500" : "")} />
                        </button>
                      </div>

                      <CardContent className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                        <span className="text-[10px] text-violet-400 uppercase font-bold tracking-wider">{product.category}</span>
                        <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{product.description}</p>
                      </CardContent>
                    </div>

                    <CardFooter className="p-3.5 sm:p-4 bg-stone-950/70 border-t border-stone-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Price</span>
                        <span className="text-base sm:text-lg font-extrabold text-violet-400">₹{product.price.toLocaleString('en-IN')}</span>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-8 sm:h-9 px-3 sm:px-3.5 shadow-md shadow-violet-600/25"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-stone-900/80 p-3 sm:p-4 rounded-xl border border-violet-500/20 shadow-md backdrop-blur-md">
                <span className="text-xs text-stone-400 font-medium">
                  Showing Page <span className="font-extrabold text-white">{currentPage}</span> of <span className="font-extrabold text-white">{totalPages}</span> ({filteredProducts.length} total products)
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 text-xs border-stone-700 text-slate-700 hover:bg-violet-100 hover:text-violet-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                          currentPage === page 
                            ? "bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 shadow-md shadow-violet-600/30" 
                            : "bg-stone-800/80 text-stone-400 hover:bg-stone-700 hover:text-white"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 text-xs border-stone-700 text-slate-700 hover:bg-violet-100 hover:text-violet-800 disabled:opacity-40"
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Dedicated Orders & Purchase History Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <Card className="bg-stone-900/90 border-stone-800 text-white backdrop-blur-md shadow-xl">
              <CardHeader className="p-4 sm:p-6 pb-3 border-b border-stone-800">
                <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <Package className="h-5 w-5 text-violet-400" /> My Orders & Purchase History
                </CardTitle>
                <CardDescription className="text-stone-400 text-xs">
                  Track status of orders placed on the salon store.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 space-y-3">
                    <Package className="h-12 w-12 mx-auto text-stone-600 opacity-40" />
                    <p className="text-xs font-semibold">You have not placed any store orders yet.</p>
                    <Button
                      onClick={() => setActiveTab('store')}
                      className="bg-gradient-to-r from-stone-100 to-amber-50 text-neutral-950 text-xs font-bold px-4 h-9 shadow-md shadow-violet-600/30"
                    >
                      Browse Store & Order Products
                    </Button>
                  </div>
                ) : (
                  orders.map(ord => (
                    <div key={ord.id} className="bg-stone-950/80 border border-stone-800 rounded-xl p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-violet-400 font-mono font-bold text-xs">{ord.orderNumber}</span>
                          <p className="text-xs text-stone-400">Placed on {ord.orderDate}</p>
                        </div>
                        <Badge className={cn("text-xs font-bold px-2.5 py-0.5", 
                          ord.orderStatus === 'completed' ? "bg-emerald-600 text-white" :
                          ord.orderStatus === 'processing' ? "bg-blue-600 text-white" : "bg-gradient-to-r from-stone-100 to-amber-50 text-white")}>
                          {ord.orderStatus.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="divide-y divide-stone-800/60">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <img src={item.productImage} alt={item.productName} className="w-8 h-8 rounded object-cover shrink-0" />
                              <span className="truncate">{item.productName} (x{item.quantity})</span>
                            </div>
                            <span className="font-bold shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-stone-800 text-xs gap-1 sm:gap-0">
                        <span className="text-stone-400">Method: {ord.deliveryType === 'delivery' ? 'Home Delivery' : 'Salon Pickup'} ({ord.paymentMethod.toUpperCase()})</span>
                        <span className="text-violet-400 font-extrabold text-sm">Total: ₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Saved Products Wishlist */}
        {activeTab === 'saved' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-stone-900/80 p-4 rounded-xl border border-violet-500/20 flex items-center justify-between shadow-md backdrop-blur-md">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Saved Wishlist
                </h2>
                <p className="text-xs text-stone-400 mt-0.5">Your bookmarked products for quick access.</p>
              </div>
              <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/30 text-xs font-bold px-3 py-1">
                {savedProducts.length} Items
              </Badge>
            </div>

            {savedProducts.length === 0 ? (
              <Card className="bg-stone-900/80 border-stone-800 text-center py-12 text-white backdrop-blur-md">
                <CardContent className="space-y-3">
                  <Heart className="h-12 w-12 text-stone-600 mx-auto opacity-40" />
                  <h3 className="font-bold text-base text-stone-200">No saved items yet</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Browse our salon store and tap the heart icon on any product to save it here for later.
                  </p>
                  <Button
                    onClick={() => setActiveTab('store')}
                    className="bg-gradient-to-r from-stone-100 via-amber-50 to-stone-200 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-9 px-4 mt-2 shadow-md shadow-violet-600/30"
                  >
                    Explore Store Products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {savedProducts.map(product => (
                  <Card key={product.id} className="bg-stone-900/90 border-stone-800 hover:border-violet-500/50 hover:shadow-xl hover:shadow-purple-950/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg group backdrop-blur-md">
                    <div>
                      <div className="relative h-44 sm:h-48 w-full bg-stone-950 overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop';
                          }}
                        />
                        <Badge className="absolute top-2 left-2 bg-stone-950/80 text-violet-300 text-[10px] border border-violet-500/30 backdrop-blur-xs">
                          {product.brand}
                        </Badge>
                        <button
                          onClick={() => toggleSaveProduct(product.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-950/80 backdrop-blur-xs border border-stone-700/50 text-rose-500 fill-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                        </button>
                      </div>

                      <CardContent className="p-3.5 sm:p-4 space-y-1.5 sm:space-y-2">
                        <span className="text-[10px] text-violet-400 uppercase font-bold tracking-wider">{product.category}</span>
                        <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1">{product.name}</h3>
                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{product.description}</p>
                      </CardContent>
                    </div>

                    <CardFooter className="p-3.5 sm:p-4 bg-stone-950/70 border-t border-stone-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Price</span>
                        <span className="text-base sm:text-lg font-extrabold text-violet-400">₹{product.price.toLocaleString('en-IN')}</span>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-8 sm:h-9 px-3 sm:px-3.5 shadow-md shadow-violet-600/25"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Customer Profile (Purely Customer Info & Signup) */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <section className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-900/90 p-4 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="max-w-md">
                <h3 className="text-base font-extrabold text-white">Keep SALONIQ on your phone</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-400">
                  Install the app for quicker bookings, orders, and profile access—no app store needed.
                </p>
              </div>
              <PwaInstallButton className="w-full shrink-0 sm:w-auto" />
            </section>

            {/* Customer Profile Card */}
            {customerProfile ? (
              <Card className="bg-stone-900/90 border-stone-800 text-white backdrop-blur-md shadow-xl">
                <CardHeader className="p-4 sm:p-6 pb-4 border-b border-stone-800 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-2 border-violet-500/50">
                      <AvatarImage src={customerProfile.photo} alt={customerProfile.name} />
                      <AvatarFallback className="bg-violet-600 text-white font-extrabold text-lg">{customerProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                        {customerProfile.name}
                        <Badge className="bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[10px]">
                          {customerProfile.gender}
                        </Badge>
                      </h3>
                      <p className="text-xs text-stone-400 flex flex-wrap items-center gap-3 mt-0.5">
                        <span>📞 {customerProfile.phone}</span>
                        {customerProfile.email && <span>✉️ {customerProfile.email}</span>}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setProfileFormData(customerProfile);
                      setIsProfileModalOpen(true);
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs border-violet-500/40 text-violet-300 hover:bg-violet-950/40"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Profile
                  </Button>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-3">
                  {customerProfile.preferredServices && (
                    <div>
                      <span className="text-[11px] font-bold text-stone-400 block uppercase tracking-wider mb-1">Preferred Services</span>
                      <div className="flex flex-wrap gap-1.5">
                        {customerProfile.preferredServices.split(',').map((svc, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-stone-950 text-violet-300 border border-stone-800 text-xs py-0.5 px-2.5">
                            {svc.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {customerProfile.notes && (
                    <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 text-xs">
                      <span className="text-[11px] font-bold text-stone-400 block uppercase tracking-wider mb-0.5">Notes</span>
                      <p className="text-stone-300 leading-relaxed">{customerProfile.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-stone-900/90 border-stone-800 text-white text-center p-8 backdrop-blur-md shadow-xl">
                <CardContent className="space-y-4 pt-2">
                  <User className="h-14 w-14 text-violet-400 mx-auto opacity-60" />
                  <h3 className="font-extrabold text-xl text-white">Create Your Customer Profile</h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Sign up with your photo and details to manage bookings, track orders, and set your service preferences.
                  </p>
                  <Button
                    onClick={() => {
                      setProfileFormData({
                        name: '',
                        phone: '',
                        email: '',
                        gender: 'Male',
                        preferredServices: '',
                        notes: '',
                        photo: ''
                      });
                      setIsProfileModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-stone-100 via-amber-50 to-stone-200 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-xs h-10 px-6 shadow-md shadow-violet-600/30 mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Sign Up / Add Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation Bar for Mobile Phones */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 flex justify-around items-center py-2 sm:hidden shadow-2xl">
        <button
          onClick={() => setActiveTab('booking')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
            activeTab === 'booking' ? "text-violet-400" : "text-stone-400 hover:text-stone-200"
          )}
        >
          <Calendar className="h-5 w-5" />
          <span>Book</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
            activeTab === 'store' ? "text-violet-400" : "text-stone-400 hover:text-stone-200"
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Store</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            "relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
            activeTab === 'orders' ? "text-violet-400" : "text-stone-400 hover:text-stone-200"
          )}
        >
          <Package className="h-5 w-5" />
          <span>Orders</span>
          {orders.length > 0 && (
            <Badge className="absolute top-0 right-1 bg-violet-600 text-white font-bold text-[9px] h-3.5 min-w-3.5 flex items-center justify-center rounded-full p-0">
              {orders.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={cn(
            "relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
            activeTab === 'saved' ? "text-violet-400" : "text-stone-400 hover:text-stone-200"
          )}
        >
          <Heart className="h-5 w-5" />
          <span>Saved</span>
          {savedProductIds.length > 0 && (
            <Badge className="absolute top-0 right-1 bg-rose-600 text-white font-bold text-[9px] h-3.5 min-w-3.5 flex items-center justify-center rounded-full p-0">
              {savedProductIds.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
            activeTab === 'profile' ? "text-violet-400" : "text-stone-400 hover:text-stone-200"
          )}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Modal: Add New Customer / Sign Up / Edit Profile */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="bg-stone-900 text-white border-stone-800 max-w-md p-5 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center justify-between text-white">
              <span>{customerProfile ? 'Edit Customer Profile' : 'Add New Customer'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit} className="space-y-4 pt-2">
            {/* Customer Photo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Customer Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-500/40 bg-stone-950 flex flex-col items-center justify-center overflow-hidden shrink-0">
                  {profileFormData.photo ? (
                    <img src={profileFormData.photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-stone-400">
                      <User className="h-6 w-6 mx-auto" />
                      <span className="text-[10px]">Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <input 
                    type="file" 
                    accept="image/*"
                    id="customer-photo-upload"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label 
                    htmlFor="customer-photo-upload"
                    className="inline-flex items-center px-3.5 py-2 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-bold cursor-pointer text-white transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-violet-400" /> Upload Photo
                  </label>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Name *</Label>
              <Input
                placeholder="Customer name"
                value={profileFormData.name}
                onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })}
                className="bg-stone-950 border-stone-800 text-xs h-10 text-white focus:border-violet-500"
                required
              />
            </div>

            {/* Phone & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-200">Phone *</Label>
                <Input
                  placeholder="Phone number"
                  value={profileFormData.phone}
                  onChange={e => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                  className="bg-stone-950 border-stone-800 text-xs h-10 text-white focus:border-violet-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-200">Gender</Label>
                <Select value={profileFormData.gender} onValueChange={(val: any) => setProfileFormData({ ...profileFormData, gender: val })}>
                  <SelectTrigger className="bg-stone-950 border-stone-800 text-xs h-10 text-white focus:border-violet-500"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-800 text-white">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Email</Label>
              <Input
                type="email"
                placeholder="Email address"
                value={profileFormData.email}
                onChange={e => setProfileFormData({ ...profileFormData, email: e.target.value })}
                className="bg-stone-950 border-stone-800 text-xs h-10 text-white focus:border-violet-500"
              />
            </div>

            {/* Preferred Services */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Preferred Services</Label>
              <Input
                placeholder="e.g., Haircut, Facial, Massage"
                value={profileFormData.preferredServices}
                onChange={e => setProfileFormData({ ...profileFormData, preferredServices: e.target.value })}
                className="bg-stone-950 border-stone-800 text-xs h-10 text-white focus:border-violet-500"
              />
              <p className="text-[10px] text-stone-400">Separate multiple services with commas</p>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Notes</Label>
              <textarea
                placeholder="Additional notes"
                value={profileFormData.notes}
                onChange={e => setProfileFormData({ ...profileFormData, notes: e.target.value })}
                rows={3}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2.5 text-xs text-white focus:border-violet-500 outline-none"
              />
            </div>

            <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsProfileModalOpen(false)} className="text-stone-400">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold shadow-md shadow-violet-600/30">
                Save Profile Details
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slide-over Shopping Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="bg-stone-900 text-white border-stone-800 w-full sm:max-w-md flex flex-col justify-between p-4 sm:p-6">
          <SheetHeader className="border-b border-stone-800 pb-3 sm:pb-4">
            <SheetTitle className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-violet-400" /> Shopping Cart ({cartCount})
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 divide-y divide-stone-800">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40 text-violet-400" />
                <p className="text-xs font-semibold">Your cart is empty</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-lg object-cover bg-stone-950 border border-stone-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{item.productName}</h4>
                    <p className="text-xs text-violet-400 font-bold mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="flex items-center gap-1 bg-stone-950 border border-stone-800 rounded-md p-1 shrink-0">
                    <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:text-violet-400 text-stone-300">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:text-violet-400 text-stone-300">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <SheetFooter className="border-t border-stone-800 pt-4 flex-col space-y-3">
            <div className="flex items-center justify-between text-sm w-full font-bold">
              <span>Total Amount:</span>
              <span className="text-violet-400 text-lg font-extrabold">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>

            <Button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cartItems.length === 0}
              className="w-full bg-gradient-to-r from-stone-100 via-amber-50 to-stone-200 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold text-sm h-11 shadow-lg shadow-violet-600/30"
            >
              Proceed to Checkout
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Modal: Customer Checkout */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="bg-stone-900 text-white border-stone-800 max-w-md p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-violet-400" /> Checkout & Order Placement
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-xs">
              Complete your contact details to place the order with the salon.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 sm:space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Full Name *</Label>
              <Input
                placeholder="Enter your name"
                value={checkoutData.customerName}
                onChange={e => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                className="bg-stone-950 border-stone-800 text-xs h-9 text-white focus:border-violet-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-200">Phone Number *</Label>
              <Input
                placeholder="+91 98765 43210"
                value={checkoutData.customerPhone}
                onChange={e => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                className="bg-stone-950 border-stone-800 text-xs h-9 text-white focus:border-violet-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-stone-200">Fulfillment</Label>
                <Select value={checkoutData.deliveryType} onValueChange={(val: any) => setCheckoutData({ ...checkoutData, deliveryType: val })}>
                  <SelectTrigger className="bg-stone-950 border-stone-800 text-xs h-9 text-white focus:border-violet-500"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-800 text-white">
                    <SelectItem value="pickup">Salon Pickup</SelectItem>
                    <SelectItem value="delivery">Home Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-stone-200">Payment Option</Label>
                <Select value={checkoutData.paymentMethod} onValueChange={(val: any) => setCheckoutData({ ...checkoutData, paymentMethod: val })}>
                  <SelectTrigger className="bg-stone-950 border-stone-800 text-xs h-9 text-white focus:border-violet-500"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-stone-900 border-stone-800 text-white">
                    <SelectItem value="upi">UPI / GPay</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
                    <SelectItem value="cash">Pay on Delivery/Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {checkoutData.deliveryType === 'delivery' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-stone-200">Delivery Address *</Label>
                <Input
                  placeholder="Street, Building, Flat number, Pune"
                  value={checkoutData.address}
                  onChange={e => setCheckoutData({ ...checkoutData, address: e.target.value })}
                  className="bg-stone-950 border-stone-800 text-xs h-9 text-white focus:border-violet-500"
                  required
                />
              </div>
            )}

            <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center justify-between text-xs font-bold">
              <span className="text-stone-400">Total Payable:</span>
              <span className="text-violet-400 text-base">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>

            <DialogFooter className="pt-2 flex flex-row justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCheckoutOpen(false)} className="text-stone-400">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-gradient-to-r from-stone-100 to-amber-50 hover:from-white hover:to-amber-50 text-neutral-950 font-extrabold shadow-md shadow-violet-600/30">
                Confirm & Place Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
