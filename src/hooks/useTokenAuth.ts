import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface UsuarioCliente {
  id: string;
  cliente_id: string | null;
  nombre_usuario: string | null;
  email: string | null;
  token_acceso: string | null;
  ultimo_bloque_completado: number | null;
  finalizado: boolean | null;
}

interface AuthState {
  loading: boolean;
  error: string | null;
  usuario: UsuarioCliente | null;
}

export function useTokenAuth(): AuthState {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<AuthState>({
    loading: true,
    error: null,
    usuario: null,
  });

  useEffect(() => {
    if (!token) {
      setState({
        loading: false,
        error: "Por favor, accede mediante el enlace único que se te ha proporcionado.",
        usuario: null,
      });
      return;
    }

    const validate = async () => {
      const { data, error } = await supabase
        .from("usuarios_cliente")
        .select("*")
        .eq("token_acceso", token)
        .maybeSingle();

      if (error) {
        setState({ loading: false, error: "Error al validar el token.", usuario: null });
      } else if (!data) {
        setState({
          loading: false,
          error: "Por favor, accede mediante el enlace único que se te ha proporcionado.",
          usuario: null,
        });
      } else {
        setState({ loading: false, error: null, usuario: data as UsuarioCliente });
      }
    };

    validate();
  }, [token]);

  return state;
}
