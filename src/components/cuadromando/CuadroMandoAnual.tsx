import { Fragment, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  CuadroMandoData, Categoria, BloqueKey, MESES_CORTO,
  mergeWithDefaults, categoriaTotal, bloqueTotal, eur,
} from "./lib";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface MonthRow { mes: number; datos: unknown; }

interface Props {
  clienteId: string;
  anio: number;
  onSelectMonth: (mes: number) => void;
}

// Mapa mes(1-12) → datos (o null si no existe)
type MonthMap = Record<number, CuadroMandoData | null>;

const BLOQUES: { key: BloqueKey; label: string; kind: "gasto" | "ingreso" }[] = [
  { key: "gastos_fijos", label: "Gastos Fijos", kind: "gasto" },
  { key: "gastos_variables", label: "Gastos Variables", kind: "gasto" },
  { key: "ingresos_fijos", label: "Ingresos Fijos", kind: "ingreso" },
  { key: "ingresos_variables", label: "Ingresos Variables", kind: "ingreso" },
];

export function CuadroMandoAnual({ clienteId, anio, onSelectMonth }: Props) {
  const [months, setMonths] = useState<MonthMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: rows } = await sb
        .from("cuadros_mando")
        .select("mes, datos")
        .eq("cliente_id", clienteId)
        .eq("anio", anio);
      const map: MonthMap = {};
      for (let m = 1; m <= 12; m++) map[m] = null;
      for (const r of (rows as MonthRow[]) || []) {
        map[r.mes] = mergeWithDefaults(r.datos);
      }
      setMonths(map);
      setLoading(false);
    })();
  }, [clienteId, anio]);

  // Nombres de categoría por bloque (unión de todos los meses con datos)
  const catNamesByBloque = useMemo(() => {
    const result: Record<BloqueKey, string[]> = {
      gastos_fijos: [], gastos_variables: [], ingresos_fijos: [], ingresos_variables: [],
    };
    for (const { key } of BLOQUES) {
      const seen = new Set<string>();
      const order: string[] = [];
      for (let m = 1; m <= 12; m++) {
        const d = months[m];
        if (!d) continue;
        for (const c of d[key] as Categoria[]) {
          if (!seen.has(c.categoria)) { seen.add(c.categoria); order.push(c.categoria); }
        }
      }
      result[key] = order;
    }
    return result;
  }, [months]);

  // Total de una categoría (por nombre) en un mes concreto
  const catMonthTotal = (key: BloqueKey, nombre: string, mes: number): number | null => {
    const d = months[mes];
    if (!d) return null;
    const cats = (d[key] as Categoria[]).filter((c) => c.categoria === nombre);
    if (cats.length === 0) return null;
    return cats.reduce((s, c) => s + categoriaTotal(c), 0);
  };

  const bloqueMonthTotal = (key: BloqueKey, mes: number): number | null => {
    const d = months[mes];
    if (!d) return null;
    return bloqueTotal(d[key] as Categoria[]);
  };

  const resultadoMonth = (mes: number): number | null => {
    const d = months[mes];
    if (!d) return null;
    const gastos = bloqueTotal(d.gastos_fijos) + bloqueTotal(d.gastos_variables);
    const ingresos = bloqueTotal(d.ingresos_fijos) + bloqueTotal(d.ingresos_variables);
    return ingresos - gastos;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cell = "border-l border-border px-2 py-1.5 text-right tabular-nums whitespace-nowrap";
  const labelCell = "sticky left-0 z-10 bg-card px-3 py-1.5 text-left whitespace-nowrap";

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-max w-full text-xs">
        <thead className="bg-muted/40">
          <tr>
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground">Categoría</th>
            {MESES_CORTO.map((m, i) => (
              <th key={i} className="border-l border-border px-2 py-2 text-right font-medium text-muted-foreground">{m}</th>
            ))}
            <th className="border-l-2 border-primary/30 px-2 py-2 text-right font-semibold text-primary">Año</th>
          </tr>
        </thead>
        <tbody>
          {BLOQUES.map(({ key, label }) => {
            const names = catNamesByBloque[key];
            return (
              <Fragment key={key}>
                {/* Cabecera de bloque */}
                <tr className="bg-muted/20">
                  <td className={`${labelCell} bg-muted/20 text-[10px] font-bold uppercase tracking-wider text-primary`}>{label}</td>
                  {MESES_CORTO.map((_, i) => <td key={i} className="border-l border-border bg-muted/20" />)}
                  <td className="border-l-2 border-primary/30 bg-muted/20" />
                </tr>

                {/* Categorías del bloque */}
                {names.map((nombre) => {
                  let anual = 0;
                  return (
                    <tr key={`${key}-${nombre}`} className="border-b border-border/60 hover:bg-muted/10">
                      <td className={`${labelCell} text-muted-foreground`}>{nombre}</td>
                      {Array.from({ length: 12 }, (_, idx) => {
                        const mes = idx + 1;
                        const v = catMonthTotal(key, nombre, mes);
                        if (v !== null) anual += v;
                        return (
                          <td key={idx} className={cell}>
                            {v === null ? <span className="text-muted-foreground/40">—</span> : eur(v)}
                          </td>
                        );
                      })}
                      <td className={`${cell} border-l-2 border-primary/30 font-medium`}>{eur(anual)}</td>
                    </tr>
                  );
                })}

                {/* Subtotal del bloque */}
                <tr className="border-b border-border bg-muted/10 font-semibold">
                  <td className={`${labelCell} bg-muted/10`}>Total {label}</td>
                  {(() => {
                    let anual = 0;
                    return Array.from({ length: 12 }, (_, idx) => {
                      const mes = idx + 1;
                      const v = bloqueMonthTotal(key, mes);
                      if (v !== null) anual += v;
                      return (
                        <td key={idx} className={cell}>
                          {v === null ? <span className="text-muted-foreground/40">—</span> : eur(v)}
                        </td>
                      );
                    }).concat(
                      <td key="y" className={`${cell} border-l-2 border-primary/30`}>{eur(anual)}</td>
                    );
                  })()}
                </tr>
              </Fragment>
            );
          })}

          {/* Resultado mensual */}
          <tr className="border-t-2 border-primary bg-primary/5 font-bold">
            <td className={`${labelCell} bg-primary/5`}>Resultado</td>
            {(() => {
              let anual = 0;
              const tds = Array.from({ length: 12 }, (_, idx) => {
                const mes = idx + 1;
                const v = resultadoMonth(mes);
                if (v !== null) anual += v;
                const color = v === null ? "" : v > 0 ? "text-emerald-600" : v < 0 ? "text-red-600" : "";
                return (
                  <td key={idx} className={`${cell} ${color} cursor-pointer hover:underline`}
                    onClick={() => onSelectMonth(mes)} title={`Ir a ${MESES_CORTO[idx]} ${anio}`}>
                    {v === null ? <span className="text-muted-foreground/40">—</span> : eur(v)}
                  </td>
                );
              });
              tds.push(
                <td key="y" className={`${cell} border-l-2 border-primary/30 ${anual > 0 ? "text-emerald-600" : anual < 0 ? "text-red-600" : ""}`}>
                  {eur(anual)}
                </td>
              );
              return tds;
            })()}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
