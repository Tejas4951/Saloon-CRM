import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  CalendarPlus,
  Store, 
  Sparkles, 
  Scissors, 
  Clock, 
  ShoppingBag,
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
  Package,
  Bookmark,
  ClipboardList,
  User,
  Palette,
  Hand,
  Footprints,
  UserRound,
  Droplets,
  Waves,
  Eye,
  Brush,
  Menu,
  X,
  Instagram,
  Facebook,
  Linkedin,
  MessageCircle,
  Download,
  Award,
  LogOut,
  Lock,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { useStore, StoreProduct, StoreOrderItem } from '@/contexts/StoreContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useStaff } from '@/contexts/StaffContext';
import { useCustomers } from '@/contexts/CustomersContext';
import { useServices } from '@/contexts/ServicesContext';
import { useStyles } from '@/contexts/StylesContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSalonLogo } from '@/hooks/useSalonLogo';
import { PwaInstallButton } from '@/components/PwaInstallButton';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ThemeCalendar } from '@/components/ui/calendar';

export interface PublicCustomerProfile {
  name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  preferredServices: string;
  notes: string;
  photo: string;
}

// Default Lumière Style Showcase Items (Styles & Glow)
const STYLES_SHOWCASE = [
  {
    id: 'style-1',
    title: 'Textured Mid Fade',
    stylist: 'Aarav',
    category: 'Haircuts',
    price: 399,
    likes: 245,
    serviceId: '1',
    beforeImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop',
    description: 'Clean mid fade with textured volume on top and crisp outline.'
  },
  {
    id: 'style-2',
    title: 'Caramel Balayage',
    stylist: 'Meera',
    category: 'Colour',
    price: 1299,
    likes: 389,
    serviceId: '2',
    beforeImage: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400&h=400&fit=crop',
    description: 'Seamless hand-painted caramel highlights for natural sun-kissed dimension.'
  },
  {
    id: 'style-3',
    title: 'Sculpted Beard & Pompadour',
    stylist: 'Rohan',
    category: 'Beard',
    price: 648,
    likes: 156,
    serviceId: '6',
    beforeImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
    description: 'Sharp razor edge beard sculpt paired with a classic slick pompadour.'
  },
  {
    id: 'style-4',
    title: 'HydraFacial Glow',
    stylist: 'Ananya',
    category: 'Skin',
    price: 899,
    likes: 412,
    serviceId: '3',
    beforeImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    afterImage: 'https://images.unsplash.com/photo-1512290900673-70020016a2a2?w=400&h=400&fit=crop',
    description: 'Deep pore cleansing and serum infusion for instant glass-skin radiance.'
  }
];

// Booking Services Master Catalog with exact prices
const BOOKING_SERVICES_LIST = [
  { id: '1', name: 'Haircuts & Styles', price: 399, duration: 45, icon: Scissors },
  { id: '2', name: 'Hair Color', price: 1299, duration: 90, icon: Palette },
  { id: '3', name: 'Facial Treatment', price: 899, duration: 60, icon: Sparkles },
  { id: '4', name: 'Manicure', price: 499, duration: 45, icon: Hand },
  { id: '5', name: 'Pedicure', price: 599, duration: 45, icon: Footprints },
  { id: '6', name: 'Beard Grooming', price: 249, duration: 30, icon: UserRound },
  { id: '7', name: 'Hair Spa', price: 999, duration: 60, icon: Droplets },
  { id: '8', name: 'Waxing', price: 699, duration: 45, icon: Waves },
  { id: '9', name: 'Eyebrow Threading', price: 99, duration: 15, icon: Eye },
  { id: '10', name: 'Makeup Application', price: 1999, duration: 60, icon: Brush }
];

