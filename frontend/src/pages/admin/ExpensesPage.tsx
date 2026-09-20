import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, FileText, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Demo data
const expenseCategories = [
  { id: 1, name: '💼 Rent & Utilities', amount: 30000, lastMonth: 28000 },
  { id: 2, name: '👥 Staff', amount: 25000, lastMonth: 23000 },
  { id: 3, name: '🧴 Products', amount: 15000, lastMonth: 14000 },
  { id: 4, name: '🛠️ Maintenance', amount: 8000, lastMonth: 7500 },
  { id: 5, name: '📢 Marketing', amount: 5000, lastMonth: 6000 },
  { id: 6, name: '📝 Admin', amount: 2420, lastMonth: 2200 },
];

const recentExpenses = [
  { id: 1, date: '29 Jul 2023', category: 'Rent', description: 'Monthly Rent', amount: 25000, shop: 'Main Branch', hasReceipt: true },
  { id: 2, date: '28 Jul 2023', category: 'Products', description: 'Hair Color', amount: 3500, shop: 'All Branches', hasReceipt: true },
  { id: 3, date: '27 Jul 2023', category: 'Staff', description: 'Salary - Stylist', amount: 12000, shop: 'Downtown', hasReceipt: true },
  { id: 4, date: '25 Jul 2023', category: 'Marketing', description: 'Social Media Ads', amount: 2000, shop: 'All Branches', hasReceipt: true },
  { id: 5, date: '20 Jul 2023', category: 'Maintenance', description: 'AC Repair', amount: 4500, shop: 'Main Branch', hasReceipt: true },
];

interface ExpensesPageProps {
  selectedShop: string;
  onShopChange: (shopId: string) => void;
  shops: Record<string, string>;
  isLoading: boolean;
}

export function ExpensesPage({ selectedShop: _selectedShop, onShopChange: _onShopChange, shops: _shops, isLoading: _isLoading }: ExpensesPageProps) {
  const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const topCategory = [...expenseCategories].sort((a, b) => b.amount - a.amount)[0];
  const avgDailyExpense = Math.round(totalExpenses / 30);
  const vsLastMonth = Math.round(((totalExpenses - 85420) / 85420) * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track and manage all expenses across your salons
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5" />
            This Month
          </Button>
          <Button size="sm" className="gap-1 text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="col-span-1">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="text-lg sm:text-2xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">across all categories</p>
          </CardHeader>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Top Category</CardTitle>
            <div className="text-lg sm:text-2xl font-bold">{topCategory.name.split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((topCategory.amount / totalExpenses) * 100)}% of total
            </p>
          </CardHeader>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Daily</CardTitle>
            <div className="text-lg sm:text-2xl font-bold">₹{avgDailyExpense.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground">spent per day</p>
          </CardHeader>
        </Card>
        <Card className="col-span-1">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">vs Last Month</CardTitle>
            <div className={`text-lg sm:text-2xl font-bold ${vsLastMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {vsLastMonth >= 0 ? '▲' : '▼'} {Math.abs(vsLastMonth)}%
            </div>
            <p className="text-xs text-muted-foreground">{vsLastMonth >= 0 ? 'Increase' : 'Decrease'}</p>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="recent">Recent Expenses</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Monthly expense breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">This Month</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Last Month</TableHead>
                      <TableHead className="text-right hidden md:table-cell">% of Total</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseCategories.map((category) => {
                      const change = Math.round(((category.amount - category.lastMonth) / category.lastMonth) * 100);
                      const percentage = Math.round((category.amount / totalExpenses) * 100);
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-right">₹{category.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right hidden sm:table-cell">₹{category.lastMonth.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">{percentage}%</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={change >= 0 ? 'secondary' : 'destructive'} className="gap-1">
                              {change >= 0 ? '🔺' : '🔽'} {Math.abs(change)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Charts */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Expenses Trend</CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { month: 'Feb', amount: 72000 },
                          { month: 'Mar', amount: 78000 },
                          { month: 'Apr', amount: 82000 },
                          { month: 'May', amount: 85420 },
                          { month: 'Jun', amount: 89000 },
                          { month: 'Jul', amount: 92420 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                        <Bar dataKey="amount" fill="#8884d8" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Expense Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription>This month's spending by category</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategories.map(cat => ({
                            name: cat.name.split(' ')[0],
                            value: cat.amount,
                            percentage: Math.round((cat.amount / totalExpenses) * 100)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {expenseCategories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 70%)`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Expenses Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Latest expense transactions</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden sm:table-cell">Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Shop</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.date}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="hidden sm:table-cell">{expense.description}</TableCell>
                        <TableCell className="text-right">₹{expense.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="hidden sm:table-cell">{expense.shop}</TableCell>
                        <TableCell className="text-right">
                          {expense.hasReceipt && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <FileText className="h-4 w-4" />
                              <span className="sr-only">View receipt</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
