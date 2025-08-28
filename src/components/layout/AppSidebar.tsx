import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, ShoppingCart, FileText, Receipt, 
  Package, Factory, Warehouse, Calculator,
  Database, Megaphone, UsersIcon, Settings,
  ChevronDown, Home, Quote, FileSpreadsheet,
  UserCheck, HeartHandshake, MessageSquare,
  ScrollText, ShoppingBag, Truck, Box,
  BarChart3, ArrowUpDown, ArrowDownUp, DollarSign,
  CreditCard, TrendingUp, Scale, Shirt,
  Palette, Layers, Building2, Video,
  BookOpen, Rss, UserPlus, Building,
  Award, Briefcase, Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "CRM",
    icon: Users,
    items: [
      { title: "Leads", url: "/crm/leads", icon: UserCheck },
      { title: "Orders", url: "/crm/orders", icon: ShoppingCart },
      { title: "Quote", url: "/crm/quotes", icon: Quote },
      { title: "Invoices", url: "/crm/invoices", icon: FileSpreadsheet },
      { title: "Customers", url: "/crm/customers", icon: UsersIcon },
      { title: "Franchise", url: "/crm/franchise", icon: HeartHandshake },
      { title: "Support", url: "/crm/support", icon: MessageSquare },
    ],
  },
  {
    title: "Manufacturing",
    icon: Factory,
    items: [
      { title: "Bills of Material", url: "/manufacturing/bom", icon: ScrollText },
      { title: "Procurement", url: "/manufacturing/procurement", icon: ShoppingBag },
      { title: "Purchase Orders", url: "/manufacturing/purchase-orders", icon: FileText },
      { title: "Suppliers", url: "/manufacturing/suppliers", icon: Truck },
    ],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    items: [
      { title: "Dashboard", url: "/inventory/dashboard", icon: BarChart3 },
      { title: "Goods Receipt Note", url: "/inventory/grn", icon: Receipt },
      { title: "Material IN", url: "/inventory/material-in", icon: ArrowDownUp },
      { title: "Material Out", url: "/inventory/material-out", icon: ArrowUpDown },
    ],
  },
  {
    title: "Accounts",
    icon: Calculator,
    items: [
      { title: "Dashboard", url: "/accounts/dashboard", icon: BarChart3 },
      { title: "Sales", url: "/accounts/sales", icon: TrendingUp },
      { title: "Purchase", url: "/accounts/purchase", icon: ShoppingCart },
      { title: "Receipt", url: "/accounts/receipt", icon: CreditCard },
      { title: "Payments", url: "/accounts/payments", icon: DollarSign },
      { title: "Expenses", url: "/accounts/expenses", icon: Receipt },
      { title: "Trial Balance", url: "/accounts/trial-balance", icon: Scale },
    ],
  },
  {
    title: "Masters",
    icon: Database,
    items: [
      { title: "Product Master", url: "/masters/products", icon: Box },
      { title: "Product Category Master", url: "/masters/categories", icon: Layers },
      { title: "Size Master", url: "/masters/sizes", icon: Shirt },
      { title: "Fabric Master", url: "/masters/fabrics", icon: Palette },
      { title: "Warehouse Master", url: "/masters/warehouses", icon: Building2 },
    ],
  },
  {
    title: "Promotional Assets",
    icon: Megaphone,
    items: [
      { title: "Products", url: "/promotional/products", icon: Box },
      { title: "Catalogues", url: "/promotional/catalogues", icon: BookOpen },
      { title: "Videos", url: "/promotional/videos", icon: Video },
      { title: "Feeds", url: "/promotional/feeds", icon: Rss },
    ],
  },
  {
    title: "Teams",
    icon: UsersIcon,
    items: [
      { title: "People", url: "/teams/people", icon: UserPlus },
      { title: "Departments", url: "/teams/departments", icon: Building },
      { title: "Designations", url: "/teams/designations", icon: Award },
    ],
  },
  {
    title: "Configurations",
    icon: Settings,
    items: [
      { title: "Company Setup", url: "/settings/company", icon: Briefcase },
      { title: "Sequences Setup", url: "/config/sequences", icon: Zap },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>([]); // Start with no groups open
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? [] // Close all if clicking on already open group
        : [title] // Close others, open only this one
    );
  };

  const isRouteActive = (url: string) => location.pathname === url;
  const isGroupActive = (items: any[]) => items.some(item => isRouteActive(item.url));

  const collapsed = state === "collapsed";

  // Auto-open the group containing the current active route
  useEffect(() => {
    const activeGroup = navigationItems.find(item => 
      item.items && item.items.some(subItem => isRouteActive(subItem.url))
    );
    
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups([activeGroup.title]);
    }
  }, [location.pathname]);

  return (
    <Sidebar className={cn("transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <SidebarContent className="bg-sidebar-background">
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            {settingsLoading ? (
              <Skeleton className="w-8 h-8 rounded-lg" />
            ) : companySettings?.sidebar_logo_url ? (
              <img 
                src={companySettings.sidebar_logo_url} 
                alt={companySettings.company_name}
                style={{ width: `${companySettings.logo_size_sidebar}px`, height: `${companySettings.logo_size_sidebar}px` }}
                className="object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
            )}
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">
                {companySettings?.company_name || "Cutiepaw"}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="py-2">
          {navigationItems.map((item) => (
            <div key={item.title}>
              {item.items ? (
                <Collapsible
                  open={openGroups.includes(item.title)}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <SidebarGroup>
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className={cn(
                        "group/label text-sm font-medium px-3 py-2 hover:bg-sidebar-accent rounded-md transition-colors cursor-pointer flex items-center justify-between",
                        isGroupActive(item.items) && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}>
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-sidebar-foreground" />
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            openGroups.includes(item.title) && "rotate-180"
                          )} />
                        )}
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    {!collapsed && (
                      <CollapsibleContent>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {item.items.map((subItem) => (
                              <SidebarMenuItem key={subItem.title}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={subItem.url}
                                    className={cn(
                                      "flex items-center gap-3 px-6 py-2 text-sm hover:bg-sidebar-accent rounded-md transition-all duration-200",
                                      isRouteActive(subItem.url) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm"
                                    )}
                                  >
                                    <subItem.icon className="w-4 h-4" />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </CollapsibleContent>
                    )}
                  </SidebarGroup>
                </Collapsible>
              ) : (
                <SidebarGroup>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm hover:bg-sidebar-accent rounded-md transition-all duration-200",
                            isRouteActive(item.url) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-sm"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              )}
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}