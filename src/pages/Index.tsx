import { useState, useEffect } from "react";
import { BarChart3, Users, ShoppingCart, Package, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabase/client";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });

  // Fetch company settings
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch basic stats (you can expand this with real data)
      const { data: customers } = await supabase.from('customers').select('id', { count: 'exact' });
      const { data: orders } = await supabase.from('orders').select('id', { count: 'exact' });
      const { data: products } = await supabase.from('products').select('id', { count: 'exact' });
      
      setStats({
        totalCustomers: customers?.length || 0,
        totalOrders: orders?.length || 0,
        totalProducts: products?.length || 0,
        totalRevenue: 125000, // Placeholder
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      description: "+12% from last month",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      description: "+8% from last month",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      description: "+15% from last month",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Products",
      value: stats.totalProducts.toString(),
      description: "+3 new this month",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/20 to-secondary/10 rounded-2xl p-6 border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">
              Welcome to {companySettings?.company_name || "Cutiepaw"} Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Your comprehensive pet apparel & accessories management system
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {settingsLoading ? (
              <Skeleton className="w-20 h-20 rounded-2xl" />
            ) : companySettings?.company_logo_url ? (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-background border border-border/50 overflow-hidden">
                <img 
                  src={companySettings.company_logo_url} 
                  alt={companySettings.company_name}
                  style={{ 
                    width: `${Math.min(companySettings.logo_size_auth, 80)}px`, 
                    height: `${Math.min(companySettings.logo_size_auth, 80)}px` 
                  }}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-3xl">C</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              CRM Overview
            </CardTitle>
            <CardDescription>
              Manage leads, customers, and franchise partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              • {stats.totalCustomers} Active Customers
              <br />
              • {stats.totalOrders} Total Orders
              <br />
              • 15 Active Leads
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Inventory Status
            </CardTitle>
            <CardDescription>
              Current stock levels and movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              • {stats.totalProducts} Products
              <br />
              • 850 Items in Stock
              <br />
              • 12 Low Stock Alerts
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>
              Performance metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              • 23% Growth This Month
              <br />
              • ₹2.5L Monthly Revenue
              <br />
              • 4.8/5 Customer Rating
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates across your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New order received</p>
                <p className="text-xs text-muted-foreground">Order #CUT-2024-001 - ₹2,500</p>
              </div>
              <span className="text-xs text-muted-foreground">2 min ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Lead converted to customer</p>
                <p className="text-xs text-muted-foreground">Mumbai Pet Store</p>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Low stock alert</p>
                <p className="text-xs text-muted-foreground">Pet Sweater - Size M (5 remaining)</p>
              </div>
              <span className="text-xs text-muted-foreground">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
