import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, ChevronDown, ChevronRight, Store, Scissors, UserPlus, LayoutDashboard, CalendarDays, DollarSign as DollarSignIcon, LogOut, Menu, X, Activity, LineChart, CreditCard, Package, PackagePlus, PackageCheck, ListChecks, Package2 } from 'lucide-react';
import { UserRegistrationForm } from '@/components/admin/UserRegistrationForm';
import { ShopSelector } from '@/components/admin/ShopSelector';
import { ShopRegistrationForm } from '@/components/admin/ShopRegistrationForm';
import { ServiceRegistrationForm } from '@/components/admin/ServiceRegistrationForm';
import { ShopsTable } from '@/components/admin/ShopsTable';
import { UsersPage } from './UsersPage';
import { ExpensesPage } from './ExpensesPage';
import { ProfitsPage } from './ProfitsPage';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { shopService } from '@/services/shopService';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

// Type for the shops state mapping shopId to shopName
type ShopMap = Record<string, string>; // shopId: shopName

interface DashboardMetrics {
  activeUsers: number;
  bookingsToday: number;
  totalRevenue: number;
  customerSatisfaction: number;
}

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [shops, setShops] = useState<ShopMap>({});
  const [selectedShop, setSelectedShop] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegisterMenuOpen, setIsRegisterMenuOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    bookingsToday: 0,
    totalRevenue: 0,
    customerSatisfaction: 0,
  });

  // Handle shop selection change
  const handleShopChange = (shopId: string) => {
    setSelectedShop(shopId);
  };

  // Format price with currency symbol and thousands separators
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 768;
      setIsMobile(isNowMobile);
      // Close mobile menu when resizing to desktop
      if (!isNowMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileMenuOpen && sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setIsRegisterMenuOpen(false);
      }
    };

    // Set initial mobile state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isMobileMenuOpen]);

  // Generate random metrics for demo purposes
  const generateRandomMetrics = (shopId: string): DashboardMetrics => {
    // Create a consistent hash from shopId to ensure same shop always gets same metrics
    const hash = shopId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use the hash to generate consistent but varied metrics for each shop
    return {
      activeUsers: Math.abs(hash % 15) + 5, // 5-20 active users
      bookingsToday: Math.abs(hash % 10) + 3, // 3-13 bookings
      totalRevenue: Math.abs(hash % 5000) + 1500, // $1500-$6500
      customerSatisfaction: Math.min(100, Math.max(60, hash % 100)) // 60-100%
    };
  };

  // Update metrics when selected shop changes
  useEffect(() => {
    if (selectedShop) {
      // In a real app, you would fetch metrics for the selected shop here
      // For now, we'll generate random but consistent metrics based on shopId
      const shopIdNum = parseInt(selectedShop, 10) || 0; // Convert shopId to number for consistent hashing
      setMetrics(generateRandomMetrics(shopIdNum.toString()));
    }
  }, [selectedShop]);

  // Function to fetch shops
  const fetchShops = async () => {
    console.log('fetchShops called');
    if (!user?.token) {
      console.log('No user token available');
      return;
    }
    
    try {
      console.log('Setting loading state to true');
      setIsLoading(true);
      console.log('Calling shopService.getAllShops...');
      const shopsData = await shopService.getAllShops(user.token);
      console.log('Shops data received from API:', shopsData);
      
      // Set the shops data
      console.log('Setting shops state with new data');
      setShops(prevShops => {
        console.log('Previous shops state:', prevShops);
        console.log('New shops data to set:', shopsData);
        return shopsData;
      });
      
      // Select the first shop by default if available and no shop is selected
      const shopIds = Object.keys(shopsData);
      console.log('Available shop IDs:', shopIds);
      
      if (shopIds.length > 0 && !selectedShop) {
        const firstShopId = shopIds[0];
        console.log('Selecting first shop ID:', firstShopId);
        setSelectedShop(firstShopId);
        const shopIdNum = parseInt(firstShopId, 10) || 0;
        setMetrics(generateRandomMetrics(shopIdNum.toString()));
      } else if (shopIds.length === 0) {
        console.log('No shops available');
        setSelectedShop('');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shops. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Log shops state changes
  useEffect(() => {
    console.log('Shops state updated:', shops);
  }, [shops]);

  // Initialize shops on component mount
  useEffect(() => {
    console.log('Component mounted or user token changed, fetching shops...');
    fetchShops();
  }, [user?.token]);

  const { theme, setTheme } = useTheme();

  // Handle navigation between tabs
  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    
    // Handle inventory management tabs
    if (tab.startsWith('inventory-')) {
      // No need to navigate, just update the active tab
      if (isMobile) {
        setIsMobileMenuOpen(false);
        setIsInventoryMenuOpen(false);
      }
      return;
    }
    
    if (isMobile) {
      setIsMobileMenuOpen(false);
      setIsRegisterMenuOpen(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background text-foreground bg-white dark:bg-gray-900",
      theme === 'dark' ? 'dark' : ''
    )}>
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">SuperAdmin Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex text-foreground"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Overlay for mobile */}
        {isMobile && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out',
            isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
            'md:relative md:translate-x-0',
            'flex flex-col h-[calc(100vh-4rem)] md:h-full',
            'dark:bg-gray-800 dark:border-gray-700'
          )}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500 mt-1">
                {isLoading ? 'Loading...' : `${Object.keys(shops).length} shops available`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          
          <div className="flex flex-col h-full">
            <nav className="p-2 space-y-1 overflow-y-auto flex-1">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start hover:bg-accent/50',
                  activeTab === 'dashboard' ? 'bg-accent/30' : ''
                )}
                onClick={() => {
                  handleNavigation('dashboard');
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </div>
            
            <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-between hover:bg-accent/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRegisterMenuOpen(!isRegisterMenuOpen);
                  }}
                >
                  <div className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Register</span>
                  </div>
                  {isRegisterMenuOpen ? (
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  )}
                </Button>
                    
                    {/* Register Submenu */}
                    <div className={`pl-4 space-y-1 ${isRegisterMenuOpen ? 'block' : 'hidden'}`}>
                      <Button
                    variant="ghost"
                    className="w-full justify-start hover:bg-accent/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('register-user');
                      if (isMobile) setIsMobileMenuOpen(false);
                    }}
                  >
                                <User className="mr-2 h-4 w-4" />
                        <span>Create User</span>
                      </Button>
                      <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('register-shop');
                      if (isMobile) setIsMobileMenuOpen(false);
                    }}
                  >
                        <Store className="mr-2 h-4 w-4" />
                        <span>Register Shop</span>
                      </Button>
                      <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigation('register-service');
                      if (isMobile) setIsMobileMenuOpen(false);
                    }}
                  >
                        <Scissors className="mr-2 h-4 w-4" />
                        <span>Register Service</span>
                      </Button>
                    </div>
                  </div>
                  <Button
                variant="ghost"
                onClick={() => handleNavigation('shops')}
                className={cn(
                  'w-full justify-start hover:bg-accent/50',
                  activeTab === 'shops' ? 'bg-accent/30' : ''
                )}
              >
                <Store className="mr-2 h-4 w-4" />
                <span>Shops</span>
              </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start hover:bg-accent/50',
                      activeTab === 'users' ? 'bg-accent/30' : ''
                    )}
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Users</span>
                  </Button>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-between hover:bg-accent/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsInventoryMenuOpen(!isInventoryMenuOpen);
                      }}
                    >
                      <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        <span>Inventory Management</span>
                      </div>
                      {isInventoryMenuOpen ? (
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      ) : (
                        <ChevronRight className="h-4 w-4 opacity-70" />
                      )}
                    </Button>

                    {/* Inventory Management Submenu */}
                    <div className={`pl-4 space-y-1 ${isInventoryMenuOpen ? 'block' : 'hidden'}`}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start pl-4 ${activeTab === 'inventory-create' ? 'bg-accent/50' : 'hover:bg-accent/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation('inventory-create');
                          if (isMobile) setIsMobileMenuOpen(false);
                        }}
                      >
                        <PackagePlus className="mr-2 h-4 w-4" />
                        <span>Create Material</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start pl-4 ${activeTab === 'inventory-allocate' ? 'bg-accent/50' : 'hover:bg-accent/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation('inventory-allocate');
                          if (isMobile) setIsMobileMenuOpen(false);
                        }}
                      >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        <span>Allocate Material</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start pl-4 ${activeTab === 'inventory-list' ? 'bg-accent/50' : 'hover:bg-accent/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation('inventory-list');
                          if (isMobile) setIsMobileMenuOpen(false);
                        }}
                      >
                        <ListChecks className="mr-2 h-4 w-4" />
                        <span>Material List</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start pl-4 ${activeTab === 'inventory-stock' ? 'bg-accent/50' : 'hover:bg-accent/50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation('inventory-stock');
                          if (isMobile) setIsMobileMenuOpen(false);
                        }}
                      >
                        <Package2 className="mr-2 h-4 w-4" />
                        <span>In Stock</span>
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start hover:bg-accent/50',
                      activeTab === 'expenses' ? 'bg-accent/30' : ''
                    )}
                    onClick={() => setActiveTab('expenses')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Expenses</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start hover:bg-accent/50',
                      activeTab === 'profits' ? 'bg-accent/30' : ''
                    )}
                    onClick={() => setActiveTab('profits')}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    <span>Profits</span>
                  </Button>
            </nav>
            
            {/* Sign Out Button - Fixed at bottom */}
            <div className="pt-2 px-2 border-t border-gray-200 bg-white dark:bg-gray-800 sticky bottom-0 left-0 right-0">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-semibold dark:text-white dark:hover:text-white text-gray-900 hover:text-gray-900"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          </div>
            </aside>

            {/* Main Content - Added padding bottom to account for mobile footer */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 pb-16 md:pb-0">
              <main className="h-full overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8 bg-transparent">

              <Tabs value={activeTab} className="space-y-4">
                <TabsContent value="dashboard" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Welcome back, {user?.userName}!</h2>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Here's what's happening with your business today.
                      </p>
                    </div>
                    <ShopSelector 
                      selectedShop={selectedShop}
                      onShopChange={handleShopChange}
                      shops={shops}
                      isLoading={isLoading}
                    />
                  </div>
                  
                  <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="h-full flex flex-col min-h-[140px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Active Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 flex-1 flex flex-col justify-between">
                        <div className="text-xl sm:text-2xl font-bold flex-1 flex items-center">{metrics.activeUsers}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          +20.1% from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col min-h-[140px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Bookings Today
                        </CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 flex-1 flex flex-col justify-between">
                        <div className="text-xl sm:text-2xl font-bold flex-1 flex items-center">{metrics.bookingsToday}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          +5 from yesterday
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col min-h-[140px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Total Revenue
                        </CardTitle>
                        <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 flex-1 flex flex-col justify-between">
                        <div className="text-xl sm:text-2xl font-bold flex-1 flex items-center">{formatPrice(metrics.totalRevenue)}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          +19% from last month
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="h-full flex flex-col min-h-[140px]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                          Satisfaction
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 flex-1 flex flex-col justify-between">
                        <div className="text-xl sm:text-2xl font-bold flex-1 flex items-center">{metrics.customerSatisfaction}%</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          +2.5% from last month
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Shops Tab */}
              <TabsContent value="shops" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Shops</CardTitle>
                    <CardDescription>
                      View and manage all registered shops.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShopsTable 
                      shops={shops} 
                      onShopStatusChange={fetchShops} 
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register-user" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>
                      Register a new staff member or administrator.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserRegistrationForm />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manage Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <UsersPage 
                  selectedShop={selectedShop}
                  onShopChange={handleShopChange}
                  shops={shops}
                  isLoading={isLoading}
                />
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-4">
                <ExpensesPage 
                  selectedShop={selectedShop}
                  onShopChange={handleShopChange}
                  shops={shops}
                  isLoading={isLoading}
                />
              </TabsContent>

              {/* Profits Tab */}
              <TabsContent value="profits" className="space-y-4">
                <ProfitsPage 
                  selectedShop={selectedShop}
                  onShopChange={handleShopChange}
                  shops={shops}
                  isLoading={isLoading}
                />
              </TabsContent>

              {/* Register Shop Tab */}
              <TabsContent value="register-shop">
                <Card>
                  <CardHeader>
                    <CardTitle>Register New Shop</CardTitle>
                    <CardDescription>
                      Add a new shop to the system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShopRegistrationForm onShopRegistered={fetchShops} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Register Service Tab */}
              <TabsContent value="register-service">
                <Card>
                  <CardHeader>
                    <CardTitle>Register New Service</CardTitle>
                    <CardDescription>
                      Add a new service to the system.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ServiceRegistrationForm />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Management Tabs */}
              <TabsContent value="inventory-create" className="space-y-4">
                <InventoryManagement activeTab="inventory-create" />
              </TabsContent>

              <TabsContent value="inventory-allocate" className="space-y-4">
                <InventoryManagement activeTab="inventory-allocate" />
              </TabsContent>

              <TabsContent value="inventory-list" className="space-y-4">
                <InventoryManagement activeTab="inventory-list" />
              </TabsContent>

              <TabsContent value="inventory-stock" className="space-y-4">
                <InventoryManagement activeTab="inventory-stock" />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                      Configure system preferences and options.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <p>System settings features coming soon.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>

          {/* Mobile Footer Navbar - Only visible on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-gray-200 dark:border-gray-700 z-40 h-16">
          <div className="flex justify-around items-center py-2 px-1">
            {/* Dashboard */}
            <button 
              onClick={() => handleNavigation('dashboard')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <LayoutDashboard className="h-5 w-5 mb-1" />
              <span className="text-xs">Dashboard</span>
            </button>

            {/* Users */}
            <button 
              onClick={() => handleNavigation('users')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab === 'users' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Users</span>
            </button>

            {/* Shops */}
            <button 
              onClick={() => handleNavigation('shops')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab === 'shops' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Store className="h-5 w-5 mb-1" />
              <span className="text-xs">Shops</span>
            </button>

            {/* Expenses */}
            <button 
              onClick={() => handleNavigation('expenses')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab === 'expenses' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Expenses</span>
            </button>

            {/* Profits */}
            <button 
              onClick={() => handleNavigation('profits')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab === 'profits' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <LineChart className="h-5 w-5 mb-1" />
              <span className="text-xs">Profits</span>
            </button>

            {/* Inventory */}
            <button 
              onClick={() => handleNavigation('inventory-list')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${activeTab.startsWith('inventory-') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Package className="h-5 w-5 mb-1" />
              <span className="text-xs">Inventory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;
