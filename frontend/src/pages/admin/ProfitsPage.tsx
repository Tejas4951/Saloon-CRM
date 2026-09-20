import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, ArrowUp, TrendingUp, Users, Repeat, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Demo data
const profitData = {
  totalRevenue: 245000,
  totalExpenses: 85420,
  netProfit: 159580,
  profitMargin: 65,
  lastMonth: {
    revenue: 220000,
    profit: 140000,
    margin: 63.6
  },
  topServices: [
    { id: 1, name: 'Haircut & Styling', revenue: 65000, appointments: 130, avgTicket: 500 },
    { id: 2, name: 'Hair Color', revenue: 48000, appointments: 60, avgTicket: 800 },
    { id: 3, name: 'Facial', revenue: 32000, appointments: 80, avgTicket: 400 },
    { id: 4, name: 'Hair Treatment', revenue: 25000, appointments: 50, avgTicket: 500 },
    { id: 5, name: 'Waxing', revenue: 15000, appointments: 75, avgTicket: 200 },
  ],
  revenueBreakdown: {
    service: 185000,
    products: 45000,
    memberships: 15000
  },
  metrics: {
    avgDailyRevenue: 8167,
    customerCount: 395,
    avgSpend: 620,
    repeatRate: 68
  }
};

interface ProfitsPageProps {
  selectedShop: string;
  onShopChange: (shopId: string) => void;
  shops: Record<string, string>;
  isLoading: boolean;
}

export function ProfitsPage({ selectedShop: _selectedShop, onShopChange: _onShopChange, shops: _shops, isLoading: _isLoading }: ProfitsPageProps) {
  // Calculate derived values
  const revenueGrowth = Math.round(((profitData.totalRevenue - profitData.lastMonth.revenue) / profitData.lastMonth.revenue) * 100);
  const profitGrowth = Math.round(((profitData.netProfit - profitData.lastMonth.profit) / profitData.lastMonth.profit) * 100);
  const marginChange = (profitData.profitMargin - profitData.lastMonth.margin).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Profits</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            View profit reports and analytics for your salons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-3.5 w-3.5" />
            This Month
          </Button>
          <Button size="sm" className="gap-1">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold">₹{profitData.totalRevenue.toLocaleString('en-IN')}</div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <ArrowUp className="h-3 w-3 mr-1" />
                {revenueGrowth}% from last month
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold">₹{profitData.netProfit.toLocaleString('en-IN')}</div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <ArrowUp className="h-3 w-3 mr-1" />
                {profitGrowth}% from last month
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold">{profitData.profitMargin}%</div>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <ArrowUp className="h-3 w-3 mr-1" />
                {marginChange}% from last month
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Daily Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-2xl font-bold">₹{profitData.metrics.avgDailyRevenue.toLocaleString('en-IN')}</div>
              <p className="text-xs text-muted-foreground">based on {profitData.metrics.customerCount} customers</p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-lg mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Top Services</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Overview</CardTitle>
              <CardDescription>Monthly performance and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { month: 'Feb', revenue: 195000, profit: 125000, expenses: 70000 },
                      { month: 'Mar', revenue: 205000, profit: 130000, expenses: 75000 },
                      { month: 'Apr', revenue: 220000, profit: 140000, expenses: 80000 },
                      { month: 'May', revenue: 235000, profit: 150000, expenses: 85000 },
                      { month: 'Jun', revenue: 240000, profit: 155000, expenses: 85000 },
                      { month: 'Jul', revenue: 245000, profit: 159580, expenses: 85420 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                    <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
              <CardDescription>Revenue and performance by service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Appointments</TableHead>
                      <TableHead className="text-right">Avg. Ticket</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData.topServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="text-right">₹{service.revenue.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell">{service.appointments}</TableCell>
                        <TableCell className="text-right">₹{service.avgTicket.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((service.revenue / profitData.totalRevenue) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Breakdown Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
                <CardDescription>Breakdown of revenue by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Services', value: profitData.revenueBreakdown.service, color: '#8884d8' },
                        { name: 'Products', value: profitData.revenueBreakdown.products, color: '#82ca9d' },
                        { name: 'Memberships', value: profitData.revenueBreakdown.memberships, color: '#ffc658' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#8884d8" />
                      <Cell fill="#82ca9d" />
                      <Cell fill="#ffc658" />
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Services', value: profitData.revenueBreakdown.service, color: 'bg-[#8884d8]' },
                      { name: 'Products', value: profitData.revenueBreakdown.products, color: 'bg-[#82ca9d]' },
                      { name: 'Memberships', value: profitData.revenueBreakdown.memberships, color: 'bg-[#ffc658]' },
                    ].map((item) => {
                      const percentage = Math.round((item.value / profitData.totalRevenue) * 100);
                      return (
                        <div key={item.name} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm">₹{item.value.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color}`} 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-right text-muted-foreground">{percentage}% of total</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Customers</p>
                      <p className="text-2xl font-bold">{profitData.metrics.customerCount}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Avg. Spend</p>
                      <p className="text-2xl font-bold">₹{profitData.metrics.avgSpend}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                      <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Repeat Rate</p>
                      <p className="text-2xl font-bold">{profitData.metrics.repeatRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Profit Margin</p>
                      <p className="text-2xl font-bold">{profitData.profitMargin}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
