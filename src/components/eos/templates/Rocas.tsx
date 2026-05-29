import { useEffect, useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, FolderPlus } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  FieldHint, type NoClientProps,
} from "./shared";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Item { id: string; texto: string; responsable: string; fecha: string }
interface Departamento { id: string; nombre: string; items: Item[] }
interface Data { empresa: Item[]; semanales: Item[]; departamentos: Departamento[] }
const DEFAULT: Data = { empresa: [], semanales: [], departamentos: [] };

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

// ── ItemRow — FUERA del componente principal para evitar re-mount al escribir ──
function ItemRow({ item, onRemove }: { item: Item; onRemove: (id: string) => void }) {
  return (
    <div className="group flex items-center gap-1.5 border-b border-border/40 py-1.5 last:border-0">
      <span className="flex-1 text-sm text-foreground">{item.texto}</span>
      {item.responsable && (
        <span className="text-xs text-muted-foreground">({item.responsable})</span>
      )}
      {item.fecha && (
        <span className="text-xs text-muted-foreground">{fmtDate(item.fecha)}</span>
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

// ── AddForm — FUERA del componente, gestiona su propio estado open/campos ──────
function AddForm({
  placeholder,
  onAdd,
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
export function Rocas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "rocas",
    DEFAULT
  );

  // Normalizar datos antiguos (con campo "completada") al nuevo formato Item[]
  useEffect(() => {
    if (loading) return;
    const needsNorm = (arr: unknown[]) =>
      (arr || []).some((i) => typeof i === "string" || !(i as Item).id);
    if (
      needsNorm(data.empresa) ||
      needsNorm(data.semanales) ||
      (data.departamentos || []).some((d) => needsNorm(d.items))
    ) {
      setData({
        empresa: toItems(data.empresa),
        semanales: toItems(data.semanales),
        departamentos: (data.departamentos || []).map((d) => ({
          ...d,
          items: toItems(d.items),
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const empresa = data.empresa || [];
  const semanales = data.semanales || [];
  const departamentos = data.departamentos || [];

  // ── Empresa ────────────────────────────────────────────────────────────────
  const addEmpresa = (d: { texto: string; responsable: string; fecha: string }) =>
    setData({ ...data, empresa: [...empresa, newItem(d.texto, d.responsable, d.fecha)] });
  const removeEmpresa = (id: string) =>
    setData({ ...data, empresa: empresa.filter((i) => i.id !== id) });

  // ── Semanales ──────────────────────────────────────────────────────────────
  const addSemanal = (d: { texto: string; responsable: string; fecha: string }) =>
    setData({ ...data, semanales: [...semanales, newItem(d.texto, d.responsable, d.fecha)] });
  const removeSemanal = (id: string) =>
    setData({ ...data, semanales: semanales.filter((i) => i.id !== id) });

  // ── Departamentos ──────────────────────────────────────────────────────────
  const addDept = () =>
    setData({
      ...data,
      departamentos: [...departamentos, { id: `dept-${Date.now()}`, nombre: "", items: [] }],
    });
  const removeDept = (id: string) =>
    setData({ ...data, departamentos: departamentos.filter((d) => d.id !== id) });
  const updateDeptNombre = (id: string, nombre: string) =>
    setData({
      ...data,
      departamentos: departamentos.map((d) => (d.id === id ? { ...d, nombre } : d)),
    });
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

  return (
    <div className="max-w-5xl">
      <PrintHeader title="Rocas" subtitle={clienteNombre} />

      <div className="flex items-start justify-between mb-4 print:hidden">
        <div>
          <h1 className="text-xl font-display font-bold">Rocas</h1>
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

      <FieldHint>
        Las Rocas son las 1-7 prioridades más importantes del trimestre. Sin Roca no hay foco.
      </FieldHint>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* ── Columna 1: Empresa ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-display font-semibold text-foreground">Rocas Empresa</h2>
          <FieldHint>Prioridades de toda la organización este trimestre</FieldHint>
          <div className="mt-3">
            {empresa.length === 0 && (
              <p className="text-xs italic text-muted-foreground">Sin rocas.</p>
            )}
            {empresa.map((item) => (
              <ItemRow key={item.id} item={item} onRemove={removeEmpresa} />
            ))}
          </div>
          <AddForm placeholder="Roca…" onAdd={addEmpresa} />
        </div>

        {/* ── Columna 2: Semanales ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-1 text-sm font-display font-semibold text-foreground">Rocas Semanales</h2>
          <FieldHint>Compromisos y tareas a revisar cada semana</FieldHint>
          <div className="mt-3">
            {semanales.length === 0 && (
              <p className="text-xs italic text-muted-foreground">Sin rocas.</p>
            )}
            {semanales.map((item) => (
              <ItemRow key={item.id} item={item} onRemove={removeSemanal} />
            ))}
          </div>
          <AddForm placeholder="Roca…" onAdd={addSemanal} />
        </div>

        {/* ── Columna 3: Departamentos (fondo azul suave) ── */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold text-foreground">Rocas Departamentos</h2>
            <button
              onClick={addDept}
              className="text-primary hover:text-primary/80 transition-colors print:hidden"
              title="Añadir departamento"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <FieldHint>Rocas específicas por área o departamento</FieldHint>

          <div className="mt-3 space-y-3">
            {departamentos.length === 0 && (
              <p className="text-xs italic text-muted-foreground">
                Pulsa + para crear un departamento.
              </p>
            )}
            {departamentos.map((dept) => (
              <div
                key={dept.id}
                className="rounded border border-blue-200 bg-white/80 p-3 dark:border-blue-800 dark:bg-blue-950/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={dept.nombre}
                    onChange={(e) => updateDeptNombre(dept.id, e.target.value)}
                    placeholder="Nombre del departamento"
                    className="h-7 text-xs font-medium"
                  />
                  <button
                    onClick={() => removeDept(dept.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  {(dept.items || []).length === 0 && (
                    <p className="text-xs italic text-muted-foreground">Sin rocas.</p>
                  )}
                  {(dept.items || []).map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onRemove={(id) => removeDeptItem(dept.id, id)}
                    />
                  ))}
                  <AddForm
                    placeholder="Roca…"
                    onAdd={(d) => addDeptItem(dept.id, d)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
