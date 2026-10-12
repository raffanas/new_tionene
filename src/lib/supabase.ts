import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pfsgpsvbsfowrtcyckcm.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmc2dwc3Zic2Zvd3J0Y3lja2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzAxMzksImV4cCI6MjEwMjE0NjEzOX0.NtmEGdj7-4ygmHJJmCyY1tzr5yA_3sAe56h0kH2hQKc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
  },
});
