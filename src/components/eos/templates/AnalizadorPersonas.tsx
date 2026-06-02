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

type CellValue = "✓" | "△" | "✗" | "";

interface Persona {
  id: string; nombre: string;
  valores: Record<string, CellValue>;
  cdc_comprende: CellValue; cdc_desea: CellValue; cdc_capacitado: CellValue;
}

interface Data { columnas_valores: string[]; personas: Persona[] }

const DEFAULT_COLS = ["Seguro de sí mismo","Crecer o morir","Ayudar primero","Hacer lo correcto","Hacer lo que dices"];
const DEFAULT: Data = { columnas_valores: DEFAULT_COLS, personas: [] };
const OPTIONS: CellValue[] = ["✓", "△", "✗"];

function CellSelect({ value, onChange }: { value: CellValue; onChange: (v: CellValue) => void }) {
  return (
    <div className="flex gap-1 justify-center">
      {OPTIONS.map((opt) => (
        <button key={opt} onClick={() => onChange(opt === value ? "" : opt)}
          className={`h-7 w-7 rounded text-sm transition-all border ${
            value === opt
              ? opt === "✓" ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : opt === "△" ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-red-400 bg-red-50 text-red-700"
              : "border-border bg-background text-muted-foreground hover:border-primary/40"
          }`}>{opt}</button>
      ))}
    </div>
  );
}

function generateMd(data: Data, clienteNombre: string): string {
  const cols = [...data.columnas_valores, "Comprende (C)", "Desea (D)", "Capacitado (C)"];
  const lines = [`# Analizador de Personas — ${clienteNombre}`, `\n| Persona | ${cols.join(" | ")} |`, `|---|${cols.map(() => "---").join("|")}|`];
  for (const p of data.personas) {
    if (!p.nombre) continue;
    const vals = data.columnas_valores.map((c) => p.valores[c] || "");
    lines.push(`| ${p.nombre} | ${vals.join(" | ")} | ${p.cdc_comprende} | ${p.cdc_desea} | ${p.cdc_capacitado} |`);
  }
  return lines.join("\n");
}

