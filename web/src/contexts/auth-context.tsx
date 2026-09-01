"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial active session check
    async function initSession() {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error("Authentication Failed", {
          description: error.message,
        });
        return { error };
      }
      toast.success("Welcome Back", {
        description: `Signed in as ${email}`,
      });
      return { error: null };
    } catch (err) {
      const authError = err as AuthError;
      toast.error("Unexpected Error", {
        description: authError.message || "Failed to sign in.",
      });
      return { error: authError };
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Sign Up Failed", {
          description: error.message,
        });
        return { error };
      }

      toast.success("Account Created", {
        description: "Please check your email to confirm your account.",
      });
      return { error: null };
    } catch (err) {
      const authError = err as AuthError;
      toast.error("Sign Up Error", {
        description: authError.message || "Failed to sign up.",
      });
      return { error: authError };
    }
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(`OAuth ${provider} Error`, {
          description: error.message,
        });
      }
    } catch (err) {
      console.error(`OAuth ${provider} exception:`, err);
      toast.error("OAuth Initialization Failed");
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.info("Signed Out", {
        description: "You have been logged out of the Studio.",
      });
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
