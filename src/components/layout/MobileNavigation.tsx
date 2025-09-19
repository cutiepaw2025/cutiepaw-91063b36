import { NavLink } from "react-router-dom";
import { Home, Users, Factory, Warehouse, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "CRM", url: "/crm/leads", icon: Users },
  { title: "Manufacturing", url: "/manufacturing/bom", icon: Factory },
  { title: "Inventory", url: "/inventory/dashboard", icon: Warehouse },
  { title: "Accounts", url: "/accounts/dashboard", icon: Calculator },
];

export function MobileNavigation() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <nav className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}