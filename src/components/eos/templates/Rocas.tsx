import { useEffect, useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, FolderPlus, GripVertical, Eye } from "lucide-react";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  FieldHint, type NoClientProps,
} from "./shared";
import {
  DocumentViewer, DocSection, DocItem,
  makeMdFilename,
} from "@/components/ui/DocumentViewer";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CompletadosPanel, getColumnas } from "./rocasAsuntosShared";

interface Item { id: string; texto: string; responsable: string; fecha: string; completado?: boolean }
interface Departamento { id: string; nombre: string; items: Item[] }
interface Data { empresa: Item[]; semanales: Item[]; departamentos: Departamento[] }
const DEFAULT: Data = { empresa: [], semanales: [], departamentos: [] };

function toItem(raw: unknown, i: number): Item {
  if (typeof raw === "string") return { id: `l-${i}`, texto: raw, responsable: "", fecha: "", completado: false };
  const r = raw as Partial<Item>;
  return { id: r.id || `l-${i}`, texto: r.texto || "", responsable: r.responsable || "", fecha: r.fecha || "", completado: Boolean(r.completado) };
}
function toItems(arr: unknown[]): Item[] { return (arr || []).map(toItem); }
function newItem(texto: string, responsable: string, fecha: string): Item {
  return { id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, texto, responsable, fecha, completado: false };
}
function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
}

