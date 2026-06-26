import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Save, Trash2, Eye } from "lucide-react";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  SectionTitle, FieldHint, type NoClientProps,
} from "./shared";
import {
  DocumentViewer, DocSection, DocField, DocRow,
  makeMdFilename,
} from "@/components/ui/DocumentViewer";
import {
  useRocasAsuntos, SelectorRA, resolveSeleccionados, SeleccionDocField, seleccionMdLines,
} from "./rocasAsuntosShared";

type EstadoReunion = "preparada" | "en_curso" | "completada";

interface Reunion {
  id: string; estado: EstadoReunion; fecha: string; participantes: string; duracion: string;
  a_transicion: string; a_revision_trimestre: string; a_revision_vto: string;
  a_lista_asuntos: string; a_rocas_proximo: string; a_ids: string; a_conclusion: string;
  acta: string; valoracion: number | null;
  rocas_seleccionadas?: string[]; asuntos_seleccionados?: string[];
}

// Claves de agenda conectadas con Rocas / Asuntos
const ROCAS_KEY = "a_rocas_proximo";
const ASUNTOS_KEY = "a_ids";

interface Data { reuniones: Reunion[] }
const DEFAULT: Data = { reuniones: [] };

const AGENDA: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "a_transicion",         label: "Transición",                        hint: "Ronda rápida: mejor y peor noticia personal y de negocio" },
  { key: "a_revision_trimestre", label: "Revisión del Trimestre Anterior",   hint: "Revisar ingresos, KPIs y estado de las Rocas del trimestre que acaba" },
  { key: "a_revision_vto",       label: "Revisión del V/TO",                 hint: "¿Seguimos alineados con la visión?" },
  { key: "a_lista_asuntos",      label: "Lista de Asuntos",                  hint: "Volcar todos los asuntos acumulados" },
  { key: "a_rocas_proximo",      label: "Fijar Rocas del Próximo Trimestre", hint: "1-7 Rocas por persona para el próximo trimestre" },
  { key: "a_ids",                label: "IDS Asuntos Clave",                 hint: "Identificar, Debatir, Solucionar" },
  { key: "a_conclusion",         label: "Conclusión",                        hint: "Repasar tareas, comunicar, valorar reunión del 1 al 10" },
];

function newReunion(): Reunion {
  return {
    id: `rt-${Date.now()}`, estado: "preparada",
    fecha: new Date().toISOString().split("T")[0], participantes: "", duracion: "",
    a_transicion: "", a_revision_trimestre: "", a_revision_vto: "",
    a_lista_asuntos: "", a_rocas_proximo: "", a_ids: "", a_conclusion: "",
    acta: "", valoracion: null,
    rocas_seleccionadas: [], asuntos_seleccionados: [],
  };
}

