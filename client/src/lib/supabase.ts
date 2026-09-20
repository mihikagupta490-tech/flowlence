import { createClient } from "@supabase/supabase-js";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = configuredSupabaseUrl?.replace(/\/(?:rest|auth)\/v1\/?$/, "");
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Flowlence is missing its Supabase environment configuration.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
