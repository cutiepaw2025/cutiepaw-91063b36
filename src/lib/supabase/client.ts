import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || (window as any).SUPABASE_URL || "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).SUPABASE_ANON_KEY || "";

let supabase: any;

if (!url || !anonKey) {
  // Avoid crashing the app when envs are missing; defer failure to first usage with a clear message
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  const errorMessage =
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local.";
  supabase = new Proxy(
    {},
    {
      get() {
        throw new Error(errorMessage);
      },
      apply() {
        throw new Error(errorMessage);
      },
    }
  );
} else {
  supabase = createClient(url, anonKey, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export default supabase;


