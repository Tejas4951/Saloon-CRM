import React from 'react';
import { 
  Crown, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlans, PlanType } from '@/contexts/PlansContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function PlansPage() {
  const { activeSub, switchPlan, availablePlans } = usePlans();
  const navigate = useNavigate();

  const currentPlan = availablePlans.find(p => p.id === activeSub.planType) || availablePlans[0];

  const handlePlanSwitch = (planType: PlanType) => {
    if (planType === activeSub.planType) {
      toast.info(`You are already on the ${currentPlan.name}.`);
      return;
    }

    const targetPlan = availablePlans.find(p => p.id === planType);
    if (window.confirm(`Switch your subscription to the ${targetPlan?.name} (${planType === 'yearly' ? `₹${targetPlan.price}/yr` : '₹199/mo'})?`)) {
      switchPlan(planType);
      toast.success(`Successfully switched to ${targetPlan?.name}! Your new plan is now active.`);
    }
  };

  const yearlyPlan = availablePlans.find(p => p.id === 'yearly');
  const yearlyDiscount = yearlyPlan?.discountPercentage || 16;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Crown className="h-8 w-8 text-amber-500 fill-amber-500/20" />
            Salon Subscription & Plans
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your active salon subscription plan, view duration countdown, and upgrade options.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/settings')}
          className="border-slate-300 dark:border-slate-700 font-semibold text-xs"
        >
          View Settings →
        </Button>
      </div>

      {/* Active Subscription Summary Card */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-2 border-amber-500/30 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 grid place-items-center text-slate-950 shadow-lg font-bold">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl text-white font-extrabold">{currentPlan.name}</CardTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs px-2.5 py-0.5 font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Active Plan
                  </Badge>
                </div>
                <CardDescription className="text-gray-300 text-xs mt-1">
                  Billed {activeSub.planType === 'yearly' ? `Annually (${yearlyDiscount}% Discount applied)` : 'Monthly at ₹199/month'}
                </CardDescription>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-2xl font-black text-amber-400">
                ₹{currentPlan.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-300 font-medium"> / {currentPlan.billingCycle}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-xs">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">Plan Duration Left</p>
                <p className="text-base font-extrabold text-amber-300">{activeSub.daysRemaining} Days Count Left</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">Activated On</p>
                <p className="text-sm font-bold text-white">{activeSub.activatedAt}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-gray-400 font-medium">Next Renewal Date</p>
                <p className="text-sm font-bold text-white">{activeSub.expiresAt}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Section */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Choose The Best Plan For Your Salon</h2>
          <p className="text-xs text-muted-foreground">Select between monthly flexibility or get an annual subscription with {yearlyDiscount}% discount.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {availablePlans.map((plan) => {
            const isCurrent = activeSub.planType === plan.id;
            const isYearly = plan.id === 'yearly';

            return (
              <Card 
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-300 ${
                  isYearly 
                    ? 'border-2 border-amber-500 shadow-xl bg-card' 
                    : 'border-2 border-slate-300 dark:border-slate-700 shadow-md bg-card/50 dark:bg-card'
                } ${isCurrent ? 'ring-2 ring-amber-500/40' : ''}`}
              >
                {isYearly && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5 fill-slate-950" /> {plan.discountPercentage}% OFF - Best Value
                  </div>
                )}

                <CardHeader className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{plan.description}</CardDescription>
                    </div>
                  </div>

                  <div className="pt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-primary">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">/ {plan.billingCycle}</span>
                    
                    {plan.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2 font-medium">
                        ₹{plan.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {isYearly && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
                      ✨ Billed annually (Save {plan.discountPercentage}% off regular price)
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  <div className="pt-2 border-t space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What's included:</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isYearly ? 'text-amber-500' : 'text-emerald-500'}`} />
                        <span className="font-medium text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t">
                  <Button
                    onClick={() => handlePlanSwitch(plan.id)}
                    variant={isCurrent ? "outline" : isYearly ? "salon" : "default"}
                    className={`w-full font-bold text-xs h-11 ${
                      isCurrent 
                        ? 'border-2 border-slate-400 dark:border-slate-600 opacity-80 cursor-default' 
                        : ''
                    }`}
                  >
                    {isCurrent ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Current Active Plan
                      </span>
                    ) : isYearly ? (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="h-4 w-4" /> Upgrade to Yearly Plan (Save {plan.discountPercentage}%)
                      </span>
                    ) : (
                      'Switch to Monthly Plan (₹199)'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