// ── Fila sortable ───────────────────────────────────────────────────────────────
function SortablePersonaRow({ p, columnas, updatePersona, setValorCell, removePersona }: {
  p: Persona;
  columnas: string[];
  updatePersona: (id: string, patch: Partial<Persona>) => void;
  setValorCell: (id: string, col: string, v: CellValue) => void;
  removePersona: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="px-1 py-2 w-6">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </td>
      <td className="px-3 py-2"><Input value={p.nombre} onChange={(e) => updatePersona(p.id, { nombre: e.target.value })} placeholder="Nombre" className="h-8 text-sm" /></td>
      {columnas.map((col, i) => (
        <td key={i} className="border-l border-border px-2 py-2">
          <CellSelect value={p.valores[col] ?? ""} onChange={(v) => setValorCell(p.id, col, v)} />
        </td>
      ))}
      <td className="border-l border-border px-2 py-2"><CellSelect value={p.cdc_comprende} onChange={(v) => updatePersona(p.id, { cdc_comprende: v })} /></td>
      <td className="border-l border-border px-2 py-2"><CellSelect value={p.cdc_desea} onChange={(v) => updatePersona(p.id, { cdc_desea: v })} /></td>
      <td className="border-l border-border px-2 py-2"><CellSelect value={p.cdc_capacitado} onChange={(v) => updatePersona(p.id, { cdc_capacitado: v })} /></td>
      <td className="px-2 py-2"><button onClick={() => removePersona(p.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></td>
    </tr>
  );
}

export function AnalizadorPersonas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(clienteId, "personas", DEFAULT);
  const [viewMode, setViewMode] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addPersona = () => setData({
    ...data,
    personas: [...data.personas, {
      id: `p-${Date.now()}`, nombre: "",
      valores: Object.fromEntries(data.columnas_valores.map((c) => [c, ""])),
      cdc_comprende: "", cdc_desea: "", cdc_capacitado: "",
    }],
  });
  const removePersona = (id: string) => setData({ ...data, personas: data.personas.filter((p) => p.id !== id) });
  const updatePersona = (id: string, patch: Partial<Persona>) =>
    setData({ ...data, personas: data.personas.map((p) => p.id === id ? { ...p, ...patch } : p) });
  const setValorCell = (id: string, col: string, v: CellValue) => {
    const persona = data.personas.find((p) => p.id === id);
    if (!persona) return;
    updatePersona(id, { valores: { ...persona.valores, [col]: v } });
  };
  const addCol = () => setData({
    columnas_valores: [...data.columnas_valores, ""],
    personas: data.personas.map((p) => ({ ...p, valores: { ...p.valores, "": "" } })),
  });
  const renameCol = (i: number, nombre: string) => {
    const oldName = data.columnas_valores[i];
    const newCols = [...data.columnas_valores];
    newCols[i] = nombre;
    setData({
      columnas_valores: newCols,
      personas: data.personas.map((p) => {
        const v = { ...p.valores };
        if (oldName !== nombre) { v[nombre] = v[oldName] ?? ""; delete v[oldName]; }
        return { ...p, valores: v };
      }),
    });
  };
  const removeCol = (i: number) => {
    const col = data.columnas_valores[i];
    setData({
      columnas_valores: data.columnas_valores.filter((_, j) => j !== i),
      personas: data.personas.map((p) => { const v = { ...p.valores }; delete v[col]; return { ...p, valores: v }; }),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = data.personas.findIndex((p) => p.id === active.id);
      const newIndex = data.personas.findIndex((p) => p.id === over.id);
      setData({ ...data, personas: arrayMove(data.personas, oldIndex, newIndex) });
    }
  };

  if (viewMode) {
    return (
      <DocumentViewer title="Analizador de Personas" clienteNombre={clienteNombre}
        onClose={() => setViewMode(false)}
        mdContent={generateMd(data, clienteNombre)} mdFilename={makeMdFilename("personas", clienteNombre)}>
        <DocSection label="Tabla de Personas">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600 }}>Persona</th>
                  {data.columnas_valores.map((c, i) => <th key={i} style={{ textAlign: "center", padding: "6px 6px", fontWeight: 600 }}>{c}</th>)}
                  <th style={{ textAlign: "center", padding: "6px 6px", fontWeight: 600, color: "#1d4ed8" }}>C</th>
                  <th style={{ textAlign: "center", padding: "6px 6px", fontWeight: 600, color: "#1d4ed8" }}>D</th>
                  <th style={{ textAlign: "center", padding: "6px 6px", fontWeight: 600, color: "#1d4ed8" }}>C</th>
                </tr>
              </thead>
              <tbody>
                {data.personas.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 500 }}>{p.nombre}</td>
                    {data.columnas_valores.map((c, i) => <td key={i} style={{ textAlign: "center", padding: "5px 6px" }}>{p.valores[c] || ""}</td>)}
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>{p.cdc_comprende}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>{p.cdc_desea}</td>
                    <td style={{ textAlign: "center", padding: "5px 6px" }}>{p.cdc_capacitado}</td>
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
          <h1 className="text-xl font-display font-bold">Analizador de Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}><Eye className="h-4 w-4 mr-1.5" /> Ver documento</Button>
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
          <Button size="sm" variant="outline" onClick={addCol}><Plus className="h-4 w-4 mr-1.5" /> Valor</Button>
          <Button size="sm" onClick={addPersona}><Plus className="h-4 w-4 mr-1.5" /> Persona</Button>
        </div>
      </div>
      <FieldHint>✓ = cumple, △ = parcialmente, ✗ = no cumple. C/D/C = Comprende / Desea / tiene Capacidad</FieldHint>
      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-max w-full text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-6 border-b border-border" />
              <th className="w-40 border-b border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground">Persona</th>
              {data.columnas_valores.map((col, i) => (
                <th key={i} className="border-b border-l border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                  <div className="flex items-center justify-center gap-1">
                    <Input value={col} onChange={(e) => renameCol(i, e.target.value)}
                      className="h-6 min-w-[80px] border-0 bg-transparent px-0 text-center text-xs font-medium focus-visible:ring-0" />
                    <button onClick={() => removeCol(i)} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </th>
              ))}
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">Comprende</th>
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">Desea</th>
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">Capacitado</th>
              <th className="w-8 border-b border-border" />
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.personas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <tbody>
                {data.personas.length === 0 && (
                  <tr><td colSpan={data.columnas_valores.length + 5} className="py-8 text-center text-sm text-muted-foreground">Pulsa «Persona» para añadir la primera fila.</td></tr>
                )}
                {data.personas.map((p) => (
                  <SortablePersonaRow key={p.id} p={p} columnas={data.columnas_valores}
                    updatePersona={updatePersona} setValorCell={setValorCell} removePersona={removePersona} />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
    </div>
  );
}
