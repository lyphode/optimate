import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "manager" | "operator";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  signOut: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, options?: { fullName?: string }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching roles:", error);
        return [];
      }

      return (data || []).map((r) => r.role as AppRole);
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const userRoles = await fetchUserRoles(session.user.id);
          setRoles(userRoles);
          setIsLoading(false);
        }, 0);
      } else {
        setRoles([]);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRoles(session.user.id).then((userRoles) => {
          setRoles(userRoles);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    options?: { fullName?: string }
  ): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: options?.fullName ? { full_name: options.fullName } : undefined,
      },
    });
    return { error: error as Error | null };
  };

  const value: AuthContextType = {
    user,
    session,
    roles,
    isLoading,
    hasRole,
    isAdmin: hasRole("admin"),
    isManager: hasRole("manager"),
    isOperator: hasRole("operator"),
    signOut,
    signInWithPassword,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
