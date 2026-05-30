import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  FieldHint,
  type NoClientProps,
} from "./shared";

const MESES = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];

interface Fila {
  id: string;
  responsable: string;
  indicador: string;
  meta: string;
  meses: Record<string, string>;
}

interface Data {
  filas: Fila[];
}

const DEFAULT_ROWS: string[] = [
  "Leads",
  "Clientes altas",
  "Clientes bajas",
  "Ingresos mes",
  "Gastos mes",
  "Pagos pendientes",
  "Cobros pendientes",
  "Tareas activas",
  "Tareas atrasadas",
];

// Factory function — nunca a nivel de módulo para evitar errores de inicialización
function makeDefaultData(): Data {
  return {
    filas: DEFAULT_ROWS.map((nombre, i) => ({
      id: `default-${i}-${Date.now()}`,
      responsable: "",
      indicador: nombre,
      meta: "",
      meses: Object.fromEntries(MESES.map((m) => [m, ""])),
    })),
  };
}

export function Indicadores({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "indicadores",
    makeDefaultData()
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addFila = () =>
    setData({
      filas: [
        ...data.filas,
        {
          id: crypto.randomUUID(),
          responsable: "",
          indicador: "",
          meta: "",
          meses: Object.fromEntries(MESES.map((m) => [m, ""])),
        },
      ],
    });

  const removeFila = (id: string) =>
    setData({ filas: data.filas.filter((f) => f.id !== id) });

  const updateFila = (id: string, patch: Partial<Fila>) =>
    setData({ filas: data.filas.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const updateMes = (id: string, mes: string, val: string) => {
    const fila = data.filas.find((f) => f.id === id);
    if (!fila) return;
    updateFila(id, { meses: { ...fila.meses, [mes]: val } });
  };

  return (
    <div className="max-w-full">
      <PrintHeader title="Indicadores / Cuadro de Mando" subtitle={clienteNombre} />
      <div className="flex items-start justify-between mb-4 print:hidden">
        <div>
          <h1 className="text-xl font-display font-bold">Indicadores / Cuadro de Mando</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <PrintButton />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={addFila}>
            <Plus className="h-4 w-4 mr-1.5" /> Indicador
          </Button>
        </div>
      </div>

      <FieldHint>
        Cada persona tiene al menos un número del que es responsable cada semana
      </FieldHint>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-max w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap w-[96px] max-w-[96px]">Responsable</th>
              <th className="border-b border-l border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Indicador</th>
              <th className="border-b border-l border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Meta</th>
              {MESES.map((m) => (
                <th key={m} className="border-b border-l border-border px-2 py-2 text-center font-medium text-muted-foreground">{m}</th>
              ))}
              <th className="w-8 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {data.filas.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-2 py-1.5">
                  <Input
                    value={f.responsable}
                    onChange={(e) => updateFila(f.id, { responsable: e.target.value })}
                    placeholder="Nombre"
                    className="h-7 w-[90px] max-w-[90px] text-xs"
                  />
                </td>
                <td className="border-l border-border px-2 py-1.5">
                  <Input
                    value={f.indicador}
                    onChange={(e) => updateFila(f.id, { indicador: e.target.value })}
                    placeholder="Indicador"
                    className="h-7 min-w-[130px] text-xs"
                  />
                </td>
                <td className="border-l border-border px-2 py-1.5">
                  <Input
                    value={f.meta}
                    onChange={(e) => updateFila(f.id, { meta: e.target.value })}
                    placeholder="Meta"
                    className="h-7 w-20 text-xs"
                  />
                </td>
                {MESES.map((m) => (
                  <td key={m} className="border-l border-border px-1 py-1.5">
                    <Input
                      value={f.meses[m] ?? ""}
                      onChange={(e) => updateMes(f.id, m, e.target.value)}
                      className="h-7 w-14 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <button onClick={() => removeFila(f.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
