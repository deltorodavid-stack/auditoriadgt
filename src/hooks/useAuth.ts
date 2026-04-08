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
    const syncUser = async (user: User) => {
      const { data } = await supabase
        .from("usuarios_cliente")
        .select("id")
        .eq("id", user.id)
        .single();
      if (!data) {
        await supabase.from("usuarios_cliente").insert({
          id: user.id,
          email: user.email,
        });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          loading: false,
          user: session?.user ?? null,
          session,
        });
        if (session?.user) {
          syncUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        loading: false,
        user: session?.user ?? null,
        session,
      });
      if (session?.user) {
        syncUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
