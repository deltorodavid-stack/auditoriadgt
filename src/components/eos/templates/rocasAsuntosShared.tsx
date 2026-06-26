import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight, Download, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadMd, makeMdFilename, DocItem } from "@/components/ui/DocumentViewer";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Tipos compartidos Rocas / Asuntos ───────────────────────────────────────────
export interface RAItem {
  id: string;
  texto: string;
  responsable: string;
  fecha: string;
  completado?: boolean;
}
export interface RADepartamento { id: string; nombre: string; items: RAItem[] }
// Rocas usa "empresa"; Asuntos usa "vision". Ambos tienen semanales + departamentos.
export interface RAData {
  empresa?: RAItem[];
  vision?: RAItem[];
  semanales?: RAItem[];
  departamentos?: RADepartamento[];
}

export type RATipo = "rocas" | "asuntos";

export interface RAColumna { colId: string; label: string; items: RAItem[] }

// Devuelve las columnas (con sus items) de una plantilla rocas/asuntos.
export function getColumnas(data: RAData, tipo: RATipo): RAColumna[] {
  const primaryKey = tipo === "rocas" ? "empresa" : "vision";
  const primaryLabel = tipo === "rocas" ? "Rocas Empresa" : "Asuntos Visión";
  const semanalLabel = tipo === "rocas" ? "Rocas Semanales" : "Asuntos Semanales";
  const cols: RAColumna[] = [
    { colId: primaryKey, label: primaryLabel, items: (data as Record<string, RAItem[]>)[primaryKey] || [] },
    { colId: "semanales", label: semanalLabel, items: data.semanales || [] },
  ];
  for (const d of data.departamentos || []) {
    cols.push({ colId: d.id, label: d.nombre || "Departamento", items: d.items || [] });
  }
  return cols;
}

// Mapa id → { item, columna } solo de items NO completados (para reuniones).
export function buildItemIndex(data: RAData, tipo: RATipo): Map<string, { item: RAItem; columna: string }> {
  const map = new Map<string, { item: RAItem; columna: string }>();
  for (const col of getColumnas(data, tipo)) {
    for (const item of col.items) {
      if (!item.completado) map.set(item.id, { item, columna: col.label });
    }
  }
  return map;
}

// ── Hook de lectura (solo lee, no escribe) de rocas + asuntos del cliente ─────────
export function useRocasAsuntos(clienteId: string | null) {
  const [rocas, setRocas] = useState<RAData>({});
  const [asuntos, setAsuntos] = useState<RAData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clienteId) { setRocas({}); setAsuntos({}); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: rows } = await supabase
        .from("plantillas")
        .select("tipo, datos")
        .eq("cliente_id", clienteId)
        .in("tipo", ["rocas", "asuntos"]);
      if (cancelled) return;
      for (const row of rows || []) {
        if (row.tipo === "rocas") setRocas((row.datos as RAData) || {});
        else if (row.tipo === "asuntos") setAsuntos((row.datos as RAData) || {});
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clienteId]);

  return { rocas, asuntos, loading };
}

