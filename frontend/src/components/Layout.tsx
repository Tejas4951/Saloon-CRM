"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Store, 
  LayoutDashboard, 
  Users, 
  Clock,
  Menu,
  X,
  Receipt,
  LogIn,
  LogOut,
  User as UserIcon,
  UserPlus,
  Bell,
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Crown,
  Package,
  Megaphone,
  BarChart3,
  Settings,
  CreditCard,
  UserCheck,
  Pencil,
  Calculator,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { NotificationPopover } from "./NotificationPopover";
import { useAuth } from "@/contexts/AuthContext-Loginpage";
import { useAdminTheme } from "@/contexts/AdminThemeContext";
import { usePlans } from "@/contexts/PlansContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSalonLogo } from "@/hooks/useSalonLogo";
import { toast } from "sonner";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { supabase } from '@/lib/supabase';

const navigation = [
  {
    name: "Dashboard",
    href: "/index",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "/booking",
    icon: Calendar,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Billing & POS",
    href: "/tally",
    icon: Receipt,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Expenses",
    href: "/expenses",
    icon: Calculator,
  },
  {
    name: "Staff",
    href: "/schedule",
    icon: UserCheck,
  },
  {
    name: "Store",
    href: "/store",
    icon: Store,
  },
  {
    name: "Styles Showcase",
    href: "/styles",
    icon: Sparkles,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('saloniq_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('saloniq_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedBranch, setSelectedBranch] = useState('Your Salon');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { adminTheme, toggleAdminTheme } = useAdminTheme();
  const { currentPlan, daysLeft } = usePlans();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { logo, saveLogo } = useSalonLogo();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void supabase.from('shops').select('id, shop_name').eq('is_available', true).order('id').then(({ data, error }) => {
      if (error) {
        console.error('[Supabase:layout.shops]', error);
        return;
      }
      const availableBranches = (data || []).map((shop: any) => ({ id: Number(shop.id), name: shop.shop_name }));
      setBranches(availableBranches);
      if (availableBranches[0]) setSelectedBranch(availableBranches[0].name);
    });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Please choose a PNG, JPG, or WebP logo.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string' || !(await saveLogo(reader.result))) {
        toast.error('Logo could not be saved. Try a smaller image.');
        return;
      }
      toast.success('Logo updated on admin and public pages.');
    };
    reader.onerror = () => toast.error('Logo could not be read. Please try another image.');
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex flex-col lg:flex-row", adminTheme === 'hr-management' && "admin-theme-hr")}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dark & Gold SALONIQ Theme */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-[#111827] text-white border-r border-gray-800 shadow-2xl transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-64 lg:w-20" : "w-64"
        )}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* SALONIQ Brand Header */}
            <div className={cn("p-4 border-b border-gray-800/80 flex items-center justify-between", isCollapsed && "lg:p-3 lg:justify-center")}>
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  className="group relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/20 text-slate-950 font-bold shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]"
                  onClick={() => logoInputRef.current?.click()}
                  aria-label={logo ? 'Change salon logo' : 'Upload salon logo'}
                  title={logo ? 'Change salon logo' : 'Upload salon logo'}
                >
                  {logo ? (
                    <img src={logo} alt="Salon logo" className="h-full w-full object-contain bg-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 fill-current text-slate-950" />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-slate-950/70 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Pencil className="h-3.5 w-3.5" />
                  </span>
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleLogoChange}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className={cn("min-w-0 cursor-pointer", isCollapsed && "lg:hidden")} onClick={() => navigate('/index')}>
                  <h2 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                    SALONIQ
                  </h2>
                  <p className="text-[9px] uppercase tracking-widest text-amber-400/70 font-semibold">
                    Manage • Grow • Succeed
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-gray-800">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href === '/index' && location.pathname === '/');
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/index'}
                    title={item.name}
                    className={cn(
                      "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer",
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/60",
                      isCollapsed && "lg:justify-center lg:px-2 lg:space-x-0"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-slate-950" : "text-amber-400/80 group-hover:text-amber-300"
                    )} />
                    <span className={cn("truncate", isCollapsed && "lg:hidden")}>{item.name}</span>
                  </NavLink>
                );
              })}

              {/* Collapse Sidebar Button below Settings tab */}
              <button
                type="button"
                onClick={toggleCollapse}
                className={cn(
                  "w-full flex items-center space-x-3 px-3.5 py-2.5 mt-1 rounded-xl text-xs font-semibold text-gray-400 hover:text-amber-300 hover:bg-gray-800/60 transition-all duration-200 group cursor-pointer",
                  isCollapsed && "lg:justify-center lg:px-2 lg:space-x-0"
                )}
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 group-hover:scale-110" />
                ) : (
                  <ChevronLeft className="h-4 w-4 shrink-0 text-amber-400 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span className={cn("truncate", isCollapsed && "lg:hidden")}>
                  {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                </span>
              </button>
            </nav>
          </div>

          {/* Footer - Plan & Subscription Badge */}
          <div className="p-3 border-t border-gray-800/80 bg-gray-950/60">
            <PwaInstallButton compact className={cn("mb-2.5", isCollapsed && "lg:hidden")} />
            <button
              type="button"
              onClick={() => navigate('/plans')}
              className={cn(
                "w-full text-left p-2.5 rounded-xl bg-gray-900/90 border border-amber-500/20 flex items-center justify-between hover:border-amber-500/50 hover:bg-gray-800/80 transition-all duration-200 group cursor-pointer",
                isCollapsed && "lg:p-2 lg:justify-center"
              )}
              title="View & Manage Subscription Plans"
            >
              <div className="flex items-center space-x-2 truncate">
                <Crown className="h-4 w-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className={cn("truncate", isCollapsed && "lg:hidden")}>
                  <p className="text-[11px] font-bold text-gray-200 truncate">Your Plan</p>
                  <p className="text-[9px] text-amber-400/80 font-medium truncate">{currentPlan.name} • {daysLeft}d left</p>
                </div>
              </div>
              <div className={cn("flex items-center gap-1.5 shrink-0", isCollapsed && "lg:hidden")}>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-semibold">Active</span>
              </div>
            </button>
            <div className={cn("mt-2 text-center text-[10px] text-gray-500 font-medium", isCollapsed && "lg:hidden")}>
              SalonPro v1.0
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top Header Bar */}
        <header className="bg-background/95 backdrop-blur-md border-b border-border/60 px-4 py-2.5 sticky top-0 z-40 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Outlet Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold h-9 shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span className="truncate max-w-[140px]">{selectedBranch}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs">Select Salon Branch</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {branches.map(branch => (
                    <DropdownMenuItem
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch.name)}
                      className="text-xs cursor-pointer"
                    >
                      {branch.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Global Search Bar */}
              <div className="relative flex-1 max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search customers, appointments, services..."
                  className="pl-9 text-xs h-9 bg-muted/40 border-border/60 focus-visible:ring-amber-500"
                />
              </div>
            </div>

            {/* Header Right Controls */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Notifications */}
              <NotificationPopover />

              {/* Real-time Clock */}
              <div className="hidden xl:flex items-center text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
              </div>

              {/* Theme Switcher Palette Icon (Classic Gold vs HR Modern) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAdminTheme}
                className={cn(
                  "h-9 w-9 rounded-full transition-colors cursor-pointer",
                  adminTheme === 'classic-gold' 
                    ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" 
                    : "text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10"
                )}
                title={adminTheme === 'classic-gold' ? "Switch to HR Modern Theme" : "Switch to Classic Gold Theme"}
              >
                <Palette className="h-4 w-4" />
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle className="h-9 w-9" />

              {/* Profile Menu */}
              {isAuthenticated && user && mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 flex items-center gap-2 px-2 rounded-full hover:bg-muted">
                      <Avatar className="h-7 w-7 bg-amber-500 text-slate-950 font-bold">
                        <AvatarFallback className="bg-amber-500 text-slate-950 font-bold text-xs">
                          {user.userName ? user.userName.charAt(0).toUpperCase() : 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col text-left">
                        <span className="text-xs font-bold leading-none">{user.userName || 'Salon Owner'}</span>
                        <span className="text-[10px] text-muted-foreground">Owner</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold">{user.userName}</p>
                        <p className="text-[10px] text-muted-foreground">Salon Owner</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="text-xs cursor-pointer">
                      <UserIcon className="mr-2 h-3.5 w-3.5" /> Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-3.5 w-3.5" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate('/login')}>
                    <LogIn className="h-3.5 w-3.5 mr-1" /> Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page View Body */}
        <main className="p-4 sm:p-6 flex-1 overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
