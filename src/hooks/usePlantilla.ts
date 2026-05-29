import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePlantilla<T>(
  clienteId: string | null,
  tipo: string,
  defaultData: T
) {
  const [data, setDataState] = useState<T>(defaultData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const dataRef = useRef<T>(defaultData);
  const clienteIdRef = useRef(clienteId);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    clienteIdRef.current = clienteId;
  }, [clienteId]);

  // Load on client change
  useEffect(() => {
    if (!clienteId) {
      setDataState(defaultData);
      dataRef.current = defaultData;
      return;
    }
    setLoading(true);
    supabase
      .from("plantillas")
      .select("datos")
      .eq("cliente_id", clienteId)
      .eq("tipo", tipo)
      .maybeSingle()
      .then(({ data: row, error }) => {
        if (error) {
          console.error("Error loading plantilla:", error.message);
        } else if (row?.datos) {
          // Merge with defaults so newly-added fields always have a value
          const loaded = { ...defaultData, ...(row.datos as T) };
          setDataState(loaded);
          dataRef.current = loaded;
        } else {
          setDataState(defaultData);
          dataRef.current = defaultData;
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, tipo]);

  const persist = useCallback(
    async (payload: T, showToast = false) => {
      const cid = clienteIdRef.current;
      if (!cid) return;
      setSaving(true);
      const { error } = await supabase.from("plantillas").upsert(
        {
          cliente_id: cid,
          tipo,
          datos: payload as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "cliente_id,tipo" }
      );
      setSaving(false);
      if (error) {
        toast.error("Error al guardar");
        console.error(error);
      } else if (showToast) {
        toast.success("Guardado correctamente");
      }
    },
    [tipo]
  );

  const setData = useCallback(
    (newData: T) => {
      setDataState(newData);
      dataRef.current = newData;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => persist(newData), 2000);
    },
    [persist]
  );

  const saveNow = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    return persist(dataRef.current, true);
  }, [persist]);

  return { data, setData, saveNow, saving, loading };
}