export default function PublicPortal() {
  const navigate = useNavigate();
  const { products, orders, placeOrder, updateOrderStatus } = useStore();
  const { appointments, addAppointment, updateAppointment } = useAppointments();
  const { employees } = useStaff();
  const { addCustomer } = useCustomers();
  const { logo } = useSalonLogo();
  const { services } = useServices();
  const { styles: dynamicStyles } = useStyles();

  const { install, installed } = usePwaInstall();

  // Active Tab state: 'styles' | 'booking' | 'store' | 'orders' | 'appointments' | 'profile' | 'saved' | 'director'
  const [activeTab, setActiveTab] = useState<'styles' | 'booking' | 'store' | 'orders' | 'appointments' | 'profile' | 'saved' | 'director'>('styles');
  const [ordersSubTab, setOrdersSubTab] = useState<'current' | 'history'>('current');
  const [appointmentsSubTab, setAppointmentsSubTab] = useState<'current' | 'history'>('current');
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  // Customer Profile State
  const [customerProfile, setCustomerProfile] = useState<PublicCustomerProfile | null>(() => {
    const saved = localStorage.getItem('salon_public_customer_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleConfirmLogout = () => {
    setCustomerProfile(null);
    localStorage.removeItem('salon_public_customer_profile');
    setProfileFormData({
      name: '',
      phone: '',
      email: '',
      gender: 'Male',
      preferredServices: '',
      notes: '',
      photo: ''
    });
    setIsLogoutDialogOpen(false);
    setActiveTab('styles');
    toast.success('Logged out successfully.');
  };

  const [profileFormData, setProfileFormData] = useState<PublicCustomerProfile>({
    name: customerProfile?.name || '',
    phone: customerProfile?.phone || '',
    email: customerProfile?.email || '',
    gender: customerProfile?.gender || 'Male',
    preferredServices: customerProfile?.preferredServices || '',
    notes: customerProfile?.notes || '',
    photo: customerProfile?.photo || ''
  });

  // Store & Cart States
  const [cartItems, setCartItems] = useState<StoreOrderItem[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [productDetailQty, setProductDetailQty] = useState(1);

  // Style Showcase Likes & Bookmarks State
  const [likedStyleIds, setLikedStyleIds] = useState<string[]>(['style-2']);
  const [bookmarkedStyleIds, setBookmarkedStyleIds] = useState<string[]>(['style-2']);

  const toggleLikeStyle = (styleId: string) => {
    setLikedStyleIds(prev => 
      prev.includes(styleId) ? prev.filter(id => id !== styleId) : [...prev, styleId]
    );
  };

  const toggleBookmarkStyle = (styleId: string) => {
    setBookmarkedStyleIds(prev => {
      const isBookmarked = prev.includes(styleId);
      if (isBookmarked) {
        toast.info('Removed from saved styles');
        return prev.filter(id => id !== styleId);
      } else {
        toast.success('Saved to your bookmarks!');
        return [...prev, styleId];
      }
    });
  };

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerName: customerProfile?.name || '',
    customerPhone: customerProfile?.phone || '',
    deliveryType: 'pickup' as 'pickup' | 'delivery',
    address: '',
    paymentMethod: 'upi' as 'upi' | 'card' | 'cash',
    notes: ''
  });

  // Booking Wizard States
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [selectedServices, setSelectedServices] = useState<string[]>(['1']);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(employees[0]?.id || '1');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>('10:00 AM');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingCustomerName, setBookingCustomerName] = useState<string>(customerProfile?.name || '');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState<string>(customerProfile?.phone || '');

  // Inline Sign Up State for Booking
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');

  // Keep customer details synced
  useEffect(() => {
    if (customerProfile) {
      if (customerProfile.name) setBookingCustomerName(customerProfile.name);
      if (customerProfile.phone) setBookingCustomerPhone(customerProfile.phone);
      setCheckoutData(prev => ({
        ...prev,
        customerName: customerProfile.name || prev.customerName,
        customerPhone: customerProfile.phone || prev.customerPhone
      }));
    } else {
      setBookingCustomerName('');
      setBookingCustomerPhone('');
    }
  }, [customerProfile]);

  // Inline Sign Up Handler during booking confirmation step
  const handleInlineSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim() || !signUpPhone.trim()) {
      toast.error('Please enter your full name and phone number to sign up.');
      return;
    }

    const newProfile: PublicCustomerProfile = {
      name: signUpName.trim(),
      phone: signUpPhone.trim(),
      email: signUpEmail.trim(),
      gender: 'Female',
      preferredServices: '',
      notes: '',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
    };

    setCustomerProfile(newProfile);
    localStorage.setItem('salon_public_customer_profile', JSON.stringify(newProfile));

    addCustomer({
      name: newProfile.name,
      phone: newProfile.phone,
      email: newProfile.email,
      gender: 'female',
      preferredServices: [],
      notes: 'Registered via Lumière Appointment Booking',
      photo: newProfile.photo,
      visitCount: 0,
      totalSpent: 0
    });

    toast.success('Account created! Your details are locked for appointment booking.');
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile Handler
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormData.name.trim() || !profileFormData.phone.trim()) {
      toast.error('Please enter your name and phone number.');
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

    addCustomer({
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      email: updatedProfile.email,
      gender: updatedProfile.gender === 'Female' ? 'female' : 'male',
      preferredServices: updatedProfile.preferredServices ? updatedProfile.preferredServices.split(',').map(s => s.trim()) : [],
      notes: updatedProfile.notes ? `Registered via Lumière Portal | Notes: ${updatedProfile.notes}` : 'Registered via Lumière Portal',
      photo: updatedProfile.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      visitCount: 0,
      totalSpent: 0
    });

    toast.success('Profile saved successfully! Details synced with Salon Admin.');
    setIsProfileModalOpen(false);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const allAvailableServices = [
    ...BOOKING_SERVICES_LIST,
    ...services.filter(s => !BOOKING_SERVICES_LIST.some(b => b.id === s.id))
  ];
  const selectedServicesData = allAvailableServices.filter(s => selectedServices.includes(s.id));
  const totalDuration = selectedServicesData.reduce((acc, s) => acc + (s.duration || 30), 0);
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

  // Wishlist Toggle
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

  // Cart Management
  const addToCart = (product: StoreProduct) => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock.');
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

  // Store Checkout
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData.customerName.trim() || !checkoutData.customerPhone.trim()) {
      toast.error('Please enter name and phone number.');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

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

    toast.success(`Order #${createdOrder.orderNumber} placed successfully!`);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveTab('orders');
  };

  // Appointment Submission
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCustomerName.trim() || !bookingCustomerPhone.trim()) {
      toast.error('Please enter your full name and phone number.');
      return;
    }

    if (!selectedEmployeeId || !selectedTimeSlot || selectedServices.length === 0) {
      toast.error('Please complete service, staff, and date/time selections.');
      return;
    }

    const selectedStaffObj = employees.find(e => e.id === selectedEmployeeId);

    const updatedProfile: PublicCustomerProfile = {
      name: bookingCustomerName.trim(),
      phone: bookingCustomerPhone.trim(),
      email: customerProfile?.email || '',
      gender: customerProfile?.gender || 'Female',
      preferredServices: customerProfile?.preferredServices || '',
      notes: customerProfile?.notes || '',
      photo: customerProfile?.photo || ''
    };
    setCustomerProfile(updatedProfile);
    localStorage.setItem('salon_public_customer_profile', JSON.stringify(updatedProfile));

    const savedCustomer = addCustomer({
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

    addAppointment({
      id: `apt-${Date.now()}`,
      customerId: savedCustomer?.id || 'cust-public-online',
      employeeId: selectedEmployeeId || '1',
      serviceIds: selectedServices,
      date: bookingDate,
      time: selectedTimeSlot || '10:00 AM',
      status: 'scheduled',
      total: totalPrice,
      notes: `Public Booking: ${bookingCustomerName.trim()} (${bookingCustomerPhone.trim()})`
    });

    toast.success(`Booking Confirmed! Stylist: ${selectedStaffObj?.name || 'Staff'}, Date: ${bookingDate} at ${selectedTimeSlot}`);
    
    setBookingStep(1);
    setSelectedServices(services[0] ? [services[0].id] : ['1']);
    setSelectedTimeSlot('10:00 AM');
    setAppointmentsSubTab('current');
    setActiveTab('appointments');
  };

  // Products filtering
  const activeProducts = products.filter(p => p.status === 'active');
  const defaultCategories = ['Hair Care', 'Skin Care', 'Nails', 'Styling'];
  const categories = ['All', ...Array.from(new Set([
    ...defaultCategories,
    ...products.map(p => p.category).filter(Boolean)
  ]))];

  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const savedProducts = activeProducts.filter(p => savedProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* Sticky Header Bar - Lumière Salon */}
      <header className="sticky top-0 z-30 bg-background/85 px-4 py-3 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
          <button onClick={() => setActiveTab('styles')} className="flex min-w-0 items-center gap-3 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl neu">
              {logo ? (
                <img src={logo} alt="Salon logo" className="h-full w-full object-contain bg-white rounded-2xl" />
              ) : (
                <Scissors className="h-5 w-5 text-primary" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight">Lumière Salon</span>
              <span className="block truncate text-[11px] text-muted-foreground font-medium">Hair · Skin · Care</span>
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-label="Saved"
              onClick={() => setActiveTab('saved')}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-2xl neu neu-press cursor-pointer",
                activeTab === 'saved' && "neu-inset text-primary"
              )}
            >
              <Bookmark className="h-[18px] w-[18px]" />
            </button>

            <button
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-2xl neu neu-press cursor-pointer"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4.5 w-4.5 place-items-center rounded-full grad-styles text-[10px] font-bold text-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Top Right Hamburger Sidebar Drawer */}
            <Sheet open={isHamburgerOpen} onOpenChange={setIsHamburgerOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open Menu"
                  className="grid h-10 w-10 place-items-center rounded-2xl neu neu-press cursor-pointer text-foreground hover:text-primary transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 bg-background border-l border-border/60 flex flex-col justify-between z-50 shadow-2xl">
                <div className="p-6 space-y-6">
                  <SheetHeader className="text-left border-b border-border/50 pb-4 pr-6">
                    <SheetTitle className="text-base font-extrabold flex items-center gap-2.5 text-foreground">
                      <span className="grid h-9 w-9 place-items-center rounded-2xl grad-styles text-white shadow-xs">
                        <Scissors className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <span className="block leading-tight">Lumière Salon</span>
                        <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">Hair · Skin · Care</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Navigation</p>

                    <button
                      onClick={() => { setActiveTab('orders'); setIsHamburgerOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer",
                        activeTab === 'orders' 
                          ? "grad-styles text-white shadow-xs" 
                          : "bg-muted/40 hover:bg-muted text-foreground border border-border/40"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl",
                          activeTab === 'orders' ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-600"
                        )}>
                          <Package className="h-4 w-4" />
                        </span>
                        My Orders
                      </span>
                      <ChevronRight className={cn("h-4 w-4", activeTab === 'orders' ? "text-white/80" : "text-muted-foreground")} />
                    </button>

                    <button
                      onClick={() => { setActiveTab('appointments'); setIsHamburgerOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer",
                        activeTab === 'appointments' 
                          ? "grad-styles text-white shadow-xs" 
                          : "bg-muted/40 hover:bg-muted text-foreground border border-border/40"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl",
                          activeTab === 'appointments' ? "bg-white/20 text-white" : "bg-sky-500/10 text-sky-600"
                        )}>
                          <Calendar className="h-4 w-4" />
                        </span>
                        My Appointments
                      </span>
                      <ChevronRight className={cn("h-4 w-4", activeTab === 'appointments' ? "text-white/80" : "text-muted-foreground")} />
                    </button>

                    <button
                      onClick={() => { setActiveTab('profile'); setIsHamburgerOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer",
                        activeTab === 'profile' 
                          ? "grad-styles text-white shadow-xs" 
                          : "bg-muted/40 hover:bg-muted text-foreground border border-border/40"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl",
                          activeTab === 'profile' ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-600"
                        )}>
                          <User className="h-4 w-4" />
                        </span>
                        Manage Profile
                      </span>
                      <ChevronRight className={cn("h-4 w-4", activeTab === 'profile' ? "text-white/80" : "text-muted-foreground")} />
                    </button>

                    <button
                      onClick={() => { setActiveTab('director'); setIsHamburgerOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-left transition-all cursor-pointer",
                        activeTab === 'director' 
                          ? "grad-styles text-white shadow-xs" 
                          : "bg-muted/40 hover:bg-muted text-foreground border border-border/40"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn(
                          "grid h-8 w-8 place-items-center rounded-xl",
                          activeTab === 'director' ? "bg-white/20 text-white" : "bg-amber-500/15 text-amber-600"
                        )}>
                          <Crown className="h-4 w-4" />
                        </span>
                        Director
                      </span>
                      <ChevronRight className={cn("h-4 w-4", activeTab === 'director' ? "text-white/80" : "text-muted-foreground")} />
                    </button>
                  </div>
                </div>

                {!installed && (
                  <div className="p-6 border-t border-border/50 bg-muted/20 space-y-2">
                    <Button
                      onClick={async () => {
                        setIsHamburgerOpen(false);
                        const result = await install();
                        if (result === 'accepted') toast.success('SALONIQ App is installing on your device.');
                        if (result === 'dismissed') toast.info('App installation was cancelled.');
                        if (result === 'ios') toast.info('In Safari, tap Share and choose "Add to Home Screen".', { duration: 6000 });
                        if (result === 'unavailable') toast.info('Open this page in Chrome or Edge to install.', { duration: 5000 });
                      }}
                      className="w-full h-11 rounded-2xl grad-styles text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                    >
                      <Download className="h-4 w-4" /> Install App
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">Install app for 1-tap bookings & offline access.</p>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-lg px-4 pt-3">
        {/* TAB 1: STYLES SHOWCASE (Home) */}
        {activeTab === 'styles' && (
          <div className="space-y-4">
            {(dynamicStyles && dynamicStyles.length > 0 ? dynamicStyles : STYLES_SHOWCASE).map((style) => {
              const isLiked = likedStyleIds.includes(style.id);
              const isBookmarked = bookmarkedStyleIds.includes(style.id);
              const currentLikes = style.likes + (isLiked ? 1 : 0);
              const isSingle = style.imageMode === 'single' || !style.beforeImage || style.beforeImage === style.afterImage;

              return (
                <div 
                  key={style.id} 
                  className="rounded-[32px] p-4 bg-card/90 dark:bg-card border border-border/40 shadow-md space-y-3.5 hover:shadow-lg transition-all"
                >
                  {/* Single Image or Combined Before & After Image Box Container */}
                  {isSingle ? (
                    <div className="relative rounded-[22px] overflow-hidden bg-black/5 aspect-[4/3] sm:aspect-[16/11]">
                      <img 
                        src={style.afterImage || style.beforeImage} 
                        alt={style.title} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-[22px] overflow-hidden bg-black/5 aspect-[4/3] sm:aspect-[16/11] grid grid-cols-2 gap-1 p-1">
                      <div className="relative h-full w-full overflow-hidden rounded-l-[18px]">
                        <img 
                          src={style.beforeImage} 
                          alt={`${style.title} before`} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        />
                        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                          <span className="px-3.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-[11px] font-serif text-white/95 shadow-sm tracking-wide">
                            Before
                          </span>
                        </div>
                      </div>

                      <div className="relative h-full w-full overflow-hidden rounded-r-[18px]">
                        <img 
                          src={style.afterImage} 
                          alt={`${style.title} after`} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                        />
                        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                          <span className="px-3.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-[11px] font-serif text-white/95 shadow-sm tracking-wide">
                            After
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Meta Info & Actions */}
                  <div className="flex items-center justify-between pt-1 px-1">
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-foreground">{style.title}</h3>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        {style.stylist ? `by ${style.stylist} · ${style.category}` : style.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleLikeStyle(style.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                          isLiked 
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/30" 
                            : "bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-rose-500 text-rose-500")} />
                        <span>{currentLikes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmarkStyle(style.id)}
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full text-xs transition-all cursor-pointer",
                          isBookmarked 
                            ? "bg-primary/10 text-primary border border-primary/30" 
                            : "bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary text-primary")} />
                      </button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedServices([style.serviceId]);
                          setBookingStep(1);
                          setActiveTab('booking');
                        }}
                        className="rounded-full text-xs font-bold grad-styles text-white px-3.5 h-9 shadow-sm hover:opacity-95 cursor-pointer ml-1"
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: BOOKING WIZARD */}
        {activeTab === 'booking' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu">
              <h1 className="text-xl font-bold tracking-tight">Book your visit</h1>
              <p className="mt-1 text-xs text-muted-foreground">Select one or more services to reserve your slot.</p>
            </section>

            {/* Step 1: Pick Services */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {BOOKING_SERVICES_LIST.map((srv) => {
                    const isSelected = selectedServices.includes(srv.id);
                    const SrvIcon = srv.icon;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => handleServiceToggle(srv.id)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 rounded-3xl px-2 py-4 text-center neu-press cursor-pointer transition-all",
                          isSelected ? "neu-inset border-primary/50 text-primary" : "neu"
                        )}
                      >
                        <span className={cn(
                          "grid h-11 w-11 place-items-center rounded-2xl neu-sm transition-colors",
                          isSelected ? "grad-styles text-white" : "text-primary"
                        )}>
                          <SrvIcon className="h-5 w-5" />
                        </span>
                        <span className="text-[11px] font-medium leading-tight">{srv.name}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">₹{srv.price}</span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 h-4 w-4 rounded-full grad-styles grid place-items-center text-white text-[9px]">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedServices.length > 0 && (
                  <div className="sticky bottom-28 z-30 rounded-2xl neu p-3.5 flex items-center justify-between shadow-xl bg-background/95 backdrop-blur-xl border border-white/40 dark:border-white/10">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} selected</p>
                      <p className="text-base font-extrabold text-foreground">Total: ₹{totalPrice}</p>
                    </div>
                    <Button
                      onClick={() => setBookingStep(2)}
                      className="rounded-2xl grad-styles text-white font-bold text-xs px-4 py-2.5 shadow-md cursor-pointer"
                    >
                      Select Time & Staff →
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Staff & Date/Time */}
            {bookingStep === 2 && (
              <div className="space-y-4">
                <div className="rounded-[24px] p-4 neu space-y-3">
                  <h3 className="text-sm font-bold flex items-center justify-between">
                    <span>1. Select Stylist</span>
                    <button onClick={() => setBookingStep(1)} className="text-xs text-primary font-semibold">← Change Services</button>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {employees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={cn(
                          "p-3 rounded-2xl text-left border flex items-center gap-2.5 transition-all cursor-pointer",
                          selectedEmployeeId === emp.id ? "neu-inset border-primary bg-primary/5" : "neu"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.photo} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{emp.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{emp.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] p-4 neu space-y-3">
                  <h3 className="text-sm font-bold">2. Select Date & Time</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-bold neu rounded-2xl h-11 text-xs border border-border/50 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {bookingDate ? (
                            new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          ) : (
                            <span>Select Date</span>
                          )}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-semibold">Change Date</Badge>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 neu rounded-[28px] bg-background/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl z-50" align="start">
                      <ThemeCalendar
                        mode="single"
                        selected={bookingDate ? new Date(bookingDate + 'T00:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            setBookingDate(`${yyyy}-${mm}-${dd}`);
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-2"
                        classNames={{
                          day_selected: "grad-styles text-white hover:opacity-90 focus:opacity-90 font-bold rounded-xl shadow-xs",
                          day_today: "neu text-primary font-bold rounded-xl",
                          day: "h-9 w-9 p-0 font-semibold text-xs rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {timeSlotsList.map((slot) => (
                      <button
                        key={slot.display}
                        onClick={() => setSelectedTimeSlot(slot.display)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center",
                          selectedTimeSlot === slot.display ? "grad-styles text-white shadow-xs border-transparent" : "neu text-muted-foreground"
                        )}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-28 z-30 rounded-2xl neu p-3.5 flex items-center justify-between shadow-xl bg-background/95 backdrop-blur-xl border border-white/40 dark:border-white/10">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Selected: {selectedEmployeeData?.name || 'Staff'}</p>
                    <p className="text-xs font-bold text-foreground">{selectedTimeSlot || 'Select slot'}</p>
                  </div>
                  <Button
                    onClick={() => setBookingStep(3)}
                    disabled={!selectedTimeSlot || !selectedEmployeeId}
                    className="rounded-2xl grad-styles text-white font-bold text-xs px-5 py-2.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Continue to Confirm →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Customer Details & Confirm */}
            {bookingStep === 3 && (
              Boolean(customerProfile?.name && customerProfile?.phone) ? (
                /* Logged-In State: Details are LOCKED & non-editable */
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="rounded-[24px] p-4 neu space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-bold">Your Details (Logged In)</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 flex items-center gap-1 font-semibold">
                        <Lock className="h-3 w-3" /> Account Locked
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Appointment will be automatically booked using your logged-in account credentials.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-semibold">Full Name</Label>
                        <Input
                          value={bookingCustomerName}
                          readOnly
                          disabled
                          className="neu rounded-xl text-xs h-10 mt-1 bg-muted/20 cursor-not-allowed font-bold opacity-90 text-foreground"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Phone Number</Label>
                        <Input
                          value={bookingCustomerPhone}
                          readOnly
                          disabled
                          className="neu rounded-xl text-xs h-10 mt-1 bg-muted/20 cursor-not-allowed font-bold opacity-90 text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] p-4 neu space-y-2 text-xs">
                    <h3 className="font-bold text-sm border-b pb-2">Booking Summary</h3>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Date & Time:</span>
                      <span className="font-bold text-foreground">{bookingDate} at {selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Stylist:</span>
                      <span className="font-bold text-foreground">{selectedEmployeeData?.name || 'Selected Staff'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Services:</span>
                      <span className="font-bold text-foreground truncate max-w-[180px]">{selectedServicesData.map(s => s.name).join(', ')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t text-sm font-extrabold text-foreground">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{totalPrice}</span>
                    </div>
                  </div>

                  <div className="sticky bottom-28 z-30 rounded-2xl neu p-3 flex gap-2 shadow-xl bg-background/95 backdrop-blur-xl border border-white/40 dark:border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBookingStep(2)}
                      className="flex-1 rounded-2xl neu text-xs font-bold h-11 cursor-pointer"
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-2 rounded-2xl grad-styles text-white font-bold text-sm h-11 shadow-md cursor-pointer"
                    >
                      Confirm Booking ✓
                    </Button>
                  </div>
                </form>
              ) : (
                /* Unauthenticated State: Show Sign Up Option */
                <div className="space-y-4">
                  <div className="rounded-[28px] p-5 neu space-y-4">
                    <div className="flex items-center gap-3 border-b pb-3">
                      <div className="h-10 w-10 rounded-2xl grad-styles grid place-items-center text-white shadow-xs">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold tracking-tight">Sign Up to Complete Appointment</h3>
                        <p className="text-[11px] text-muted-foreground">Enter your details to create an account and confirm your booking slot.</p>
                      </div>
                    </div>

                    <form onSubmit={handleInlineSignUp} className="space-y-3 text-xs">
                      <div>
                        <Label className="text-xs font-semibold">Full Name *</Label>
                        <Input
                          value={signUpName}
                          onChange={(e) => setSignUpName(e.target.value)}
                          placeholder="e.g. Ananya Gupta"
                          className="neu rounded-xl text-xs h-10 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Phone Number *</Label>
                        <Input
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="neu rounded-xl text-xs h-10 mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Email Address (Optional)</Label>
                        <Input
                          type="email"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="ananya@example.com"
                          className="neu rounded-xl text-xs h-10 mt-1"
                        />
                      </div>

                      <div className="sticky bottom-28 z-30 rounded-2xl neu p-3 flex gap-2 shadow-xl bg-background/95 backdrop-blur-xl border border-white/40 dark:border-white/10 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setBookingStep(2)}
                          className="flex-1 rounded-2xl neu text-xs font-bold h-11 cursor-pointer"
                        >
                          ← Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-2 rounded-2xl grad-styles text-white font-bold text-xs h-11 shadow-md cursor-pointer"
                        >
                          Sign Up & Proceed →
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="rounded-[24px] p-4 neu space-y-2 text-xs opacity-80">
                    <h3 className="font-bold text-sm border-b pb-2">Booking Summary</h3>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Date & Time:</span>
                      <span className="font-bold text-foreground">{bookingDate} at {selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Stylist:</span>
                      <span className="font-bold text-foreground">{selectedEmployeeData?.name || 'Selected Staff'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Services:</span>
                      <span className="font-bold text-foreground truncate max-w-[180px]">{selectedServicesData.map(s => s.name).join(', ')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t text-sm font-extrabold text-foreground">
                      <span>Total Amount:</span>
                      <span className="text-primary">₹{totalPrice}</span>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 3: STORE */}
        {activeTab === 'store' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu">
              <h1 className="text-xl font-bold tracking-tight">Salon Care at Home</h1>
              <p className="mt-1 text-xs text-muted-foreground">Professional products recommended by our hair & skin stylists.</p>
            </section>

            {/* Search & Category Pills */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hair serum, shampoo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 neu rounded-2xl text-xs h-10"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      selectedCategory === cat ? "grad-styles text-white shadow-xs" : "neu text-muted-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const isSaved = savedProductIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductDetailQty(1);
                    }}
                    className="rounded-[24px] p-3 neu space-y-2 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden aspect-square neu-sm">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveProduct(product.id);
                          }}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-xs grid place-items-center text-white"
                        >
                          <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-rose-500 text-rose-500")} />
                        </button>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold">{product.brand}</span>
                        <h4 className="text-xs font-bold line-clamp-1">{product.name}</h4>
                        <div className="flex items-center gap-1 text-[11px] font-bold mt-1">
                          <span className="text-amber-500">★ 4.8</span>
                          <span className="text-foreground ml-auto">₹{product.price}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full rounded-xl grad-styles text-white text-xs font-bold h-8 shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu">
              <h1 className="text-xl font-bold tracking-tight">My Orders</h1>
              <p className="mt-1 text-xs text-muted-foreground">Track product purchases & order deliveries.</p>
            </section>

            {/* Subtabs Toggle */}
            <div className="grid grid-cols-2 p-1 neu rounded-2xl gap-1">
              <button
                onClick={() => setOrdersSubTab('current')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  ordersSubTab === 'current' ? "grad-styles text-white shadow-xs" : "text-muted-foreground"
                )}
              >
                Current
              </button>
              <button
                onClick={() => setOrdersSubTab('history')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  ordersSubTab === 'history' ? "grad-styles text-white shadow-xs" : "text-muted-foreground"
                )}
              >
                History
              </button>
            </div>

            <div className="space-y-3">
              {(() => {
                const filteredOrders = orders.filter(o => 
                  ordersSubTab === 'current' 
                    ? (o.orderStatus === 'pending' || o.orderStatus === 'processing')
                    : (o.orderStatus === 'completed' || o.orderStatus === 'cancelled')
                );

                if (filteredOrders.length === 0) {
                  return (
                    <div className="text-center p-8 neu rounded-[28px] space-y-2">
                      <Package className="h-10 w-10 mx-auto text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground font-medium">
                        {ordersSubTab === 'current' ? 'No active orders right now' : 'No order history found'}
                      </p>
                      {ordersSubTab === 'current' && (
                        <Button size="sm" onClick={() => setActiveTab('store')} className="grad-styles text-white font-bold rounded-2xl text-xs mt-2">
                          Explore Store Products
                        </Button>
                      )}
                    </div>
                  );
                }

                return filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-[24px] p-4 neu space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-foreground">Order #{order.orderNumber}</span>
                      <Badge className={cn(
                        "capitalize font-bold border-none",
                        order.orderStatus === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                        order.orderStatus === 'cancelled' ? "bg-rose-500/10 text-rose-600" :
                        "bg-amber-500/10 text-amber-600"
                      )}>
                        {order.orderStatus}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}</p>
                    <div className="flex justify-between items-center pt-1 font-extrabold text-sm">
                      <span>Total: ₹{order.totalAmount}</span>
                      <span className="text-[11px] text-muted-foreground font-normal">{order.orderDate}</span>
                    </div>
                    {ordersSubTab === 'current' && (
                      <div className="pt-2 border-t flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to cancel Order #${order.orderNumber}?`)) {
                              updateOrderStatus(order.id, 'cancelled');
                              toast.success(`Order #${order.orderNumber} has been cancelled.`);
                            }
                          }}
                          className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30 h-8 cursor-pointer"
                        >
                          Cancel Order
                        </Button>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* TAB 5: MY APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu">
              <h1 className="text-xl font-bold tracking-tight">My Appointments</h1>
              <p className="mt-1 text-xs text-muted-foreground">Manage your upcoming visits & appointment history.</p>
            </section>

            {/* Subtabs Toggle */}
            <div className="grid grid-cols-2 p-1 neu rounded-2xl gap-1">
              <button
                onClick={() => setAppointmentsSubTab('current')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  appointmentsSubTab === 'current' ? "grad-styles text-white shadow-xs" : "text-muted-foreground"
                )}
              >
                Current
              </button>
              <button
                onClick={() => setAppointmentsSubTab('history')}
                className={cn(
                  "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  appointmentsSubTab === 'history' ? "grad-styles text-white shadow-xs" : "text-muted-foreground"
                )}
              >
                History
              </button>
            </div>

            <div className="space-y-3">
              {(() => {
                const filteredAppointments = appointments.filter(a => 
                  appointmentsSubTab === 'current'
                    ? (a.status === 'scheduled')
                    : (a.status === 'completed' || a.status === 'cancelled')
                );

                if (filteredAppointments.length === 0) {
                  return (
                    <div className="text-center p-8 neu rounded-[28px] space-y-2">
                      <Calendar className="h-10 w-10 mx-auto text-muted-foreground/60" />
                      <p className="text-xs text-muted-foreground font-medium">
                        {appointmentsSubTab === 'current' ? 'No upcoming appointments scheduled' : 'No appointment history found'}
                      </p>
                      {appointmentsSubTab === 'current' && (
                        <Button size="sm" onClick={() => { setBookingStep(1); setActiveTab('booking'); }} className="grad-styles text-white font-bold rounded-2xl text-xs mt-2">
                          Book an Appointment
                        </Button>
                      )}
                    </div>
                  );
                }

                return filteredAppointments.map((apt) => {
                  const emp = employees.find(e => e.id === apt.employeeId);
                  const serviceNames = apt.serviceIds
                    .map(id => services.find(s => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <div key={apt.id} className="rounded-[24px] p-4 neu space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {apt.date} at {apt.time}
                        </span>
                        <Badge className={cn(
                          "capitalize font-bold border-none",
                          apt.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                          apt.status === 'cancelled' ? "bg-rose-500/10 text-rose-600" :
                          "bg-sky-500/10 text-sky-600"
                        )}>
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Stylist: <strong className="text-foreground">{emp?.name || 'Staff Stylist'}</strong></span>
                        <span>Services: <strong className="text-foreground">{serviceNames || 'Salon Service'}</strong></span>
                      </div>
                      <div className="flex justify-between items-center pt-1 font-extrabold text-sm">
                        <span>Total Amount: ₹{apt.total}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">{apt.notes}</span>
                      </div>
                      {appointmentsSubTab === 'current' && (
                        <div className="pt-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel your appointment on ${apt.date} at ${apt.time}?`)) {
                                updateAppointment(apt.id, { status: 'cancelled' });
                                toast.success(`Appointment on ${apt.date} at ${apt.time} has been cancelled.`);
                              }
                            }}
                            className="rounded-xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/30 h-8 cursor-pointer"
                          >
                            Cancel Appointment
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* TAB 6: SAVED WISHLIST */}
        {activeTab === 'saved' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu">
              <h1 className="text-xl font-bold tracking-tight">Your Saved Wishlist</h1>
              <p className="mt-1 text-xs text-muted-foreground">Items & styles you saved for later.</p>
            </section>

            {savedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {savedProducts.map((product) => (
                  <div key={product.id} className="rounded-[24px] p-3 neu space-y-2">
                    <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-2xl" />
                    <h4 className="text-xs font-bold line-clamp-1">{product.name}</h4>
                    <p className="text-xs font-extrabold">₹{product.price}</p>
                    <Button size="sm" onClick={() => addToCart(product)} className="w-full grad-styles text-white rounded-xl text-xs font-bold h-8">
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 neu rounded-[28px] space-y-2">
                <Bookmark className="h-10 w-10 mx-auto text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground font-medium">No saved items in your wishlist</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={customerProfile?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {customerProfile?.name ? customerProfile.name.charAt(0) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold truncate">{customerProfile?.name || 'Guest Customer'}</h2>
                <p className="text-xs text-muted-foreground">{customerProfile?.phone || '+91 Contact not added'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{customerProfile?.email || 'email@example.com'}</p>
              </div>
              <Button size="sm" onClick={() => setIsProfileModalOpen(true)} className="rounded-2xl neu text-xs font-bold">
                Edit
              </Button>
            </section>

            <div className="space-y-2.5">
              <button onClick={() => setActiveTab('saved')} className="w-full p-4 rounded-2xl neu flex items-center justify-between text-xs font-bold cursor-pointer hover:bg-muted/30 transition-all">
                <span className="flex items-center gap-2.5"><Bookmark className="h-4 w-4 text-primary" /> Saved Wishlist</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button onClick={() => { setActiveTab('orders'); setOrdersSubTab('current'); }} className="w-full p-4 rounded-2xl neu flex items-center justify-between text-xs font-bold cursor-pointer hover:bg-muted/30 transition-all">
                <span className="flex items-center gap-2.5"><Package className="h-4 w-4 text-primary" /> My Orders</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button onClick={() => { setActiveTab('appointments'); setAppointmentsSubTab('current'); }} className="w-full p-4 rounded-2xl neu flex items-center justify-between text-xs font-bold cursor-pointer hover:bg-muted/30 transition-all">
                <span className="flex items-center gap-2.5"><Calendar className="h-4 w-4 text-primary" /> My Appointments</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button 
                onClick={() => setIsLogoutDialogOpen(true)} 
                className="w-full p-4 rounded-2xl neu flex items-center justify-between text-xs font-bold cursor-pointer hover:bg-rose-500/10 text-rose-600 transition-all mt-4 border border-rose-500/20"
              >
                <span className="flex items-center gap-2.5"><LogOut className="h-4 w-4 text-rose-500" /> Log Out</span>
                <ChevronRight className="h-4 w-4 text-rose-500/60" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: DIRECTOR */}
        {activeTab === 'director' && (
          <div className="space-y-5">
            <section className="rounded-[28px] p-5 neu space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h1 className="text-xl font-bold tracking-tight">Salon Director & Leadership</h1>
              </div>
              <p className="text-xs text-muted-foreground">Meet the visionary behind Lumière Salon's luxury grooming standard.</p>
            </section>

            <div className="rounded-[28px] p-6 neu space-y-5 text-center">
              {/* Director Photo Portrait */}
              <div className="relative mx-auto w-28 h-28 rounded-full overflow-hidden neu-sm border-2 border-primary/20 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"
                  alt="Salon Director"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-extrabold tracking-tight">Rohit Sharma</h2>
                <p className="text-xs font-semibold text-primary">Founder & Creative Director</p>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-2">
                  <Award className="h-3.5 w-3.5" /> 12+ Years Hair & Beauty Excellence
                </div>
              </div>

              <div className="p-4 rounded-2xl neu-inset text-xs text-muted-foreground leading-relaxed text-left space-y-2">
                <p className="font-semibold text-foreground">"Luxury styling is about enhancing your personal identity with confidence."</p>
                <p>
                  Rohit founded Lumière Salon with a vision to merge international precision styling with organic skin therapy.
                  Trained at top European hair academies, he leads our team in crafting bespoke cuts, balayage coloring, and restorative spa treatments.
                </p>
              </div>

              {/* Direct Social Media & Contact Links */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connect with Director</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-rose-500 transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <Instagram className="h-5 w-5 text-rose-500" />
                    <span>Instagram</span>
                  </a>

                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-emerald-500 transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-blue-600 transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <span>Facebook</span>
                  </a>

                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-sky-600 transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <Linkedin className="h-5 w-5 text-sky-600" />
                    <span>LinkedIn</span>
                  </a>

                  <a
                    href="tel:+919876543210"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-primary transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <Phone className="h-5 w-5 text-primary" />
                    <span>Call</span>
                  </a>

                  <a
                    href="mailto:director@lumieresalon.com"
                    className="flex flex-col items-center justify-center p-3 rounded-2xl neu hover:text-indigo-500 transition-all cursor-pointer text-xs font-semibold gap-1.5"
                  >
                    <Mail className="h-5 w-5 text-indigo-500" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-4 flex flex-col justify-between">
          <SheetHeader className="border-b pb-3">
            <SheetTitle className="text-base font-bold flex items-center justify-between">
              <span>Your Shopping Cart ({cartCount})</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-2.5 rounded-2xl neu text-xs">
                  <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.productName}</p>
                    <p className="text-muted-foreground font-semibold">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-1.5 neu-inset rounded-xl p-1">
                    <button onClick={() => updateCartQty(item.productId, -1)} className="p-1"><Minus className="h-3 w-3" /></button>
                    <span className="font-bold px-1">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2 text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-xs font-medium">Your cart is currently empty</p>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <SheetFooter className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm font-extrabold w-full">
                <span>Subtotal:</span>
                <span className="text-primary">₹{cartTotal}</span>
              </div>
              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full rounded-2xl grad-styles text-white font-bold text-sm py-3"
              >
                Proceed to Checkout →
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-5 neu">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Store Order Checkout</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Confirm order details & fulfillment method.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckoutSubmit} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs font-semibold">Your Full Name</Label>
              <Input
                value={checkoutData.customerName}
                onChange={(e) => setCheckoutData(prev => ({ ...prev, customerName: e.target.value }))}
                className="neu rounded-xl text-xs h-9 mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Contact Phone</Label>
              <Input
                value={checkoutData.customerPhone}
                onChange={(e) => setCheckoutData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="neu rounded-xl text-xs h-9 mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Fulfillment</Label>
              <Select
                value={checkoutData.deliveryType}
                onValueChange={(val: 'pickup' | 'delivery') => setCheckoutData(prev => ({ ...prev, deliveryType: val }))}
              >
                <SelectTrigger className="neu rounded-xl text-xs h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Store Pickup (Koregaon Park Branch)</SelectItem>
                  <SelectItem value="delivery">Home Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {checkoutData.deliveryType === 'delivery' && (
              <div>
                <Label className="text-xs font-semibold">Delivery Address</Label>
                <Input
                  value={checkoutData.address}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street, Landmark, City"
                  className="neu rounded-xl text-xs h-9 mt-1"
                  required
                />
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full grad-styles text-white font-bold rounded-2xl h-10">
                Place Order (₹{cartTotal})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md rounded-[28px] p-5 neu">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Customer Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Details are automatically synced with salon bookings & orders.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs font-semibold">Name</Label>
              <Input
                value={profileFormData.name}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                className="neu rounded-xl text-xs h-9 mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Phone</Label>
              <Input
                value={profileFormData.phone}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="neu rounded-xl text-xs h-9 mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                value={profileFormData.email}
                onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                className="neu rounded-xl text-xs h-9 mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full grad-styles text-white font-bold rounded-2xl h-10">
                Save Profile ✓
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-[28px] p-6 neu space-y-3 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 grid place-items-center text-rose-500 mb-1">
            <LogOut className="h-6 w-6" />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-base font-bold text-foreground">Log Out Confirmation</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to log out? Your saved details and preferences will be cleared from this device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="w-full rounded-2xl neu text-xs font-bold h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLogout}
              className="w-full rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 shadow-md cursor-pointer"
            >
              Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Modal */}
      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-xs sm:max-w-md rounded-[28px] p-0 bg-background border border-border/60 shadow-2xl overflow-hidden z-50">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name || 'Product Details'}</DialogTitle>
            <DialogDescription>{selectedProduct?.description || 'Product details, formula specifications, and purchasing options.'}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Image Banner */}
              <div className="relative aspect-4/3 w-full bg-muted overflow-hidden">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
                {/* Bookmark button positioned on top-left to avoid collision with modal close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveProduct(selectedProduct.id);
                  }}
                  className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/60 backdrop-blur-md grid place-items-center text-white cursor-pointer shadow-md hover:bg-black/80 transition-colors"
                >
                  <Bookmark
                    className={cn(
                      "h-4 w-4",
                      savedProductIds.includes(selectedProduct.id) && "fill-rose-500 text-rose-500"
                    )}
                  />
                </button>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  <Badge className="bg-black/70 backdrop-blur-md text-white border-none text-[10px] font-bold">
                    {selectedProduct.brand}
                  </Badge>
                  <Badge className="grad-styles text-white border-none text-[10px] font-bold shadow-xs">
                    {selectedProduct.category}
                  </Badge>
                </div>
              </div>

              {/* Product Details Content */}
              <div className="px-5 space-y-3">
                <div>
                  <h2 className="text-base font-extrabold text-foreground leading-snug">{selectedProduct.name}</h2>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xl font-extrabold text-primary">₹{selectedProduct.price}</span>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                      ★ 4.8 <span className="text-muted-foreground font-normal">(42 reviews)</span>
                    </span>
                  </div>
                </div>

                {/* Stock Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold border-none",
                      selectedProduct.stock > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    )}
                  >
                    {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock} units left)` : 'Out of Stock'}
                  </Badge>
                </div>

                {/* Description Box */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 space-y-1 text-xs">
                  <p className="font-bold text-foreground">Product Details</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedProduct.description || 'Professional salon-grade formula for daily haircare and skin nourishment.'}
                  </p>
                </div>

                {/* Stylist Tip */}
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Stylist Tip:</strong> Recommended by Lumière Senior Stylists for color protection & deep hair recovery.</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border/50 bg-muted/30 flex items-center gap-3">
                <div className="flex items-center gap-1 bg-background border border-border/50 rounded-2xl p-1 shrink-0">
                  <button
                    onClick={() => setProductDetailQty(prev => Math.max(1, prev - 1))}
                    className="h-8 w-8 grid place-items-center text-foreground font-bold hover:bg-muted rounded-xl cursor-pointer transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-bold text-xs px-2 text-foreground">{productDetailQty}</span>
                  <button
                    onClick={() => setProductDetailQty(prev => Math.min(selectedProduct.stock || 99, prev + 1))}
                    className="h-8 w-8 grid place-items-center text-foreground font-bold hover:bg-muted rounded-xl cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => {
                    for (let i = 0; i < productDetailQty; i++) {
                      addToCart(selectedProduct);
                    }
                    setSelectedProduct(null);
                    toast.success(`Added ${productDetailQty}x ${selectedProduct.name} to cart.`);
                  }}
                  className="flex-1 h-11 rounded-2xl grad-styles text-white font-bold text-xs shadow-md cursor-pointer hover:opacity-95"
                >
                  Add to Cart (₹{selectedProduct.price * productDetailQty})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* FIXED BOTTOM NAVIGATION BAR (LOVABLE 5-ITEM NEUMORPHIC NAV WITH 90% BLUR) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none">
        <div className="mx-auto flex max-w-lg items-end justify-between rounded-[28px] bg-background/85 backdrop-blur-xl px-3 py-2 neu shadow-2xl border border-white/40 dark:border-white/10 pointer-events-auto">
          {/* Book */}
          <button
            onClick={() => {
              setBookingStep(1);
              setActiveTab('booking');
            }}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-2xl py-2 cursor-pointer transition-all",
              activeTab === 'booking' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors", activeTab === 'booking' ? "neu-inset text-primary" : "")}>
              <CalendarPlus className="h-[18px] w-[18px]" />
            </span>
            <span className={cn("text-[10px] font-semibold", activeTab === 'booking' ? "text-primary font-bold" : "text-muted-foreground")}>Book</span>
          </button>

          {/* Store */}
          <button
            onClick={() => setActiveTab('store')}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-2xl py-2 cursor-pointer transition-all",
              activeTab === 'store' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors", activeTab === 'store' ? "neu-inset text-primary" : "")}>
              <Store className="h-[18px] w-[18px]" />
            </span>
            <span className={cn("text-[10px] font-semibold", activeTab === 'store' ? "text-primary font-bold" : "text-muted-foreground")}>Store</span>
          </button>

          {/* Floating Center Button: Styles */}
          <button
            onClick={() => setActiveTab('styles')}
            className="-mt-7 flex w-16 flex-col items-center gap-1 cursor-pointer"
          >
            <span
              className="grid h-14 w-14 place-items-center rounded-3xl grad-styles text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 10px 22px rgba(236, 72, 153, 0.4)' }}
            >
              <Sparkles className="h-6 w-6" />
            </span>
            <span className={cn("text-[10px] font-bold", activeTab === 'styles' ? "text-primary font-extrabold" : "text-muted-foreground")}>Styles</span>
          </button>

          {/* Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-2xl py-2 cursor-pointer transition-all",
              activeTab === 'orders' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors", activeTab === 'orders' ? "neu-inset text-primary" : "")}>
              <ClipboardList className="h-[18px] w-[18px]" />
            </span>
            <span className={cn("text-[10px] font-semibold", activeTab === 'orders' ? "text-primary font-bold" : "text-muted-foreground")}>Orders</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex w-16 flex-col items-center gap-1 rounded-2xl py-2 cursor-pointer transition-all",
              activeTab === 'profile' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-xl transition-colors", activeTab === 'profile' ? "neu-inset text-primary" : "")}>
              <User className="h-[18px] w-[18px]" />
            </span>
            <span className={cn("text-[10px] font-semibold", activeTab === 'profile' ? "text-primary font-bold" : "text-muted-foreground")}>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
