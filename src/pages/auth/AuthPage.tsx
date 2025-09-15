import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const { data: companySettings, isLoading: settingsLoading } = useCompanySettings();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-secondary/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          {settingsLoading ? (
            <div className="mx-auto w-16 h-16 mb-4">
              <Skeleton className="w-16 h-16 rounded-2xl" />
            </div>
          ) : (companySettings as any)?.auth_logo_url ? (
            <div className="mx-auto mb-4">
              <img 
                src={(companySettings as any).auth_logo_url} 
                alt={(companySettings as any).company_name ?? "Auth Logo"}
                style={{ 
                  width: `${(companySettings as any).logo_size_auth || 48}px`, 
                  height: `${(companySettings as any).logo_size_auth || 48}px` 
                }}
                className="object-contain"
                onError={(e) => {
                  // Hide the image and show the fallback logo if the image fails to load
                  const fallbackDiv = e.currentTarget.nextElementSibling;
                  if (fallbackDiv && fallbackDiv instanceof HTMLDivElement) {
                    e.currentTarget.style.display = 'none';
                    fallbackDiv.classList.remove('hidden');
                  }
                  // Log the error for debugging
                  const logoUrl = (companySettings as any)?.auth_logo_url;
                  console.error('❌ Auth logo failed to load:', logoUrl);
                }}
              />
              <div className="hidden mx-auto w-16 h-16 bg-primary flex items-center justify-center mb-4">
                <span className="text-primary-foreground font-bold text-2xl">C</span>
              </div>
            </div>
          ) : (companySettings as any)?.company_logo_url ? (
            <div className="mx-auto mb-4">
              <img 
                src={(companySettings as any).company_logo_url} 
                alt={(companySettings as any).company_name}
                style={{ 
                  width: `${(companySettings as any).logo_size_auth || 60}px`, 
                  height: `${(companySettings as any).logo_size_auth || 60}px` 
                }}
                className="object-contain"
                onError={(e) => {
                  console.error('❌ Company logo failed to load:', (companySettings as any).company_logo_url);
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden mx-auto w-16 h-16 bg-primary flex items-center justify-center mb-4">
                <span className="text-primary-foreground font-bold text-2xl">C</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-primary flex items-center justify-center mb-4">
              <span className="text-primary-foreground font-bold text-2xl">C</span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-foreground mb-1">
            {(companySettings as any)?.company_name || "Cutiepaw"}
          </h1>
          <p className="text-muted-foreground">Pet Apparel & Accessories Management</p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to your account to continue" 
                : "Create a new account to get started"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? <LoginForm /> : <SignUpForm />}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {isLogin ? "Sign up here" : "Sign in here"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Cutiepaw. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}