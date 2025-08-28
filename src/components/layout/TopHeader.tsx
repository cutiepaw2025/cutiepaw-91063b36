import { useState, useEffect } from "react";
import { Bell, User, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { Skeleton } from "@/components/ui/skeleton";

export function TopHeader() {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent transition-colors" />
        
        {/* Header Logo */}
        {companySettings?.header_logo_url && (
          <div className="hidden md:flex items-center">
            <img 
              src={companySettings.header_logo_url} 
              alt={companySettings.company_name}
              style={{ width: `${companySettings.logo_size_header}px`, height: `${companySettings.logo_size_header}px` }}
              className="object-contain"
            />
          </div>
        )}
        
        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}!
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(userProfile?.full_name || 'User')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {userProfile?.role || 'user'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}