import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Save, Trash2, PlayCircle, CheckCircle2, Printer } from "lucide-react";
import { PrintHeader, PrintButton } from "@/components/ui/print";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  SectionTitle, FieldHint, type NoClientProps,
} from "./shared";

type EstadoReunion = "preparada" | "en_curso" | "completada";

interface Reunion {
  id: string;
  estado: EstadoReunion;
  fecha: string;
  participantes: string;
  duracion: string;
  // Secciones de agenda (preparación)
  a_transicion: string;
  a_indicadores: string;
  a_rocas: string;
  a_noticias: string;
  a_tareas: string;
  a_ids: string;
  a_conclusion: string;
  // Fase 2
  acta: string;
  valoracion: number | null;
}

interface Data { reuniones: Reunion[] }
const DEFAULT: Data = { reuniones: [] };

const AGENDA: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "a_transicion",  label: "Transición",              hint: "Ronda rápida: mejor y peor noticia personal y de negocio" },
  { key: "a_indicadores", label: "Cuadro de Indicadores",   hint: "Revisión de KPIs. Sin debate. Lo no conseguido pasa a IDS" },
  { key: "a_rocas",       label: "Revisión de Rocas",       hint: "¿Encarrilada? Sí / No por cada Roca" },
  { key: "a_noticias",    label: "Noticias Clientes/Equipo",hint: "Buenas y malas noticias. Las malas pasan a IDS" },
  { key: "a_tareas",      label: "Lista de Tareas",         hint: "Revisión de compromisos anteriores. Sí / No" },
  { key: "a_ids",         label: "IDS",                     hint: "Identificar, Debatir, Solucionar por orden de prioridad" },
  { key: "a_conclusion",  label: "Conclusión",              hint: "Repasar tareas nuevas, comunicar, valorar del 1 al 10" },
];

function newReunion(): Reunion {
  return {
    id: `rs-${Date.now()}`, estado: "preparada",
    fecha: new Date().toISOString().split("T")[0],
    participantes: "", duracion: "",
    a_transicion: "", a_indicadores: "", a_rocas: "", a_noticias: "",
    a_tareas: "", a_ids: "", a_conclusion: "",
    acta: "", valoracion: null,
  };
}

function formatFecha(fecha: string) {
  if (!fecha) return "Nueva reunión";
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

const BADGE: Record<EstadoReunion, { label: string; cls: string }> = {
  preparada:  { label: "Preparada",  cls: "" },
  en_curso:   { label: "En curso",   cls: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  completada: { label: "Completada", cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
};

export function ReunionSemanal({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "reunion_semanal", DEFAULT);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const add = () => { const r = newReunion(); setData({ reuniones: [r, ...data.reuniones] }); setExpandedId(r.id); };
  const update = (id: string, patch: Partial<Reunion>) =>
    setData({ reuniones: data.reuniones.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const remove = (id: string) => { setData({ reuniones: data.reuniones.filter((r) => r.id !== id) }); if (expandedId === id) setExpandedId(null); };
  const handlePrint = (r: Reunion) => { setExpandedId(r.id); setTimeout(() => window.print(), 300); };

  return (
    <div className="max-w-3xl">
      <PrintHeader title="Reunión Semanal (Nivel 10)" subtitle={clienteNombre} />

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
          <p className="text-sm text-muted-foreground">No hay reuniones registradas. Pulsa «Nueva reunión» para empezar.</p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          const badge = BADGE[r.estado] ?? BADGE.preparada;
          const isPrep = r.estado === "preparada";
          const isActa = r.estado === "en_curso" || r.estado === "completada";

          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              {/* Cabecera del ítem */}
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors print:hidden"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{formatFecha(r.fecha)}</span>
                  <Badge variant={r.estado === "preparada" ? "secondary" : "default"} className={badge.cls}>{badge.label}</Badge>
                  {r.valoracion !== null && <Badge variant="secondary">{r.valoracion}/10</Badge>}
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

              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-6">
                  <PrintHeader title="Reunión Semanal (Nivel 10)" subtitle={`${clienteNombre} — ${formatFecha(r.fecha)}`} />

                  {/* Metadatos */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Fecha</Label>
                      <Input type="date" className="mt-1" value={r.fecha}
                        onChange={(e) => update(r.id, { fecha: e.target.value })}
                        readOnly={isActa} />
                    </div>
                    <div>
                      <Label className="text-xs">Participantes</Label>
                      <Input className="mt-1" value={r.participantes}
                        onChange={(e) => update(r.id, { participantes: e.target.value })}
                        placeholder="Nombres o nº" readOnly={isActa} />
                    </div>
                    <div>
                      <Label className="text-xs">Duración</Label>
                      <Input className="mt-1" value={r.duracion}
                        onChange={(e) => update(r.id, { duracion: e.target.value })}
                        placeholder="Ej: 90 min" readOnly={isActa} />
                    </div>
                  </div>

                  {/* AGENDA */}
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Agenda</p>
                      {isPrep && <PrintButton />}
                    </div>
                    <div className="space-y-4">
                      {AGENDA.map(({ key, label, hint }) => (
                        <div key={key}>
                          <SectionTitle>{label}</SectionTitle>
                          <FieldHint>{hint}</FieldHint>
                          <Textarea
                            className={`mt-2 bg-background ${isActa ? "min-h-[40px] resize-none text-sm text-muted-foreground" : "min-h-[80px]"}`}
                            value={(r[key] as string) || ""}
                            onChange={(e) => !isActa && update(r.id, { [key]: e.target.value })}
                            readOnly={isActa}
                            placeholder={isPrep ? "Notas de preparación…" : "—"}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón pasar a fase 2 */}
                  {isPrep && (
                    <div className="flex justify-end border-t border-border pt-4 print:hidden">
                      <Button onClick={() => update(r.id, { estado: "en_curso" })} className="gap-2">
                        <PlayCircle className="h-4 w-4" /> Iniciar acta
                      </Button>
                    </div>
                  )}

                  {/* FASE 2: Acta */}
                  {isActa && (
                    <div className="border-t border-border pt-5 space-y-5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Acta de la reunión</p>
                        <PrintButton />
                      </div>
                      <div>
                        <FieldHint>
                          Resume aquí lo que ocurrió en la reunión. Puedes dictar con el micrófono del teclado.
                        </FieldHint>
                        <Textarea
                          className="mt-2 min-h-[200px] bg-background"
                          value={r.acta || ""}
                          onChange={(e) => update(r.id, { acta: e.target.value })}
                          placeholder="Escribe o dicta el acta…"
                        />
                      </div>

                      {/* Valoración */}
                      <div>
                        <SectionTitle>Valoración de la reunión</SectionTitle>
                        <FieldHint>Puntuación del 1 al 10</FieldHint>
                        <div className="mt-2 flex gap-2 print:hidden">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                            <button key={v} onClick={() => update(r.id, { valoracion: v })}
                              className={`h-9 w-9 rounded-md border text-sm font-semibold transition-all ${r.valoracion === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        {r.valoracion !== null && (
                          <p className="mt-2 hidden text-sm font-semibold print:block">Valoración: {r.valoracion}/10</p>
                        )}
                      </div>

                      {/* Cerrar reunión */}
                      {r.estado === "en_curso" && (
                        <div className="flex justify-end border-t border-border pt-4 print:hidden">
                          <Button variant="outline" onClick={() => update(r.id, { estado: "completada" })} className="gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Cerrar reunión
                          </Button>
                        </div>
                      )}
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
