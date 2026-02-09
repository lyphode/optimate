/**
 * Re-export auth from state layer so UI may keep importing from @/contexts/AuthContext.
 * All auth implementation lives in @/state.
 */
export { AuthProvider, useAuth, type AuthContextType, type AppRole } from "@/state";
