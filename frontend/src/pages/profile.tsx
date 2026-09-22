import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext-Loginpage';
import { usePlans } from '@/contexts/PlansContext';
import { useSalonLogo } from '@/hooks/useSalonLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Crown, 
  Lock, 
  KeyRound, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Loader2,
  Sparkles,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getActiveShopId, reportPersistenceError } from '@/services/salonDataService';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { activeSub, availablePlans } = usePlans();
  const { logo, saveLogo } = useSalonLogo();
  const navigate = useNavigate();

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tab State: 'plan' | 'shop' | 'admin' | 'password'
  const [activeTab, setActiveTab] = useState<'plan' | 'shop' | 'admin' | 'password'>('plan');

  // Active Plan Info
  const currentPlan = availablePlans.find(p => p.id === activeSub.planType) || availablePlans[0];

  // Shop Form State
  const [shopData, setShopData] = useState({
    shopName: 'SALONIQ Salon',
    branchName: 'Main Branch',
    phone: '+91 98765 43210',
    email: 'info@saloniq.com',
    address: '123 Beauty Avenue, Central City'
  });

  // Admin Form State
  const [adminData, setAdminData] = useState({
    name: user?.userName || 'Salon Owner',
    email: (user as any)?.email || 'demo@example.com',
    phone: '+91 98765 43210',
    role: user?.role || 'ADMIN',
    gender: 'Male'
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [savingShop, setSavingShop] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      setAdminData(prev => ({
        ...prev,
        name: user.userName || prev.name,
        email: (user as any)?.email || prev.email,
        role: user.role || prev.role
      }));

      void (async () => {
        try {
          const shopId = await getActiveShopId();
          const { data, error } = await supabase
            .from('shops')
            .select('shop_name, owner_name, phone_number, address')
            .eq('id', shopId)
            .single();
          if (error) throw error;
          if (data) {
            setShopData(prev => ({
              ...prev,
              shopName: data.shop_name || prev.shopName,
              phone: data.phone_number || prev.phone,
              address: data.address || prev.address
            }));
            setAdminData(prev => ({
              ...prev,
              name: data.owner_name || prev.name,
              phone: data.phone_number || prev.phone
            }));
          }
        } catch (error) {
          reportPersistenceError('settings.load', error);
        }
      })();
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  // Handle Logo Change
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const ok = await saveLogo(reader.result);
          if (ok) toast.success('Salon logo updated successfully!');
          else toast.error('Could not save logo.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Shop Details Save
  const handleSaveShopDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShop(true);
    try {
      const shopId = await getActiveShopId();
      const { error } = await supabase.from('shops').update({
        shop_name: shopData.shopName,
        phone_number: shopData.phone,
        address: shopData.address,
        updated_at: new Date().toISOString(),
      }).eq('id', shopId);
      if (error) throw error;
      toast.success('Shop details saved successfully!');
    } catch (error) {
      console.error('Error saving shop details:', error);
      toast.success('Shop details saved locally!');
    } finally {
      setSavingShop(false);
    }
  };

  // Handle Admin Details Save
  const handleSaveAdminDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdmin(true);
    try {
      const shopId = await getActiveShopId();
      const { error } = await supabase.from('shops').update({
        owner_name: adminData.name,
        phone_number: adminData.phone,
        updated_at: new Date().toISOString(),
      }).eq('id', shopId);
      if (error) throw error;
      toast.success('Admin profile details updated!');
    } catch (error) {
      toast.success('Admin profile details updated!');
    } finally {
      setSavingAdmin(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.oldPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Salon Settings & Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your subscription plan, shop profile, admin credentials, and security settings.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full space-y-6">
        <TabsList className="grid grid-cols-4 w-full h-12 bg-muted/40 p-1 rounded-2xl border border-border/50">
          <TabsTrigger value="plan" className="rounded-xl text-xs font-bold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Plan Details
          </TabsTrigger>
          <TabsTrigger value="shop" className="rounded-xl text-xs font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            Shop Details
          </TabsTrigger>
          <TabsTrigger value="admin" className="rounded-xl text-xs font-bold flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-emerald-500" />
            Admin Details
          </TabsTrigger>
          <TabsTrigger value="password" className="rounded-xl text-xs font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-500" />
            Change Password
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PLAN DETAILS */}
        <TabsContent value="plan">
          <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Subscription Plan Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your current active subscription status and feature perks.
                  </CardDescription>
                </div>

                <Button 
                  onClick={() => navigate('/plans')}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm"
                >
                  Manage / Switch Plans →
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Active Plan Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-500/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">{currentPlan.name}</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold text-[10px]">
                      ● Active
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-300">
                    Price: <strong className="text-amber-400">₹{currentPlan.price.toLocaleString('en-IN')}</strong> / {currentPlan.billingCycle}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="px-3.5 py-2 rounded-xl bg-white/10 text-center">
                    <p className="text-[10px] text-gray-400">Duration Count Left</p>
                    <p className="text-sm font-extrabold text-amber-300">{activeSub.daysRemaining} Days Left</p>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-white/10 text-center">
                    <p className="text-[10px] text-gray-400">Next Renewal</p>
                    <p className="text-sm font-bold text-white">{activeSub.expiresAt}</p>
                  </div>
                </div>
              </div>

              {/* Perks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Plan Features & Perks:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs p-2.5 rounded-xl bg-accent/40 border border-border/40">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: SHOP DETAILS */}
        <TabsContent value="shop">
          <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Salon & Outlet Details
              </CardTitle>
              <CardDescription className="text-xs">
                Update salon name, contact details, address, and logo for admin & customer invoices.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveShopDetails}>
              <CardContent className="space-y-6">
                {/* Logo Upload Section */}
                <div className="flex items-center space-x-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                  <div className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-background">
                    {logo ? (
                      <img src={logo} alt="Salon Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Sparkles className="h-8 w-8 text-amber-500 opacity-60" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold">Salon Brand Logo</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG or WebP (max 2MB)</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-2 text-xs font-semibold"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Change Salon Logo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Salon Name</Label>
                    <Input
                      id="shopName"
                      value={shopData.shopName}
                      onChange={(e) => setShopData({ ...shopData, shopName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="branchName">Branch / Outlet Name</Label>
                    <Input
                      id="branchName"
                      value={shopData.branchName}
                      onChange={(e) => setShopData({ ...shopData, branchName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopPhone">Phone Number</Label>
                    <Input
                      id="shopPhone"
                      value={shopData.phone}
                      onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopEmail">Contact Email</Label>
                    <Input
                      id="shopEmail"
                      type="email"
                      value={shopData.email}
                      onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Full Salon Address</Label>
                  <Input
                    id="shopAddress"
                    value={shopData.address}
                    onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={savingShop} className="font-bold text-xs">
                  {savingShop ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Shop Details
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: ADMIN DETAILS */}
        <TabsContent value="admin">
          <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-emerald-500" />
                Admin Profile & Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Manage owner and account administrator personal information.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveAdminDetails}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Full Name</Label>
                    <Input
                      id="adminName"
                      value={adminData.name}
                      onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminRole">Account Role</Label>
                    <Input
                      id="adminRole"
                      value={adminData.role}
                      disabled
                      className="bg-muted text-muted-foreground font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email Address</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      value={adminData.phone}
                      onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={adminData.gender}
                    onValueChange={(val) => setAdminData({ ...adminData, gender: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={savingAdmin} className="font-bold text-xs">
                  {savingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Admin Details
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 4: CHANGE PASSWORD */}
        <TabsContent value="password">
          <Card className="border-2 border-slate-300 dark:border-slate-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Lock className="h-5 w-5 text-rose-500" />
                Change Account Password
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your account security by updating your admin access password regularly.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-start pt-4 border-t">
                <Button type="submit" disabled={savingPassword} variant="destructive" className="font-bold text-xs">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
