import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  loading: boolean;
  user: User | null;
  session: Session | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    session: null,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          loading: false,
          user: session?.user ?? null,
          session,
        });
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        loading: false,
        user: session?.user ?? null,
        session,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
