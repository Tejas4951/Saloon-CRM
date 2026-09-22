import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PlanType = 'monthly' | 'yearly';

export interface PlanInfo {
  id: PlanType;
  name: string;
  price: number;
  billingCycle: string;
  originalPrice?: number;
  discountPercentage?: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface ActiveSubscription {
  planType: PlanType;
  status: 'active' | 'cancelled' | 'expired';
  activatedAt: string;
  expiresAt: string;
  daysRemaining: number;
}

interface PlansContextType {
  activeSub: ActiveSubscription;
  switchPlan: (planType: PlanType) => void;
  availablePlans: PlanInfo[];
  currentPlan: PlanInfo;
  daysLeft: number;
}

const MONTHLY_PRICE = 199;
const YEARLY_PRICE = 1999;
const REGULAR_ANNUAL_PRICE = MONTHLY_PRICE * 12; // 2388
export const CALCULATED_YEARLY_DISCOUNT = Math.round(((REGULAR_ANNUAL_PRICE - YEARLY_PRICE) / REGULAR_ANNUAL_PRICE) * 100); // 16%

export const AVAILABLE_PLANS: PlanInfo[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: MONTHLY_PRICE,
    billingCycle: 'per month',
    description: 'Flexible monthly billing for growing salons with full feature access.',
    features: [
      'Unlimited Appointment Bookings',
      'Billing & POS Tally Module (Daily/Monthly CSV & PDF)',
      'Inventory & Stock Tracking',
      'Staff Schedule Management & Pop-up Editor',
      'Public Customer Booking Portal',
      'Customer History & Pending Balance CRM',
      'Reports & Expenses Tracking'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: YEARLY_PRICE,
    originalPrice: REGULAR_ANNUAL_PRICE,
    discountPercentage: CALCULATED_YEARLY_DISCOUNT,
    billingCycle: 'per year',
    description: `Annual billing with ${CALCULATED_YEARLY_DISCOUNT}% Discount. Best value for long-term salon growth.`,
    features: [
      'All Monthly Plan Features Included',
      `${CALCULATED_YEARLY_DISCOUNT}% Special Discount Off Regular Annual Price (Save ₹${REGULAR_ANNUAL_PRICE - YEARLY_PRICE})`,
      'Equivalent to 2 Months FREE Access',
      'Priority Customer & Technical Support',
      'Free Custom Logo & Branding Setup',
      'Guaranteed Lock-in Pricing for 1 Year'
    ],
    recommended: true
  }
];

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [activeSub, setActiveSub] = useState<ActiveSubscription>(() => {
    const saved = localStorage.getItem('saloniq_active_plan');
    if (saved) return JSON.parse(saved);

    // Default 30-day active monthly plan starting today
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 24); // 24 days count left

    return {
      planType: 'monthly',
      status: 'active',
      activatedAt: now.toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0],
      daysRemaining: 24
    };
  });

  useEffect(() => {
    // Recalculate days remaining dynamically
    const expDate = new Date(activeSub.expiresAt);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    if (diffDays !== activeSub.daysRemaining) {
      const updated = { ...activeSub, daysRemaining: diffDays };
      setActiveSub(updated);
      localStorage.setItem('saloniq_active_plan', JSON.stringify(updated));
    } else {
      localStorage.setItem('saloniq_active_plan', JSON.stringify(activeSub));
    }
  }, []);

  const switchPlan = (planType: PlanType) => {
    const now = new Date();
    const expiry = new Date(now);

    if (planType === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    const diffTime = expiry.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const newSub: ActiveSubscription = {
      planType,
      status: 'active',
      activatedAt: now.toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0],
      daysRemaining: days
    };

    setActiveSub(newSub);
    localStorage.setItem('saloniq_active_plan', JSON.stringify(newSub));
  };

  const currentPlan = AVAILABLE_PLANS.find(p => p.id === activeSub.planType) || AVAILABLE_PLANS[0];
  const daysLeft = activeSub.daysRemaining;

  return (
    <PlansContext.Provider value={{ activeSub, switchPlan, availablePlans: AVAILABLE_PLANS, currentPlan, daysLeft }}>
      {children}
    </PlansContext.Provider>
  );
}

export function usePlans() {
  const context = useContext(PlansContext);
  if (!context) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
}
