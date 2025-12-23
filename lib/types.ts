// Minimal placeholder types for Supabase auth helper
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
// Minimal placeholder for Supabase generated types; extend as needed.
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]
export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

