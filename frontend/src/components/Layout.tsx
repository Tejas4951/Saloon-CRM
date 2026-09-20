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
  Sparkles,
  Crown,
  Package,
  Megaphone,
  BarChart3,
  Settings,
  CreditCard,
  UserCheck,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { NotificationPopover } from "./NotificationPopover";
import { useAuth } from "@/contexts/AuthContext-Loginpage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockBranches } from "@/data/mockData";
import { useSalonLogo } from "@/hooks/useSalonLogo";
import { toast } from "sonner";
import { PwaInstallButton } from "@/components/PwaInstallButton";

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
  const [selectedBranch, setSelectedBranch] = useState(mockBranches[0].name);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { logo, saveLogo } = useSalonLogo();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] text-white border-r border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* SALONIQ Brand Header */}
            <div className="p-4 border-b border-gray-800/80 flex items-center justify-between">
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
                <div className="min-w-0 cursor-pointer" onClick={() => navigate('/index')}>
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
                    className={cn(
                      "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer",
                      isActive
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-slate-950" : "text-amber-400/80 group-hover:text-amber-300"
                    )} />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer - Outlet Location Badge */}
          <div className="p-3 border-t border-gray-800/80 bg-gray-950/60">
            <PwaInstallButton compact className="mb-2.5" />
            <div className="p-2.5 rounded-xl bg-gray-900/90 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <Crown className="h-4 w-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] font-bold text-gray-200 truncate">Your Salon</p>
                  <p className="text-[9px] text-amber-400/80 truncate">{selectedBranch}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] text-emerald-400 font-semibold">Online</span>
              </div>
            </div>
            <div className="mt-2 text-center text-[10px] text-gray-500 font-medium">
              SalonPro v1.0
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
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
                  {mockBranches.map(branch => (
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
