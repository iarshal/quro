import { createClient } from '@supabase/supabase-js';

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback ?? '';
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabaseUrl() {
  return getRequiredEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
}

function getServiceRoleKey() {
  return getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function hasSupabaseServerEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return Boolean(url && serviceRoleKey);
}

export function createServerClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
