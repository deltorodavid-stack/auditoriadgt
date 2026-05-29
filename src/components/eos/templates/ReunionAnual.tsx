import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Save, Trash2 } from "lucide-react";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  SectionTitle,
  FieldHint,
  type NoClientProps,
} from "./shared";

interface Reunion {
  id: string;
  fecha: string;
  participantes: string;
  // Día 1
  d1_transicion: string;
  d1_revision_anio: string;
  d1_salud_equipo: string;
  d1_dafo: string;
  d1_revision_vto: string;
  // Día 2
  d2_rocas: string;
  d2_ids: string;
  d2_conclusion: string;
  valoracion: number | null;
}

interface Data {
  reuniones: Reunion[];
}

const DEFAULT: Data = { reuniones: [] };

function newReunion(): Reunion {
  return {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString().split("T")[0],
    participantes: "",
    d1_transicion: "",
    d1_revision_anio: "",
    d1_salud_equipo: "",
    d1_dafo: "",
    d1_revision_vto: "",
    d2_rocas: "",
    d2_ids: "",
    d2_conclusion: "",
    valoracion: null,
  };
}

const DIA1: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "d1_transicion", label: "Transición", hint: "Mejor/peor noticia personal y de negocio" },
  { key: "d1_revision_anio", label: "Revisión del Año", hint: "Revisar ingresos, KPIs y Rocas del año que acaba" },
  { key: "d1_salud_equipo", label: "Salud del Equipo", hint: "Estado del equipo directivo: confianza, comunicación, compromiso" },
  { key: "d1_dafo", label: "DAFO", hint: "Debilidades, Amenazas, Fortalezas y Oportunidades actuales" },
  { key: "d1_revision_vto", label: "Revisión del V/TO", hint: "Actualizar la visión para el próximo año si es necesario" },
];

const DIA2: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "d2_rocas", label: "Rocas del Próximo Trimestre", hint: "1-7 Rocas por persona para el próximo trimestre" },
  { key: "d2_ids", label: "IDS Asuntos Clave", hint: "Identificar, Debatir, Solucionar los asuntos más importantes" },
  { key: "d2_conclusion", label: "Conclusión", hint: "Repasar tareas, comunicar, valorar la reunión del 1 al 10" },
];

export function ReunionAnual({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "reunion_anual",
    DEFAULT
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addReunion = () => {
    const r = newReunion();
    setData({ reuniones: [r, ...data.reuniones] });
    setExpandedId(r.id);
  };

  const update = (id: string, patch: Partial<Reunion>) =>
    setData({ reuniones: data.reuniones.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const remove = (id: string) => {
    setData({ reuniones: data.reuniones.filter((r) => r.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">Reunión Anual (2 días)</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={addReunion}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva reunión
          </Button>
        </div>
      </div>

      {data.reuniones.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay reuniones anuales registradas.</p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">
                    {r.fecha
                      ? new Date(r.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
                      : "Nueva reunión anual"}
                  </span>
                  {r.valoracion !== null && <Badge variant="secondary">{r.valoracion}/10</Badge>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Fecha inicio</Label>
                      <Input type="date" className="mt-1" value={r.fecha} onChange={(e) => update(r.id, { fecha: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Participantes</Label>
                      <Input className="mt-1" value={r.participantes} onChange={(e) => update(r.id, { participantes: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                      <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">Día 1</span>
                      Revisión y Visión
                    </h3>
                    <div className="space-y-4">
                      {DIA1.map(({ key, label, hint }) => (
                        <div key={key}>
                          <SectionTitle>{label}</SectionTitle>
                          <FieldHint>{hint}</FieldHint>
                          <Textarea className="mt-2 min-h-[80px] bg-background" value={(r[key] as string) || ""} onChange={(e) => update(r.id, { [key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                      <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">Día 2</span>
                      Planificación y Resolución
                    </h3>
                    <div className="space-y-4">
                      {DIA2.map(({ key, label, hint }) => (
                        <div key={key}>
                          <SectionTitle>{label}</SectionTitle>
                          <FieldHint>{hint}</FieldHint>
                          <Textarea className="mt-2 min-h-[80px] bg-background" value={(r[key] as string) || ""} onChange={(e) => update(r.id, { [key]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionTitle>Valoración</SectionTitle>
                    <FieldHint>Puntuación del 1 al 10</FieldHint>
                    <div className="mt-2 flex gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button
                          key={v}
                          onClick={() => update(r.id, { valoracion: v })}
                          className={`h-9 w-9 rounded-md border text-sm font-semibold transition-all ${
                            r.valoracion === v
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
