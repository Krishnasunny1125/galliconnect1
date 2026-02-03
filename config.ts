
/**
 * TO ENABLE GLOBAL REAL-TIME CAPABILITIES:
 * 
 * 1. DATABASE (Supabase):
 *    - Go to https://supabase.com/
 *    - Create a project and get your Project URL and Anon Key.
 *    - Create tables: users, shops, products, orders.
 *    - Enable Realtime on the "orders" table.
 * 
 * 2. EMAIL (EmailJS):
 *    - Connect your Gmail (absunny1125@gmail.com) at https://www.emailjs.com/
 */

export const REALTIME_CONFIG = {
  // Supabase Configuration
  SUPABASE_CONFIG: {
    url: "https://qrcbldvhhaexizuofbxr.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyY2JsZHZoaGFleGl6dW9mYnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDIzNzEsImV4cCI6MjA4NTY3ODM3MX0.sYv1cnboOUmG0GCToHWr6jKvXIhZVFguNK1FzhrkhME"
  },

  // EmailJS Configuration
  EMAILJS_SERVICE_ID: "service_shwlu9x", 
  EMAILJS_TEMPLATE_ID: "template_z50mp1f", 
  EMAILJS_PUBLIC_KEY: "kfK2rukawzzazogpU", 
  
  SENDER_EMAIL: "absunny1125@gmail.com"
};
