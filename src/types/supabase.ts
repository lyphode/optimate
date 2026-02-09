/**
 * Re-export Supabase-generated types so UI layer may import from @/types only.
 * State and integrations may still use @/integrations/supabase/types.
 */
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/integrations/supabase/types";
