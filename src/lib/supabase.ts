import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  filename: string;
  title: string;
  author: string;
  abstract: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversionLog {
  id: string;
  document_id: string;
  status: 'success' | 'failure' | 'in_progress';
  error_message: string | null;
  html_output_path: string | null;
  conversion_duration_ms: number | null;
  created_at: string;
}
