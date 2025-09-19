import { useQuery } from "@tanstack/react-query";
import supabase from "@/lib/supabase/client";

interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_pincode: string | null;
  company_gstin: string | null;
  company_phone: string | null;
  company_email: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  company_logo_url: string | null;
  auth_logo_url: string | null;
  sidebar_logo_url: string | null;
  header_logo_url: string | null;
  favicon_url: string | null;
  logo_size_auth: number;
  logo_size_header: number;
  logo_size_sidebar: number;
  logo_size_favicon: number;
  created_at: string | null;
  updated_at: string | null;
}

const defaultSettings: Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'> = {
  company_name: "Cutiepaw",
  company_address: null,
  company_city: null,
  company_state: null,
  company_pincode: null,
  company_gstin: null,
  company_phone: null,
  company_email: null,
  bank_name: null,
  account_number: null,
  ifsc_code: null,
  branch: null,
  company_logo_url: null,
  auth_logo_url: null,
  sidebar_logo_url: null,
  header_logo_url: null,
  favicon_url: null,
  logo_size_auth: 48,
  logo_size_header: 24,
  logo_size_sidebar: 28,
  logo_size_favicon: 32, // Standard favicon size
};

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      if (!data) {
        // Create default settings if none exist
        const { data: newSettings, error: createError } = await supabase
          .from('company_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        return newSettings;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