function formatFecha(fecha: string) {
  if (!fecha) return "Nueva reunión";
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

const BADGE: Record<EstadoReunion, { label: string; cls: string }> = {
  preparada:  { label: "Preparada",  cls: "" },
  en_curso:   { label: "En curso",   cls: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  completada: { label: "Completada", cls: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" },
};

function generateMd(
  r: Reunion, clienteNombre: string,
  selRocas: { texto: string; responsable: string }[],
  selAsuntos: { texto: string; responsable: string }[],
): string {
  const lines = [`# Reunión Trimestral — ${clienteNombre}`, `\n**Fecha:** ${formatFecha(r.fecha)}`];
  if (r.participantes) lines.push(`**Participantes:** ${r.participantes}`);
  if (r.duracion) lines.push(`**Duración:** ${r.duracion}`);
  lines.push(`**Estado:** ${BADGE[r.estado]?.label}`, `\n## Agenda`);
  for (const { key, label } of AGENDA) {
    if (key === ROCAS_KEY) {
      lines.push(...seleccionMdLines(label, selRocas));
      if (r[key]) lines.push(`${selRocas.length ? "\n" : `\n**${label}**\n`}${r[key] as string}`);
    } else if (key === ASUNTOS_KEY) {
      lines.push(...seleccionMdLines(label, selAsuntos));
      if (r[key]) lines.push(`${selAsuntos.length ? "\n" : `\n**${label}**\n`}${r[key] as string}`);
    } else if (r[key]) {
      lines.push(`\n**${label}**\n${r[key] as string}`);
    }
  }
  if (r.acta) lines.push(`\n## Acta\n${r.acta}`);
  if (r.valoracion !== null) lines.push(`\n**Valoración:** ${r.valoracion}/10`);
  return lines.join("\n");
}

export function ReunionTrimestral({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "reunion_trimestral", DEFAULT);
  const { rocas, asuntos } = useRocasAsuntos(clienteId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const add = () => { const r = newReunion(); setData({ reuniones: [r, ...data.reuniones] }); setExpandedId(r.id); };
  const update = (id: string, patch: Partial<Reunion>) =>
    setData({ reuniones: data.reuniones.map((r) => r.id === id ? { ...r, ...patch } : r) });
  const remove = (id: string) => { setData({ reuniones: data.reuniones.filter((r) => r.id !== id) }); if (expandedId === id) setExpandedId(null); };

  if (viewingId) {
    const r = data.reuniones.find((x) => x.id === viewingId);
    if (r) {
      const selRocas = resolveSeleccionados(rocas, "rocas", r.rocas_seleccionadas || []);
      const selAsuntos = resolveSeleccionados(asuntos, "asuntos", r.asuntos_seleccionados || []);
      return (
        <DocumentViewer title="Reunión Trimestral" clienteNombre={clienteNombre}
          date={formatFecha(r.fecha)} onClose={() => setViewingId(null)}
          mdContent={generateMd(r, clienteNombre, selRocas, selAsuntos)} mdFilename={makeMdFilename("reunion-trimestral", clienteNombre, r.fecha)}>
          <DocSection label="Reunión">
            <DocRow label="Participantes" value={r.participantes} />
            <DocRow label="Duración" value={r.duracion} />
            <DocRow label="Estado" value={BADGE[r.estado]?.label} />
            {r.valoracion !== null && <DocRow label="Valoración" value={`${r.valoracion}/10`} />}
          </DocSection>
          <DocSection label="Agenda">
            {AGENDA.map(({ key, label }) => {
              if (key === ROCAS_KEY) return <SeleccionDocField key={key} label={label} seleccion={selRocas} freeText={r[key] as string} />;
              if (key === ASUNTOS_KEY) return <SeleccionDocField key={key} label={label} seleccion={selAsuntos} freeText={r[key] as string} />;
              return (r[key] as string) ? <DocField key={key} label={label} value={r[key] as string} /> : null;
            })}
          </DocSection>
          {r.acta && <DocSection label="Acta"><DocField label="" value={r.acta} /></DocSection>}
        </DocumentViewer>
      );
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">Reunión Trimestral</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
          <Button size="sm" onClick={add}><Plus className="h-4 w-4 mr-1.5" /> Nueva reunión</Button>
        </div>
      </div>

      {data.reuniones.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay reuniones trimestrales registradas.</p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          const badge = BADGE[r.estado] ?? BADGE.preparada;
          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : r.id)}>
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{formatFecha(r.fecha)}</span>
                  <Badge variant={r.estado === "preparada" ? "secondary" : "default"} className={badge.cls}>{badge.label}</Badge>
                  {r.valoracion !== null && <Badge variant="secondary">{r.valoracion}/10</Badge>}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setViewingId(r.id)} className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Ver documento"><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => remove(r.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Estado:</span>
                    {(["preparada", "en_curso", "completada"] as EstadoReunion[]).map((s) => (
                      <button key={s} onClick={() => update(r.id, { estado: s })}
                        className={`rounded border px-2 py-0.5 text-xs transition-colors ${r.estado === s ? s === "preparada" ? "border-border bg-muted font-medium" : s === "en_curso" ? "border-amber-300 bg-amber-100 font-medium text-amber-800" : "border-emerald-300 bg-emerald-100 font-medium text-emerald-800" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {BADGE[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><Label className="text-xs">Fecha</Label><Input type="date" className="mt-1" value={r.fecha} onChange={(e) => update(r.id, { fecha: e.target.value })} /></div>
                    <div><Label className="text-xs">Participantes</Label><Input className="mt-1" value={r.participantes} onChange={(e) => update(r.id, { participantes: e.target.value })} /></div>
                    <div><Label className="text-xs">Duración</Label><Input className="mt-1" value={r.duracion} onChange={(e) => update(r.id, { duracion: e.target.value })} placeholder="Ej: 1 día" /></div>
                  </div>
                  <div>
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-primary">Agenda</p>
                    <div className="space-y-4">
                      {AGENDA.map(({ key, label, hint }) => (
                        <div key={key}><SectionTitle>{label}</SectionTitle><FieldHint>{hint}</FieldHint>
                          {key === ROCAS_KEY && (
                            <SelectorRA data={rocas} tipo="rocas" selectedIds={r.rocas_seleccionadas || []}
                              onChange={(ids) => update(r.id, { rocas_seleccionadas: ids })}
                              emptyLabel="No hay rocas activas. Créalas en la sección Rocas." />
                          )}
                          {key === ASUNTOS_KEY && (
                            <SelectorRA data={asuntos} tipo="asuntos" selectedIds={r.asuntos_seleccionados || []}
                              onChange={(ids) => update(r.id, { asuntos_seleccionados: ids })}
                              emptyLabel="No hay asuntos activos. Créalos en la sección Asuntos." />
                          )}
                          <Textarea className="mt-2 min-h-[70px] bg-background" value={(r[key] as string) || ""} onChange={(e) => update(r.id, { [key]: e.target.value })} /></div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border pt-5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary">Acta</p>
                    <FieldHint>Resumen de lo que ocurrió. Puedes dictar con el micrófono del teclado.</FieldHint>
                    <Textarea className="mt-2 min-h-[160px] bg-background" value={r.acta || ""} onChange={(e) => update(r.id, { acta: e.target.value })} placeholder="Escribe o dicta el acta…" />
                  </div>
                  <div>
                    <SectionTitle>Valoración</SectionTitle><FieldHint>Puntuación del 1 al 10</FieldHint>
                    <div className="mt-2 flex gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button key={v} onClick={() => update(r.id, { valoracion: v })}
                          className={`h-9 w-9 rounded-md border text-sm font-semibold transition-all ${r.valoracion === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50"}`}>
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
