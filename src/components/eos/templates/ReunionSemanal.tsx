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
  duracion: string;
  transicion: string;
  indicadores: string;
  rocas: string;
  noticias: string;
  tareas: string;
  ids: string;
  conclusion: string;
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
    duracion: "",
    transicion: "",
    indicadores: "",
    rocas: "",
    noticias: "",
    tareas: "",
    ids: "",
    conclusion: "",
    valoracion: null,
  };
}

const CAMPOS: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "transicion", label: "Transición", hint: "Mejor/peor noticia personal y de negocio. Qué funciona/qué no" },
  { key: "indicadores", label: "Cuadro de Indicadores", hint: "Revisión de KPIs. Sin debate. Lo no conseguido pasa a IDS" },
  { key: "rocas", label: "Revisión de Rocas", hint: "¿Encarrilada? Sí/No por cada Roca" },
  { key: "noticias", label: "Noticias Clientes/Equipo", hint: "Buenas y malas noticias. Las malas pasan a IDS" },
  { key: "tareas", label: "Lista de Tareas", hint: "Revisión de compromisos anteriores. Sí/No" },
  { key: "ids", label: "IDS", hint: "Identificar, Debatir, Solucionar por orden de prioridad" },
  { key: "conclusion", label: "Conclusión", hint: "Repasar tareas nuevas, comunicar, valorar reunión del 1 al 10" },
];

export function ReunionSemanal({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "reunion_semanal",
    DEFAULT
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addReunion = () => {
    const r = newReunion();
    const updated = { reuniones: [r, ...data.reuniones] };
    setData(updated);
    setExpandedId(r.id);
  };

  const updateReunion = (id: string, patch: Partial<Reunion>) => {
    setData({
      reuniones: data.reuniones.map((r) =>
        r.id === id ? { ...r, ...patch } : r
      ),
    });
  };

  const deleteReunion = (id: string) => {
    setData({ reuniones: data.reuniones.filter((r) => r.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">Reunión Semanal (Nivel 10)</h1>
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
          <p className="text-sm text-muted-foreground">
            No hay reuniones registradas. Pulsa «Nueva reunión» para empezar.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Header row */}
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {r.fecha
                      ? new Date(r.fecha + "T12:00:00").toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Nueva reunión"}
                  </span>
                  {r.valoracion !== null && (
                    <Badge variant="secondary">{r.valoracion}/10</Badge>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReunion(r.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  {/* Cabecera */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Fecha</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={r.fecha}
                        onChange={(e) => updateReunion(r.id, { fecha: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Participantes</Label>
                      <Input
                        className="mt-1"
                        value={r.participantes}
                        onChange={(e) => updateReunion(r.id, { participantes: e.target.value })}
                        placeholder="Nombres o nº de asistentes"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Duración</Label>
                      <Input
                        className="mt-1"
                        value={r.duracion}
                        onChange={(e) => updateReunion(r.id, { duracion: e.target.value })}
                        placeholder="Ej: 90 min"
                      />
                    </div>
                  </div>

                  {/* Secciones */}
                  {CAMPOS.map(({ key, label, hint }) => (
                    <div key={key}>
                      <SectionTitle>{label}</SectionTitle>
                      <FieldHint>{hint}</FieldHint>
                      <Textarea
                        className="mt-2 min-h-[80px] bg-background"
                        value={(r[key] as string) || ""}
                        onChange={(e) => updateReunion(r.id, { [key]: e.target.value })}
                      />
                    </div>
                  ))}

                  {/* Valoración */}
                  <div>
                    <SectionTitle>Valoración de la reunión</SectionTitle>
                    <FieldHint>Puntuación del 1 al 10</FieldHint>
                    <div className="mt-2 flex gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button
                          key={v}
                          onClick={() => updateReunion(r.id, { valoracion: v })}
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
