
/**
 * GALLICONNECT CONFIGURATION
 * 
 * Recommendation for Vercel:
 * Add these keys to Project Settings > Environment Variables in the Vercel Dashboard.
 */

export const REALTIME_CONFIG = {
  // Supabase Configuration
  SUPABASE_CONFIG: {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || "https://qrcbldvhhaexizuofbxr.supabase.co",
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyY2JsZHZoaGFleGl6dW9mYnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDIzNzEsImV4cCI6MjA4NTY3ODM3MX0.sYv1cnboOUmG0GCToHWr6jKvXIhZVFguNK1FzhrkhME"
  },

  // EmailJS Configuration
  EMAILJS_SERVICE_ID: (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "service_shwlu9x", 
  EMAILJS_TEMPLATE_ID: (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "template_z50mp1f", 
  EMAILJS_PUBLIC_KEY: (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "kfK2rukawzzazogpU", 
  
  SENDER_EMAIL: "absunny1125@gmail.com"
};