// ── Selector con checkboxes para las reuniones ────────────────────────────────────
export function SelectorRA({ data, tipo, selectedIds, onChange, emptyLabel, heading }: {
  data: RAData;
  tipo: RATipo;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyLabel: string;
  heading?: string;
}) {
  const columnas = getColumnas(data, tipo).map((c) => ({
    ...c, items: c.items.filter((i) => !i.completado),
  })).filter((c) => c.items.length > 0);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  if (columnas.length === 0) {
    return <p className="mt-2 text-[13px] italic text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="mt-2 space-y-3 rounded-md border border-border bg-muted/20 p-3">
      {heading && (
        <p className="text-xs font-medium text-foreground">{heading}</p>
      )}
      {columnas.map((col) => (
        <div key={col.colId}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{col.label}</p>
          <div className="space-y-1">
            {col.items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 hover:bg-background/60">
                  <input type="checkbox" checked={checked} onChange={() => toggle(item.id)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary" />
                  <span className="text-[13px] leading-snug text-foreground">
                    {item.texto || <span className="italic text-muted-foreground/60">Sin texto</span>}
                    {item.responsable && <span className="text-muted-foreground"> — {item.responsable}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lista de items seleccionados resuelta (para el documento de reunión) ──────────
export function resolveSeleccionados(data: RAData, tipo: RATipo, ids: string[]): { texto: string; responsable: string }[] {
  const index = buildItemIndex(data, tipo);
  // También resolvemos completados por si se seleccionó algo que luego se completó
  const all = new Map<string, RAItem>();
  for (const col of getColumnas(data, tipo)) for (const it of col.items) all.set(it.id, it);
  return ids
    .map((id) => index.get(id)?.item || all.get(id))
    .filter((i): i is RAItem => Boolean(i))
    .map((i) => ({ texto: i.texto, responsable: i.responsable }));
}

// ── Título de apartado de agenda dentro del documento de reunión ─────────────────
// 14px / 700 / azul brand, para que se vea como cabecera frente al contenido (12px).
export function AgendaDocField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E40AF", marginBottom: "3px" }}>{label}</div>
      <div className="dv-field-value">{value}</div>
    </div>
  );
}

// ── Campo de documento con la selección + texto libre (para reuniones) ───────────
export function SeleccionDocField({ label, seleccion, freeText }: {
  label: string;
  seleccion: { texto: string; responsable: string }[];
  freeText?: string;
}) {
  if (seleccion.length === 0 && !freeText) return null;
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E40AF", marginBottom: "3px" }}>{label}</div>
      {seleccion.map((s, i) => (
        <DocItem key={i} texto={s.texto} responsable={s.responsable} />
      ))}
      {freeText && (
        <div className="dv-field-value" style={{ marginTop: seleccion.length ? "6px" : 0 }}>{freeText}</div>
      )}
    </div>
  );
}

// Líneas markdown de una selección, para generateMd de la reunión.
export function seleccionMdLines(titulo: string, seleccion: { texto: string; responsable: string }[]): string[] {
  if (seleccion.length === 0) return [];
  const lines = [`\n**${titulo}**`];
  for (const s of seleccion) lines.push(`- ${s.texto}${s.responsable ? ` — Responsable: ${s.responsable}` : ""}`);
  return lines;
}

// ── Sección colapsable de Completados / Resueltos ────────────────────────────────
export function CompletadosPanel({ titulo, itemLabel, columnas, tipo, clienteNombre, onUncheck, onClear }: {
  titulo: string;
  itemLabel: string;
  columnas: RAColumna[];
  tipo: RATipo;
  clienteNombre: string;
  onUncheck: (colId: string, itemId: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Solo columnas con completados
  const conCompletados = columnas
    .map((c) => ({ ...c, items: c.items.filter((i) => i.completado) }))
    .filter((c) => c.items.length > 0);

  const total = conCompletados.reduce((s, c) => s + c.items.length, 0);

  const handleDownload = () => {
    const lines = [`# ${titulo} — ${clienteNombre}`];
    for (const col of conCompletados) {
      lines.push(`\n## ${col.label}`);
      for (const i of col.items) {
        lines.push(`- ${i.texto}${i.responsable ? ` (${i.responsable})` : ""}${i.fecha ? ` — ${i.fecha}` : ""}`);
      }
    }
    downloadMd(makeMdFilename(tipo === "rocas" ? "rocas-completadas" : "asuntos-resueltos", clienteNombre), lines.join("\n"));
  };

  return (
    <div className="mt-6 rounded-lg border border-border bg-card">
      <button onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-display font-semibold">{titulo}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{total}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4">
          {total === 0 ? (
            <p className="text-xs italic text-muted-foreground">Aún no hay {itemLabel} en el histórico.</p>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Descargar .md
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmClear(true)}
                  className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Vaciar histórico
                </Button>
              </div>

              <div className="space-y-4">
                {conCompletados.map((col) => (
                  <div key={col.colId}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{col.label}</p>
                    <div className="space-y-1">
                      {col.items.map((item) => (
                        <div key={item.id} className="group flex items-start gap-2 border-b border-border/30 py-1.5 last:border-0">
                          <span className="flex-1 text-sm leading-snug text-muted-foreground line-through decoration-muted-foreground/40">
                            {item.texto}
                            {item.responsable && <span className="text-muted-foreground/70"> — {item.responsable}</span>}
                          </span>
                          <button onClick={() => onUncheck(col.colId, item.id)}
                            className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors" title="Devolver a activas">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vaciar histórico de {itemLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán definitivamente las {total} {itemLabel} marcadas como completadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Vaciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
