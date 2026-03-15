import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export interface UsuarioCliente {
  id: string;
  cliente_id: string;
  nombre: string;
  email: string;
  token_acceso: string;
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
      setState({ loading: false, error: "No se proporcionó un token de acceso.", usuario: null });
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
        setState({ loading: false, error: "Token de acceso inválido.", usuario: null });
      } else {
        setState({ loading: false, error: null, usuario: data as UsuarioCliente });
      }
    };

    validate();
  }, [token]);

  return state;
}
