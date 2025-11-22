import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yupijhwsiqejapufdwhk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cGlqaHdzaXFlamFwdWZkd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg3ODksImV4cCI6MjA3OTMzNDc4OX0.MQ1NIAf7i6IDafS0avwYoo2O4DDQ4hLdnlS1nHW_2A4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);