import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://jdjsbiwrvcfvboeevglp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkanNiaXdydmNmdmJvZWV2Z2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzA1ODksImV4cCI6MjA4NzQ0NjU4OX0.EZfdmO5XcouwcSI6FnzrO1Z7uXObv-AZ8EO4tvXXROQ'// Placeholder, user will need to provide real key if this fails

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