// ── SortableItemRow con formulario de edición completo ─────────────────────────
function SortableItemRow({ item, colId, onRemove, onUpdate }: {
  item: Item; colId: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: "item", colId } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const [editing, setEditing] = useState(false);
  const [valTexto, setValTexto] = useState(item.texto);
  const [valResp, setValResp] = useState(item.responsable);
  const [valFecha, setValFecha] = useState(item.fecha);

  useEffect(() => {
    if (!editing) { setValTexto(item.texto); setValResp(item.responsable); setValFecha(item.fecha); }
  }, [item.texto, item.responsable, item.fecha, editing]);

  const save = () => { onUpdate(item.id, { texto: valTexto.trim() || item.texto, responsable: valResp, fecha: valFecha }); setEditing(false); };
  const cancel = () => { setValTexto(item.texto); setValResp(item.responsable); setValFecha(item.fecha); setEditing(false); };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="border-b border-border/40 py-3 last:border-0">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Roca</label>
            <textarea
              autoFocus value={valTexto} onChange={(e) => setValTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
              className="mt-1 w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Responsable</label>
            <input value={valResp} onChange={(e) => setValResp(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary h-8" />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fecha límite</label>
            <input type="date" value={valFecha} onChange={(e) => setValFecha(e.target.value)}
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary h-8" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" className="h-7 px-3 text-xs" onClick={save}>Guardar</Button>
            <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="group flex items-start gap-1.5 border-b border-border/40 py-1.5 last:border-0">
      <span {...attributes} {...listeners} className="mt-0.5 cursor-grab shrink-0 touch-none text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors print:hidden">
        <GripVertical className="h-3 w-3" />
      </span>
      <input type="checkbox" checked={Boolean(item.completado)}
        onChange={(e) => onUpdate(item.id, { completado: e.target.checked })}
        onClick={(e) => e.stopPropagation()}
        title="Marcar como completada"
        className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary print:hidden" />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)} title="Clic para editar">
        <p className="text-sm text-foreground hover:text-primary transition-colors leading-snug">
          {item.texto || <span className="italic text-muted-foreground/60">Sin texto</span>}
        </p>
        {(item.responsable || item.fecha) && (
          <p className="mt-0.5 text-[11px] text-gray-400 leading-tight">
            {item.responsable && <span className="text-gray-500">{item.responsable}</span>}
            {item.responsable && item.fecha && <span className="mx-1">·</span>}
            {item.fecha && <span>{fmtDate(item.fecha)}</span>}
          </p>
        )}
      </div>
      <button onClick={() => onRemove(item.id)} className="mt-0.5 ml-1 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:!text-destructive transition-all print:hidden">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── SortableDept ────────────────────────────────────────────────────────────────
function SortableDept({ dept, onRemoveDept, onUpdateNombre, onAddItem, onRemoveItem, onUpdateItem }: {
  dept: Departamento;
  onRemoveDept: (id: string) => void;
  onUpdateNombre: (id: string, nombre: string) => void;
  onAddItem: (deptId: string, d: { texto: string; responsable: string; fecha: string }) => void;
  onRemoveItem: (deptId: string, itemId: string) => void;
  onUpdateItem: (deptId: string, itemId: string, patch: Partial<Item>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dept.id, data: { type: "dept" } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="rounded border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-blue-950/40">
      <div className="mb-2 flex items-center gap-2">
        <span {...attributes} {...listeners} className="cursor-grab shrink-0 touch-none text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors print:hidden">
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <Input value={dept.nombre} onChange={(e) => onUpdateNombre(dept.id, e.target.value)} placeholder="Nombre del departamento" className="h-7 text-xs font-medium" />
        <button onClick={() => onRemoveDept(dept.id)} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      {(() => {
        const activos = (dept.items || []).filter((i) => !i.completado);
        return (
          <SortableContext items={activos.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {activos.length === 0 && <p className="text-xs italic text-muted-foreground">Sin rocas.</p>}
            {activos.map((item) => (
              <SortableItemRow key={item.id} item={item} colId={dept.id}
                onRemove={(id) => onRemoveItem(dept.id, id)}
                onUpdate={(id, patch) => onUpdateItem(dept.id, id, patch)} />
            ))}
          </SortableContext>
        );
      })()}
      <AddForm placeholder="Roca…" onAdd={(d) => onAddItem(dept.id, d)} />
    </div>
  );
}

// ── AddForm ─────────────────────────────────────────────────────────────────────
function AddForm({ placeholder, onAdd }: { placeholder: string; onAdd: (d: { texto: string; responsable: string; fecha: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(""); const [resp, setResp] = useState(""); const [fecha, setFecha] = useState("");
  const reset = () => { setTexto(""); setResp(""); setFecha(""); setOpen(false); };
  const submit = () => { if (!texto.trim()) return; onAdd({ texto, responsable: resp, fecha }); reset(); };

  if (!open) return (
    <button onClick={() => setOpen(true)} className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors print:hidden">
      <Plus className="h-3 w-3" /> Añadir
    </button>
  );

  return (
    <div className="mt-3 space-y-2 print:hidden">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Roca</label>
        <textarea
          autoFocus value={texto} onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") reset(); }}
          placeholder={placeholder}
          className="mt-1 w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary min-h-[60px]"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Responsable</label>
        <input value={resp} onChange={(e) => setResp(e.target.value)}
          className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary h-8" />
      </div>
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fecha límite</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary h-8" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" className="h-7 px-3 text-xs" onClick={submit}>Añadir</Button>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
      </div>
    </div>
  );
}

function generateMd(data: Data, clienteNombre: string): string {
  const lines = [`# Rocas — ${clienteNombre}`];
  const fmtItem = (i: Item) => `- ${i.texto}${i.responsable ? ` (${i.responsable})` : ""}${i.fecha ? ` — ${i.fecha}` : ""}`;
  const act = (arr: Item[]) => (arr || []).filter((i) => !i.completado);
  if (act(data.empresa).length) { lines.push(`\n## Rocas Empresa`); act(data.empresa).forEach((i) => lines.push(fmtItem(i))); }
  if (act(data.semanales).length) { lines.push(`\n## Rocas Semanales`); act(data.semanales).forEach((i) => lines.push(fmtItem(i))); }
  for (const dept of data.departamentos || []) {
    const items = act(dept.items);
    if (dept.nombre || items.length) {
      lines.push(`\n## ${dept.nombre || "Departamento"}`);
      items.forEach((i) => lines.push(fmtItem(i)));
    }
  }
  return lines.join("\n");
}

export function Rocas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "rocas", DEFAULT);
  const [viewMode, setViewMode] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (loading) return;
    const needsNorm = (arr: unknown[]) => (arr || []).some((i) => typeof i === "string" || !(i as Item).id);
    if (needsNorm(data.empresa) || needsNorm(data.semanales) || (data.departamentos || []).some((d) => needsNorm(d.items))) {
      setData({ empresa: toItems(data.empresa), semanales: toItems(data.semanales), departamentos: (data.departamentos || []).map((d) => ({ ...d, items: toItems(d.items) })) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const empresa = data.empresa || [];
  const semanales = data.semanales || [];
  const departamentos = data.departamentos || [];
  const empresaActivas = empresa.filter((i) => !i.completado);
  const semanalesActivas = semanales.filter((i) => !i.completado);

  // Marcar/desmarcar completado y vaciar histórico
  const setCompletado = (colId: string, itemId: string, value: boolean) => {
    if (colId === "empresa") setData({ ...data, empresa: empresa.map((i) => i.id === itemId ? { ...i, completado: value } : i) });
    else if (colId === "semanales") setData({ ...data, semanales: semanales.map((i) => i.id === itemId ? { ...i, completado: value } : i) });
    else setData({ ...data, departamentos: departamentos.map((d) => d.id === colId ? { ...d, items: (d.items || []).map((i) => i.id === itemId ? { ...i, completado: value } : i) } : d) });
  };
  const clearCompletados = () => setData({
    empresa: empresa.filter((i) => !i.completado),
    semanales: semanales.filter((i) => !i.completado),
    departamentos: departamentos.map((d) => ({ ...d, items: (d.items || []).filter((i) => !i.completado) })),
  });

  const addEmpresa = (d: { texto: string; responsable: string; fecha: string }) => setData({ ...data, empresa: [...empresa, newItem(d.texto, d.responsable, d.fecha)] });
  const removeEmpresa = (id: string) => setData({ ...data, empresa: empresa.filter((i) => i.id !== id) });
  const updateEmpresa = (id: string, patch: Partial<Item>) => setData({ ...data, empresa: empresa.map((i) => i.id === id ? { ...i, ...patch } : i) });

  const addSemanal = (d: { texto: string; responsable: string; fecha: string }) => setData({ ...data, semanales: [...semanales, newItem(d.texto, d.responsable, d.fecha)] });
  const removeSemanal = (id: string) => setData({ ...data, semanales: semanales.filter((i) => i.id !== id) });
  const updateSemanal = (id: string, patch: Partial<Item>) => setData({ ...data, semanales: semanales.map((i) => i.id === id ? { ...i, ...patch } : i) });

  const addDept = () => setData({ ...data, departamentos: [...departamentos, { id: `dept-${Date.now()}`, nombre: "", items: [] }] });
  const removeDept = (id: string) => setData({ ...data, departamentos: departamentos.filter((d) => d.id !== id) });
  const updateDeptNombre = (id: string, nombre: string) => setData({ ...data, departamentos: departamentos.map((d) => d.id === id ? { ...d, nombre } : d) });
  const addDeptItem = (deptId: string, d: { texto: string; responsable: string; fecha: string }) => setData({ ...data, departamentos: departamentos.map((dept) => dept.id === deptId ? { ...dept, items: [...(dept.items || []), newItem(d.texto, d.responsable, d.fecha)] } : dept) });
  const removeDeptItem = (deptId: string, itemId: string) => setData({ ...data, departamentos: departamentos.map((dept) => dept.id === deptId ? { ...dept, items: (dept.items || []).filter((i) => i.id !== itemId) } : dept) });
  const updateDeptItem = (deptId: string, itemId: string, patch: Partial<Item>) => setData({ ...data, departamentos: departamentos.map((dept) => dept.id === deptId ? { ...dept, items: (dept.items || []).map((i) => i.id === itemId ? { ...i, ...patch } : i) } : dept) });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type as string;
    if (activeType === "dept") {
      const oldIdx = departamentos.findIndex((d) => d.id === activeId);
      const newIdx = departamentos.findIndex((d) => d.id === overId);
      if (oldIdx !== -1 && newIdx !== -1) setData({ ...data, departamentos: arrayMove(departamentos, oldIdx, newIdx) });
      return;
    }
    const activeColId = active.data.current?.colId as string;
    const overColId = over.data.current?.colId as string;
    if (!activeColId || !overColId) return;
    const getList = (colId: string): Item[] => { if (colId === "empresa") return empresa; if (colId === "semanales") return semanales; return departamentos.find((d) => d.id === colId)?.items || []; };
    if (activeColId === overColId) {
      const list = getList(activeColId);
      const oldIdx = list.findIndex((i) => i.id === activeId);
      const newIdx = list.findIndex((i) => i.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(list, oldIdx, newIdx);
      if (activeColId === "empresa") setData({ ...data, empresa: reordered });
      else if (activeColId === "semanales") setData({ ...data, semanales: reordered });
      else setData({ ...data, departamentos: departamentos.map((d) => d.id === activeColId ? { ...d, items: reordered } : d) });
    } else {
      const srcList = getList(activeColId); const dstList = getList(overColId);
      const item = srcList.find((i) => i.id === activeId); if (!item) return;
      const newSrc = srcList.filter((i) => i.id !== activeId);
      const overIdx = dstList.findIndex((i) => i.id === overId);
      const newDst = overIdx >= 0 ? [...dstList.slice(0, overIdx), item, ...dstList.slice(overIdx)] : [...dstList, item];
      const newDepts = departamentos.map((d) => { if (d.id === activeColId) return { ...d, items: newSrc }; if (d.id === overColId) return { ...d, items: newDst }; return d; });
      const newEmpresa = activeColId === "empresa" ? newSrc : overColId === "empresa" ? newDst : empresa;
      const newSemanales = activeColId === "semanales" ? newSrc : overColId === "semanales" ? newDst : semanales;
      setData({ empresa: newEmpresa, semanales: newSemanales, departamentos: newDepts });
    }
  }

  if (viewMode) {
    return (
      <DocumentViewer title="Rocas" clienteNombre={clienteNombre}
        onClose={() => setViewMode(false)}
        mdContent={generateMd(data, clienteNombre)} mdFilename={makeMdFilename("rocas", clienteNombre)}>
        <DocSection label="Rocas Empresa">
          {empresaActivas.length === 0 ? <p style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Sin rocas.</p>
            : empresaActivas.map((i) => <DocItem key={i.id} texto={i.texto} responsable={i.responsable} fecha={i.fecha} />)}
        </DocSection>
        <DocSection label="Rocas Semanales">
          {semanalesActivas.length === 0 ? <p style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Sin rocas.</p>
            : semanalesActivas.map((i) => <DocItem key={i.id} texto={i.texto} responsable={i.responsable} fecha={i.fecha} />)}
        </DocSection>
        {departamentos.map((dept) => {
          const items = (dept.items || []).filter((i) => !i.completado);
          return (
            <DocSection key={dept.id} label={dept.nombre || "Departamento"}>
              {items.length === 0 ? <p style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>Sin rocas.</p>
                : items.map((i) => <DocItem key={i.id} texto={i.texto} responsable={i.responsable} fecha={i.fecha} />)}
            </DocSection>
          );
        })}
      </DocumentViewer>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold">Rocas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}><Eye className="h-4 w-4 mr-1.5" /> Ver documento</Button>
          <Button size="sm" onClick={saveNow} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
        </div>
      </div>
      <FieldHint>Las Rocas son las 1-7 prioridades más importantes del trimestre. Clic en una roca para editarla.</FieldHint>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-display font-semibold">Rocas Empresa</h2>
            <FieldHint>Prioridades de toda la organización este trimestre</FieldHint>
            <div className="mt-3">
              {empresaActivas.length === 0 && <p className="text-xs italic text-muted-foreground">Sin rocas.</p>}
              <SortableContext items={empresaActivas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {empresaActivas.map((item) => <SortableItemRow key={item.id} item={item} colId="empresa" onRemove={removeEmpresa} onUpdate={updateEmpresa} />)}
              </SortableContext>
            </div>
            <AddForm placeholder="Roca…" onAdd={addEmpresa} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-display font-semibold">Rocas Semanales</h2>
            <FieldHint>Compromisos y tareas a revisar cada semana</FieldHint>
            <div className="mt-3">
              {semanalesActivas.length === 0 && <p className="text-xs italic text-muted-foreground">Sin rocas.</p>}
              <SortableContext items={semanalesActivas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {semanalesActivas.map((item) => <SortableItemRow key={item.id} item={item} colId="semanales" onRemove={removeSemanal} onUpdate={updateSemanal} />)}
              </SortableContext>
            </div>
            <AddForm placeholder="Roca…" onAdd={addSemanal} />
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold">Rocas Departamentos</h2>
              <button onClick={addDept} className="text-primary hover:text-primary/80 transition-colors print:hidden" title="Añadir departamento"><FolderPlus className="h-4 w-4" /></button>
            </div>
            <FieldHint>Rocas específicas por área o departamento</FieldHint>
            <div className="mt-3 space-y-3">
              {departamentos.length === 0 && <p className="text-xs italic text-muted-foreground">Pulsa + para crear un departamento.</p>}
              <SortableContext items={departamentos.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {departamentos.map((dept) => (
                  <SortableDept key={dept.id} dept={dept} onRemoveDept={removeDept} onUpdateNombre={updateDeptNombre}
                    onAddItem={addDeptItem} onRemoveItem={removeDeptItem} onUpdateItem={updateDeptItem} />
                ))}
              </SortableContext>
            </div>
          </div>
        </div>
      </DndContext>

      <CompletadosPanel
        titulo="Rocas completadas"
        itemLabel="rocas"
        tipo="rocas"
        clienteNombre={clienteNombre}
        columnas={getColumnas(data, "rocas")}
        onUncheck={(colId, itemId) => setCompletado(colId, itemId, false)}
        onClear={clearCompletados}
      />
    </div>
  );
}
