import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Save, Trash2, CheckCircle2, Printer } from "lucide-react";
import { PrintHeader } from "@/components/ui/print";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  SectionTitle,
  FieldHint,
  type NoClientProps,
} from "./shared";

type EstadoReunion = "preparada" | "completada";

interface Reunion {
  id: string;
  estado: EstadoReunion;
  // ── ANTES (preparación) ──────────────────────────────────────────
  fecha: string;
  participantes: string;
  duracion: string;
  agenda_preparada: string;
  // ── DESPUÉS (resultado) ──────────────────────────────────────────
  transicion: string;
  indicadores: string;
  rocas: string;
  noticias: string;
  tareas: string;
  ids: string;
  conclusion: string;
  valoracion: number | null;
}

interface Data { reuniones: Reunion[] }

const DEFAULT: Data = { reuniones: [] };

function newReunion(): Reunion {
  return {
    id: `rs-${Date.now()}`,
    estado: "preparada",
    fecha: new Date().toISOString().split("T")[0],
    participantes: "",
    duracion: "",
    agenda_preparada: "",
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

const CAMPOS_RESULTADO: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "transicion", label: "Transición", hint: "Mejor/peor noticia personal y de negocio. Qué funciona/qué no" },
  { key: "indicadores", label: "Cuadro de Indicadores", hint: "Revisión de KPIs. Sin debate. Lo no conseguido pasa a IDS" },
  { key: "rocas", label: "Revisión de Rocas", hint: "¿Encarrilada? Sí/No por cada Roca" },
  { key: "noticias", label: "Noticias Clientes/Equipo", hint: "Buenas y malas noticias. Las malas pasan a IDS" },
  { key: "tareas", label: "Lista de Tareas", hint: "Revisión de compromisos anteriores. Sí/No" },
  { key: "ids", label: "IDS", hint: "Identificar, Debatir, Solucionar por orden de prioridad" },
  { key: "conclusion", label: "Conclusión", hint: "Repasar tareas nuevas, comunicar, valorar reunión del 1 al 10" },
];

function formatFecha(fecha: string) {
  if (!fecha) return "Nueva reunión";
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export function ReunionSemanal({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "reunion_semanal", DEFAULT);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const add = () => {
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

  const completar = (id: string) => update(id, { estado: "completada" });

  const handlePrint = (r: Reunion) => {
    setExpandedId(r.id);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="max-w-3xl">
      {/* Print header — solo al imprimir */}
      <PrintHeader title="Reunión Semanal (Nivel 10)" subtitle={clienteNombre} />

      {/* Header normal */}
      <div className="flex items-start justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-display font-bold">Reunión Semanal (Nivel 10)</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva reunión
          </Button>
        </div>
      </div>

      {data.reuniones.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center print:hidden">
          <p className="text-sm text-muted-foreground">
            No hay reuniones registradas. Pulsa «Nueva reunión» para empezar.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          const isCompletada = r.estado === "completada";

          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Fila cabecera */}
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors print:hidden"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{formatFecha(r.fecha)}</span>
                  <Badge variant={isCompletada ? "default" : "secondary"} className={isCompletada ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}>
                    {isCompletada ? "Completada" : "Preparada"}
                  </Badge>
                  {isCompletada && r.valoracion !== null && (
                    <Badge variant="secondary">{r.valoracion}/10</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handlePrint(r)} className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Imprimir">
                    <Printer className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(r.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Detalle expandido */}
              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  {/* Print header dentro del detalle */}
                  <PrintHeader title="Reunión Semanal (Nivel 10)" subtitle={`${clienteNombre} — ${formatFecha(r.fecha)}`} />

                  {/* ── ANTES: preparación ── */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      Preparación
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="text-xs">Fecha</Label>
                        <Input type="date" className="mt-1" value={r.fecha} onChange={(e) => update(r.id, { fecha: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Participantes</Label>
                        <Input className="mt-1" value={r.participantes} onChange={(e) => update(r.id, { participantes: e.target.value })} placeholder="Nombres o nº" />
                      </div>
                      <div>
                        <Label className="text-xs">Duración</Label>
                        <Input className="mt-1" value={r.duracion} onChange={(e) => update(r.id, { duracion: e.target.value })} placeholder="Ej: 90 min" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="text-xs">Agenda preparada</Label>
                      <FieldHint>Puntos que se van a tratar en la reunión</FieldHint>
                      <Textarea
                        className="mt-1 min-h-[80px] bg-background"
                        value={r.agenda_preparada}
                        onChange={(e) => update(r.id, { agenda_preparada: e.target.value })}
                        placeholder="Lista los puntos de la agenda…"
                      />
                    </div>
                  </div>

                  {/* ── DESPUÉS: resultado (solo si completada, o botón para completar) ── */}
                  {!isCompletada ? (
                    <div className="flex justify-end border-t border-border pt-4 print:hidden">
                      <Button onClick={() => completar(r.id)} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Completar reunión
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Resultado
                      </p>
                      <div className="space-y-4">
                        {CAMPOS_RESULTADO.map(({ key, label, hint }) => (
                          <div key={key}>
                            <SectionTitle>{label}</SectionTitle>
                            <FieldHint>{hint}</FieldHint>
                            <Textarea
                              className="mt-2 min-h-[80px] bg-background"
                              value={(r[key] as string) || ""}
                              onChange={(e) => update(r.id, { [key]: e.target.value })}
                            />
                          </div>
                        ))}

                        {/* Valoración */}
                        <div>
                          <SectionTitle>Valoración de la reunión</SectionTitle>
                          <FieldHint>Puntuación del 1 al 10</FieldHint>
                          <div className="mt-2 flex gap-2 print:hidden">
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
                          {r.valoracion !== null && (
                            <p className="mt-2 hidden text-sm font-semibold print:block">
                              Valoración: {r.valoracion}/10
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
