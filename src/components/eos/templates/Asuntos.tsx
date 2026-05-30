import { useEffect, useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, FolderPlus, GripVertical } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  FieldHint, type NoClientProps,
} from "./shared";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Item { id: string; texto: string; responsable: string; fecha: string }
interface Departamento { id: string; nombre: string; items: Item[] }
interface Data { vision: Item[]; semanales: Item[]; departamentos: Departamento[] }
const DEFAULT: Data = { vision: [], semanales: [], departamentos: [] };

// ── Helpers ────────────────────────────────────────────────────────────────────
function toItem(raw: unknown, i: number): Item {
  if (typeof raw === "string") return { id: `l-${i}`, texto: raw, responsable: "", fecha: "" };
  const r = raw as Partial<Item>;
  return { id: r.id || `l-${i}`, texto: r.texto || "", responsable: r.responsable || "", fecha: r.fecha || "" };
}
function toItems(arr: unknown[]): Item[] { return (arr || []).map(toItem); }
function newItem(texto: string, responsable: string, fecha: string): Item {
  return { id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, texto, responsable, fecha };
}
function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T12:00:00")
    .toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    .replace(".", "");
}

// ── SortableItemRow — FUERA del componente, con edición inline ─────────────────
function SortableItemRow({
  item, colId, onRemove, onUpdate,
}: {
  item: Item;
  colId: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: "item", colId } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.texto);
  useEffect(() => { if (!editing) setVal(item.texto); }, [item.texto, editing]);

  const save = () => { onUpdate(item.id, { texto: val.trim() || item.texto }); setEditing(false); };

  return (
    <div ref={setNodeRef} style={style}
      className="group flex items-center gap-1.5 border-b border-border/40 py-1.5 last:border-0">
      <span
        {...attributes} {...listeners}
        className="cursor-grab shrink-0 touch-none text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors print:hidden"
      >
        <GripVertical className="h-3 w-3" />
      </span>

      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setVal(item.texto); setEditing(false); }
          }}
          className="flex-1 min-w-0 text-sm bg-transparent border-b border-primary outline-none"
        />
      ) : (
        <span
          className="flex-1 text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={() => setEditing(true)}
          title="Clic para editar"
        >
          {item.texto || <span className="italic text-muted-foreground/60">Asunto sin texto</span>}
        </span>
      )}

      {item.responsable && (
        <span className="shrink-0 text-xs text-muted-foreground">({item.responsable})</span>
      )}
      {item.fecha && (
        <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(item.fecha)}</span>
      )}
      <button
        onClick={() => onRemove(item.id)}
        className="ml-1 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:!text-destructive transition-all print:hidden"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── SortableDept — FUERA del componente, card de departamento sortable ─────────
