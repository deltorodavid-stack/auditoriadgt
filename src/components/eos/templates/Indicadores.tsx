import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Eye, GripVertical } from "lucide-react";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  FieldHint, type NoClientProps,
} from "./shared";
import {
  DocumentViewer, DocSection, makeMdFilename,
} from "@/components/ui/DocumentViewer";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface Fila { id: string; responsable: string; indicador: string; meta: string; meses: Record<string, string> }
interface Data { filas: Fila[] }

const DEFAULT_ROWS = ["Leads","Clientes altas","Clientes bajas","Ingresos mes","Gastos mes","Pagos pendientes","Cobros pendientes","Tareas activas","Tareas atrasadas"];

function makeDefaultData(): Data {
  return {
    filas: DEFAULT_ROWS.map((nombre, i) => ({
      id: `default-${i}-${Date.now()}`, responsable: "", indicador: nombre, meta: "",
      meses: Object.fromEntries(MESES.map((m) => [m, ""])),
    })),
  };
}

function generateMd(data: Data, clienteNombre: string): string {
  const lines = [`# Indicadores / Cuadro de Mando — ${clienteNombre}`, `\n| Responsable | Indicador | Meta | ${MESES.join(" | ")} |`, `|---|---|---|${MESES.map(() => "---").join("|")}|`];
  for (const f of data.filas) {
    if (!f.indicador) continue;
    const vals = MESES.map((m) => f.meses[m] || "").join(" | ");
    lines.push(`| ${f.responsable} | ${f.indicador} | ${f.meta} | ${vals} |`);
  }
  return lines.join("\n");
}

// ── Fila sortable ───────────────────────────────────────────────────────────────
function SortableFila({ f, updateFila, updateMes, removeFila }: {
  f: Fila;
  updateFila: (id: string, patch: Partial<Fila>) => void;
  updateMes: (id: string, mes: string, val: string) => void;
  removeFila: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: f.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="px-1 py-1.5 w-6">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </td>
      <td className="px-2 py-1.5"><Input value={f.responsable} onChange={(e) => updateFila(f.id, { responsable: e.target.value })} placeholder="Nombre" className="h-7 w-[90px] max-w-[90px] text-xs" /></td>
      <td className="border-l border-border px-2 py-1.5"><Input value={f.indicador} onChange={(e) => updateFila(f.id, { indicador: e.target.value })} placeholder="Indicador" className="h-7 min-w-[130px] text-xs" /></td>
      <td className="border-l border-border px-2 py-1.5"><Input value={f.meta} onChange={(e) => updateFila(f.id, { meta: e.target.value })} placeholder="Meta" className="h-7 w-20 text-xs" /></td>
      {MESES.map((m) => (
        <td key={m} className="border-l border-border px-1 py-1.5">
          <Input value={f.meses[m] ?? ""} onChange={(e) => updateMes(f.id, m, e.target.value)} className="h-7 w-14 text-center text-xs" />
        </td>
      ))}
      <td className="px-2 py-1.5"><button onClick={() => removeFila(f.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button></td>
    </tr>
  );
}

export function Indicadores({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "indicadores", makeDefaultData());
  const [viewMode, setViewMode] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addFila = () => setData({ filas: [...data.filas, { id: crypto.randomUUID(), responsable: "", indicador: "", meta: "", meses: Object.fromEntries(MESES.map((m) => [m, ""])) }] });
  const removeFila = (id: string) => setData({ filas: data.filas.filter((f) => f.id !== id) });
  const updateFila = (id: string, patch: Partial<Fila>) => setData({ filas: data.filas.map((f) => f.id === id ? { ...f, ...patch } : f) });
  const updateMes = (id: string, mes: string, val: string) => {
    const fila = data.filas.find((f) => f.id === id);
    if (!fila) return;
    updateFila(id, { meses: { ...fila.meses, [mes]: val } });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.filas.findIndex((f) => f.id === active.id);
      const newIndex = data.filas.findIndex((f) => f.id === over.id);
      setData({ filas: arrayMove(data.filas, oldIndex, newIndex) });
    }
  };

  if (viewMode) {
    return (
      <DocumentViewer title="Indicadores / Cuadro de Mando" clienteNombre={clienteNombre}
        onClose={() => setViewMode(false)}
        mdContent={generateMd(data, clienteNombre)} mdFilename={makeMdFilename("indicadores", clienteNombre)}>
        <DocSection label="Cuadro de Mando">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#374151" }}>Responsable</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#374151" }}>Indicador</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, color: "#374151" }}>Meta</th>
                  {MESES.map((m) => <th key={m} style={{ textAlign: "center", padding: "6px 4px", fontWeight: 600, color: "#374151" }}>{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.filas.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "5px 8px", color: "#6b7280" }}>{f.responsable}</td>
                    <td style={{ padding: "5px 8px", fontWeight: 500 }}>{f.indicador}</td>
                    <td style={{ padding: "5px 8px", color: "#6b7280" }}>{f.meta}</td>
                    {MESES.map((m) => <td key={m} style={{ padding: "5px 4px", textAlign: "center", color: "#374151" }}>{f.meses[m] || ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>
      </DocumentViewer>
    );
  }

  return (
    <div className="max-w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold">Indicadores / Cuadro de Mando</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}><Eye className="h-4 w-4 mr-1.5" /> Ver documento</Button>
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
          <Button size="sm" onClick={addFila}><Plus className="h-4 w-4 mr-1.5" /> Indicador</Button>
        </div>
      </div>

      <FieldHint>Cada persona tiene al menos un número del que es responsable cada semana</FieldHint>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-max w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-6 border-b border-border" />
              <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap w-[96px] max-w-[96px]">Responsable</th>
              <th className="border-b border-l border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Indicador</th>
              <th className="border-b border-l border-border px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Meta</th>
              {MESES.map((m) => <th key={m} className="border-b border-l border-border px-2 py-2 text-center font-medium text-muted-foreground">{m}</th>)}
              <th className="w-8 border-b border-border" />
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.filas.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {data.filas.map((f) => (
                  <SortableFila key={f.id} f={f} updateFila={updateFila} updateMes={updateMes} removeFila={removeFila} />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
    </div>
  );
}
