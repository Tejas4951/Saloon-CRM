import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { 
    indicatorClassName?: string;
    containerClassName?: string;
  }
>(({ className, children, indicatorClassName, containerClassName, ...props }, ref) => {
  const [indicatorStyle, setIndicatorStyle] = React.useState({ 
    width: 0, 
    left: 0,
    opacity: 0 
  });
  const listRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Update indicator when active tab changes
  const updateIndicator = React.useCallback(() => {
    if (activeTabRef.current) {
      const { offsetLeft, offsetWidth } = activeTabRef.current;
      setIndicatorStyle(prev => ({
        ...prev,
        width: offsetWidth - 16, // Account for padding
        left: offsetLeft + 8,    // Center the indicator
        opacity: 1               // Fade in after initial render
      }));
    }
  }, []);

  // Set initial position and add resize observer
  React.useEffect(() => {
    setIsMounted(true);
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    
    // Initial update with slight delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 150);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [updateIndicator]);

  // Update indicator when children change (tabs switch)
  React.useEffect(() => {
    if (isMounted) {
      updateIndicator();
    }
  }, [children, updateIndicator, isMounted]);

  // Clone children to add ref to active tab
  const childrenWithRef = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props['data-state'] === 'active') {
      return React.cloneElement(child, { ref: activeTabRef } as any);
    }
    return child;
  });

  return (
    <div className={cn("relative w-full", containerClassName)}>
      <TabsPrimitive.List
        ref={(node) => {
          if (node) {
            listRef.current = node;
            if (ref) {
              if (typeof ref === 'function') {
                ref(node);
              } else {
                ref.current = node;
              }
            }
          }
        }}
        className={cn(
          "relative flex w-full overflow-x-auto pb-2 scrollbar-hide",
          "space-x-1 px-1",
          className
        )}
        {...props}
      >
        {childrenWithRef}
      </TabsPrimitive.List>
      <div 
        className={cn(
          "absolute bottom-1 h-1 bg-primary/90 rounded-full transition-all duration-300 ease-out",
          "shadow-lg shadow-primary/20",
          indicatorClassName
        )}
        style={{
          width: `${indicatorStyle.width}px`,
          transform: `translateX(${indicatorStyle.left}px)`,
          opacity: indicatorStyle.opacity,
          transitionProperty: 'width, transform, opacity',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDuration: '300ms'
        }}
      />
    </div>
  );
});

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-muted/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-foreground data-[state=active]:font-medium",
        "rounded-lg mx-0.5 first:ml-0 last:mr-0",
        "active:scale-95 transform transition-transform",
        className
      )}
      {...props}
    >
      <span className="flex items-center space-x-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
