import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CuadroMandoData, makeDefaultData, mergeWithDefaults } from "./lib";

// El cliente generado no tipa la tabla nueva; accedemos sin tipos estrictos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface PriorRow {
  mes: number;
  anio: number;
  datos: unknown;
  umbral_rentabilidad: number | null;
}

/**
 * Hook del Cuadro de Mando mensual con herencia automática del mes anterior.
 *
 * - Si el mes (cliente, mes, anio) tiene fila propia en BD → la usa.
 * - Si no existe → hereda del mes anterior más reciente (solo visual, `inherited=true`).
 * - En cuanto el usuario modifica algo (setData/setUmbral) se crea la fila propia
 *   del mes con los datos heredados + las modificaciones (autosave 2s).
 * - Los meses anteriores nunca se tocan.
 */
export function useCuadroMando(clienteId: string | null, mes: number, anio: number) {
  const [data, setDataState] = useState<CuadroMandoData>(makeDefaultData());
  const [umbral, setUmbralState] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inherited, setInherited] = useState(false);

  const dataRef = useRef<CuadroMandoData>(data);
  const umbralRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctx = useRef({ clienteId, mes, anio });
  ctx.current = { clienteId, mes, anio };

  // ── Carga / herencia ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!clienteId) {
      const d = makeDefaultData();
      setDataState(d); dataRef.current = d;
      setUmbralState(0); umbralRef.current = 0;
      setInherited(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      // 1) ¿Existe fila propia para este mes?
      const { data: row } = await sb
        .from("cuadros_mando")
        .select("datos, umbral_rentabilidad")
        .eq("cliente_id", clienteId)
        .eq("mes", mes)
        .eq("anio", anio)
        .maybeSingle();

      if (cancelled) return;

      if (row) {
        const d = mergeWithDefaults(row.datos);
        setDataState(d); dataRef.current = d;
        const u = Number(row.umbral_rentabilidad) || 0;
        setUmbralState(u); umbralRef.current = u;
        setInherited(false);
        setLoading(false);
        return;
      }

      // 2) No existe → buscar el mes anterior más reciente con datos
      const { data: rows } = await sb
        .from("cuadros_mando")
        .select("mes, anio, datos, umbral_rentabilidad")
        .eq("cliente_id", clienteId);

      if (cancelled) return;

      const prior = ((rows as PriorRow[]) || [])
        .filter((r) => r.anio < anio || (r.anio === anio && r.mes < mes))
        .sort((a, b) => b.anio - a.anio || b.mes - a.mes)[0];

      if (prior) {
        const d = mergeWithDefaults(prior.datos);
        setDataState(d); dataRef.current = d;
        const u = Number(prior.umbral_rentabilidad) || 0;
        setUmbralState(u); umbralRef.current = u;
        setInherited(true);
      } else {
        const d = makeDefaultData();
        setDataState(d); dataRef.current = d;
        setUmbralState(0); umbralRef.current = 0;
        setInherited(false);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [clienteId, mes, anio]);

  // ── Persistencia ─────────────────────────────────────────────────────────────
  const persist = useCallback(async (d: CuadroMandoData, u: number, showToast = false) => {
    const { clienteId: cid, mes: m, anio: a } = ctx.current;
    if (!cid) return;
    setSaving(true);
    const { error } = await sb.from("cuadros_mando").upsert(
      {
        cliente_id: cid, mes: m, anio: a,
        datos: d, umbral_rentabilidad: u,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cliente_id,mes,anio" }
    );
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Error al guardar");
    } else {
      setInherited(false);
      if (showToast) toast.success("Guardado correctamente");
    }
  }, []);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(dataRef.current, umbralRef.current), 2000);
  }, [persist]);

  const setData = useCallback((d: CuadroMandoData) => {
    setDataState(d); dataRef.current = d;
    setInherited(false);
    schedule();
  }, [schedule]);

  const setUmbral = useCallback((u: number) => {
    setUmbralState(u); umbralRef.current = u;
    setInherited(false);
    schedule();
  }, [schedule]);

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    return persist(dataRef.current, umbralRef.current, true);
  }, [persist]);

  return { data, umbral, setData, setUmbral, saveNow, saving, loading, inherited };
}
