import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  FieldHint,
  type NoClientProps,
} from "./shared";

interface Roca {
  id: string;
  roca: string;
  responsable: string;
  fecha_limite: string;
  tipo: "Empresa" | "Equipo" | "";
  completada: boolean;
}

interface Data {
  rocas: Roca[];
}

const DEFAULT: Data = { rocas: [] };

function newRoca(): Roca {
  return {
    id: crypto.randomUUID(),
    roca: "",
    responsable: "",
    fecha_limite: "",
    tipo: "",
    completada: false,
  };
}

export function Rocas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "rocas",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const add = () => setData({ rocas: [...data.rocas, newRoca()] });

  const update = (id: string, patch: Partial<Roca>) =>
    setData({ rocas: data.rocas.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const remove = (id: string) =>
    setData({ rocas: data.rocas.filter((r) => r.id !== id) });

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold">Rocas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1.5" /> Añadir Roca
          </Button>
        </div>
      </div>

      <FieldHint>
        Las Rocas son las 1-7 prioridades más importantes del trimestre. Sin Roca no hay foco.
      </FieldHint>

      <div className="mt-5 rounded-lg border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_160px_130px_120px_90px_36px] gap-x-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Roca</span>
          <span>Responsable</span>
          <span>Fecha límite</span>
          <span>Tipo</span>
          <span>Estado</span>
          <span />
        </div>

        {data.rocas.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No hay Rocas. Pulsa «Añadir Roca» para empezar.
          </div>
        )}

        {data.rocas.map((r) => (
          <div
            key={r.id}
            className={`grid grid-cols-[1fr_160px_130px_120px_90px_36px] items-center gap-x-3 border-b border-border px-4 py-2 last:border-0 ${
              r.completada ? "opacity-60" : ""
            }`}
          >
            <Input
              value={r.roca}
              onChange={(e) => update(r.id, { roca: e.target.value })}
              placeholder="Describe la Roca…"
              className={`h-8 text-sm ${r.completada ? "line-through" : ""}`}
            />
            <Input
              value={r.responsable}
              onChange={(e) => update(r.id, { responsable: e.target.value })}
              placeholder="Nombre"
              className="h-8 text-sm"
            />
            <Input
              type="date"
              value={r.fecha_limite}
              onChange={(e) => update(r.id, { fecha_limite: e.target.value })}
              className="h-8 text-sm"
            />
            <Select
              value={r.tipo}
              onValueChange={(v) => update(r.id, { tipo: v as Roca["tipo"] })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Empresa">Empresa</SelectItem>
                <SelectItem value="Equipo">Equipo</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => update(r.id, { completada: !r.completada })}
              className={`flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                r.completada
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {r.completada ? "✓ Hecha" : "Pendiente"}
            </button>
            <button
              onClick={() => remove(r.id)}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {data.rocas.length > 0 && (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          {data.rocas.filter((r) => r.completada).length}/{data.rocas.length} completadas
        </p>
      )}
    </div>
  );
}