function SortableDept({
  dept, onRemoveDept, onUpdateNombre, onAddItem, onRemoveItem, onUpdateItem,
}: {
  dept: Departamento;
  onRemoveDept: (id: string) => void;
  onUpdateNombre: (id: string, nombre: string) => void;
  onAddItem: (deptId: string, d: { texto: string; responsable: string; fecha: string }) => void;
  onRemoveItem: (deptId: string, itemId: string) => void;
  onUpdateItem: (deptId: string, itemId: string, patch: Partial<Item>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dept.id, data: { type: "dept" } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}
      className="rounded border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-blue-950/40">
      <div className="mb-2 flex items-center gap-2">
        <span
          {...attributes} {...listeners}
          className="cursor-grab shrink-0 touch-none text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors print:hidden"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <Input
          value={dept.nombre}
          onChange={(e) => onUpdateNombre(dept.id, e.target.value)}
          placeholder="Nombre del departamento"
          className="h-7 text-xs font-medium"
        />
        <button
          onClick={() => onRemoveDept(dept.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <SortableContext items={(dept.items || []).map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {(dept.items || []).length === 0 && (
          <p className="text-xs italic text-muted-foreground">Sin asuntos.</p>
        )}
        {(dept.items || []).map((item) => (
          <SortableItemRow
            key={item.id}
            item={item}
            colId={dept.id}
            onRemove={(id) => onRemoveItem(dept.id, id)}
            onUpdate={(id, patch) => onUpdateItem(dept.id, id, patch)}
          />
        ))}
      </SortableContext>
      <AddForm placeholder="Asunto…" onAdd={(d) => onAddItem(dept.id, d)} />
    </div>
  );
}

// ── AddForm — FUERA del componente, gestiona su propio estado open/campos ──────
function AddForm({
  placeholder, onAdd,
}: {
  placeholder: string;
  onAdd: (d: { texto: string; responsable: string; fecha: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [resp, setResp] = useState("");
  const [fecha, setFecha] = useState("");

  const reset = () => { setTexto(""); setResp(""); setFecha(""); setOpen(false); };
  const submit = () => {
    if (!texto.trim()) return;
    onAdd({ texto, responsable: resp, fecha });
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors print:hidden"
      >
        <Plus className="h-3 w-3" /> Añadir
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-1.5 print:hidden">
      <Input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs"
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoFocus
      />
      <div className="flex gap-1.5">
        <Input
          value={resp}
          onChange={(e) => setResp(e.target.value)}
          placeholder="Responsable"
          className="h-7 flex-1 text-xs"
        />
        <Input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="h-7 text-xs"
        />
        <Button size="sm" className="h-7 shrink-0 px-3 text-xs" onClick={submit}>
          Añadir
        </Button>
        <button onClick={reset} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function Asuntos({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId, "asuntos", DEFAULT,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Normalizar datos antiguos (string[]) al nuevo formato Item[]
  useEffect(() => {
    if (loading) return;
    const needsNorm = (arr: unknown[]) =>
      (arr || []).some((i) => typeof i === "string" || !(i as Item).id);
    if (
      needsNorm(data.vision) ||
      needsNorm(data.semanales) ||
      (data.departamentos || []).some((d) => needsNorm(d.items))
    ) {
      setData({
        vision: toItems(data.vision),
        semanales: toItems(data.semanales),
        departamentos: (data.departamentos || []).map((d) => ({
          ...d, items: toItems(d.items),
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const vision = data.vision || [];
  const semanales = data.semanales || [];
  const departamentos = data.departamentos || [];

  // ── Visión ─────────────────────────────────────────────────────────────────
  const addVision = (d: { texto: string; responsable: string; fecha: string }) =>
    setData({ ...data, vision: [...vision, newItem(d.texto, d.responsable, d.fecha)] });
  const removeVision = (id: string) =>
    setData({ ...data, vision: vision.filter((i) => i.id !== id) });
  const updateVision = (id: string, patch: Partial<Item>) =>
    setData({ ...data, vision: vision.map((i) => i.id === id ? { ...i, ...patch } : i) });

  // ── Semanales ──────────────────────────────────────────────────────────────
  const addSemanal = (d: { texto: string; responsable: string; fecha: string }) =>
    setData({ ...data, semanales: [...semanales, newItem(d.texto, d.responsable, d.fecha)] });
  const removeSemanal = (id: string) =>
    setData({ ...data, semanales: semanales.filter((i) => i.id !== id) });
  const updateSemanal = (id: string, patch: Partial<Item>) =>
    setData({ ...data, semanales: semanales.map((i) => i.id === id ? { ...i, ...patch } : i) });

  // ── Departamentos ──────────────────────────────────────────────────────────
  const addDept = () =>
    setData({ ...data, departamentos: [...departamentos, { id: `dept-${Date.now()}`, nombre: "", items: [] }] });
  const removeDept = (id: string) =>
    setData({ ...data, departamentos: departamentos.filter((d) => d.id !== id) });
  const updateDeptNombre = (id: string, nombre: string) =>
    setData({ ...data, departamentos: departamentos.map((d) => d.id === id ? { ...d, nombre } : d) });
  const addDeptItem = (deptId: string, d: { texto: string; responsable: string; fecha: string }) =>
    setData({
      ...data,
      departamentos: departamentos.map((dept) =>
        dept.id === deptId
          ? { ...dept, items: [...(dept.items || []), newItem(d.texto, d.responsable, d.fecha)] }
          : dept
      ),
    });
  const removeDeptItem = (deptId: string, itemId: string) =>
    setData({
      ...data,
      departamentos: departamentos.map((dept) =>
        dept.id === deptId
          ? { ...dept, items: (dept.items || []).filter((i) => i.id !== itemId) }
          : dept
      ),
    });
  const updateDeptItem = (deptId: string, itemId: string, patch: Partial<Item>) =>
    setData({
      ...data,
      departamentos: departamentos.map((dept) =>
        dept.id === deptId
          ? { ...dept, items: (dept.items || []).map((i) => i.id === itemId ? { ...i, ...patch } : i) }
          : dept
      ),
    });

  // ── DnD: onDragEnd ─────────────────────────────────────────────────────────
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeType = active.data.current?.type as string;

    // Reordenar departamentos
    if (activeType === "dept") {
      const oldIdx = departamentos.findIndex((d) => d.id === activeId);
      const newIdx = departamentos.findIndex((d) => d.id === overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        setData({ ...data, departamentos: arrayMove(departamentos, oldIdx, newIdx) });
      }
      return;
    }

    // Reordenar/mover items
    const activeColId = active.data.current?.colId as string;
    const overColId = over.data.current?.colId as string;
    if (!activeColId || !overColId) return;

    const getList = (colId: string): Item[] => {
      if (colId === "vision") return vision;
      if (colId === "semanales") return semanales;
      const dept = departamentos.find((d) => d.id === colId);
      return dept?.items || [];
    };

    if (activeColId === overColId) {
      // Mismo columna: reordenar
      const list = getList(activeColId);
      const oldIdx = list.findIndex((i) => i.id === activeId);
      const newIdx = list.findIndex((i) => i.id === overId);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(list, oldIdx, newIdx);
      if (activeColId === "vision") setData({ ...data, vision: reordered });
      else if (activeColId === "semanales") setData({ ...data, semanales: reordered });
      else {
        setData({
          ...data,
          departamentos: departamentos.map((d) =>
            d.id === activeColId ? { ...d, items: reordered } : d
          ),
        });
      }
    } else {
      // Columnas distintas: mover item
      const srcList = getList(activeColId);
      const dstList = getList(overColId);
      const item = srcList.find((i) => i.id === activeId);
      if (!item) return;
      const newSrc = srcList.filter((i) => i.id !== activeId);
      const overIdx = dstList.findIndex((i) => i.id === overId);
      const newDst = overIdx >= 0
        ? [...dstList.slice(0, overIdx), item, ...dstList.slice(overIdx)]
        : [...dstList, item];

      const newDepts = departamentos.map((d) => {
        if (d.id === activeColId) return { ...d, items: newSrc };
        if (d.id === overColId) return { ...d, items: newDst };
        return d;
      });
      const newVision = activeColId === "vision" ? newSrc : overColId === "vision" ? newDst : vision;
      const newSemanales = activeColId === "semanales" ? newSrc : overColId === "semanales" ? newDst : semanales;

      setData({ vision: newVision, semanales: newSemanales, departamentos: newDepts });
    }
  }

  return (
    <div className="max-w-5xl">
      <PrintHeader title="Asuntos" subtitle={clienteNombre} />

      <div className="flex items-start justify-between mb-4 print:hidden">
        <div>
          <h1 className="text-xl font-display font-bold">Asuntos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <PrintButton />
          <Button size="sm" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {/* ── Columna 1: Visión ── */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-display font-semibold text-foreground">Asuntos Visión</h2>
            <FieldHint>Problemas estratégicos del largo plazo que afectan a la visión</FieldHint>
            <div className="mt-3">
              {vision.length === 0 && (
                <p className="text-xs italic text-muted-foreground">Sin asuntos.</p>
              )}
              <SortableContext items={vision.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {vision.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    colId="vision"
                    onRemove={removeVision}
                    onUpdate={updateVision}
                  />
                ))}
              </SortableContext>
            </div>
            <AddForm placeholder="Asunto…" onAdd={addVision} />
          </div>

          {/* ── Columna 2: Semanales ── */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-1 text-sm font-display font-semibold text-foreground">Asuntos Semanales</h2>
            <FieldHint>Asuntos que se tratarán en la próxima reunión semanal</FieldHint>
            <div className="mt-3">
              {semanales.length === 0 && (
                <p className="text-xs italic text-muted-foreground">Sin asuntos.</p>
              )}
              <SortableContext items={semanales.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {semanales.map((item) => (
                  <SortableItemRow
                    key={item.id}
                    item={item}
                    colId="semanales"
                    onRemove={removeSemanal}
                    onUpdate={updateSemanal}
                  />
                ))}
              </SortableContext>
            </div>
            <AddForm placeholder="Asunto…" onAdd={addSemanal} />
          </div>

          {/* ── Columna 3: Departamentos ── */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-foreground">Asuntos Departamentos</h2>
              <button
                onClick={addDept}
                className="text-primary hover:text-primary/80 transition-colors print:hidden"
                title="Añadir departamento"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            <FieldHint>Asuntos específicos por departamento o área</FieldHint>

            <div className="mt-3 space-y-3">
              {departamentos.length === 0 && (
                <p className="text-xs italic text-muted-foreground">Pulsa + para crear un departamento.</p>
              )}
              <SortableContext items={departamentos.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {departamentos.map((dept) => (
                  <SortableDept
                    key={dept.id}
                    dept={dept}
                    onRemoveDept={removeDept}
                    onUpdateNombre={updateDeptNombre}
                    onAddItem={addDeptItem}
                    onRemoveItem={removeDeptItem}
                    onUpdateItem={updateDeptItem}
                  />
                ))}
              </SortableContext>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
