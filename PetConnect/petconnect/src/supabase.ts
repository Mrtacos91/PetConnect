import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sspehvekjwrwscgskycd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcGVodmVrandyd3NjZ3NreWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNjcxMDUsImV4cCI6MjA1NTY0MzEwNX0.gfO6_TNfmEDK2KOvjp_TJu2k6u5XuTJFRw7yLklvihU";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
