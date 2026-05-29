import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, FolderPlus } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  FieldHint,
  type NoClientProps,
} from "./shared";

interface Roca {
  id: string;
  texto: string;
  responsable: string;
  fecha: string;
  completada: boolean;
}

interface Departamento {
  id: string;
  nombre: string;
  rocas: Roca[];
}

interface Data {
  empresa: Roca[];
  semanales: Roca[];
  departamentos: Departamento[];
}

const DEFAULT: Data = { empresa: [], semanales: [], departamentos: [] };

function newRoca(): Roca {
  return { id: `r-${Date.now()}-${Math.random()}`, texto: "", responsable: "", fecha: "", completada: false };
}

// ─── RocaRow — fuera del componente para evitar re-mount al escribir ──────────
interface RocaRowProps {
  roca: Roca;
  onUpdate: (id: string, patch: Partial<Roca>) => void;
  onRemove: (id: string) => void;
}

function RocaRow({ roca, onUpdate, onRemove }: RocaRowProps) {
  return (
    <div className={`flex items-center gap-2 py-1.5 ${roca.completada ? "opacity-50" : ""}`}>
      <button
        onClick={() => onUpdate(roca.id, { completada: !roca.completada })}
        className={`h-5 w-5 shrink-0 rounded border-2 transition-colors ${
          roca.completada
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border hover:border-primary/50"
        }`}
        title="Marcar completada"
      >
        {roca.completada && <span className="flex items-center justify-center text-[10px] leading-none">✓</span>}
      </button>
      <Input
        value={roca.texto}
        onChange={(e) => onUpdate(roca.id, { texto: e.target.value })}
        placeholder="Roca…"
        className={`h-7 flex-1 text-xs ${roca.completada ? "line-through" : ""}`}
      />
      <Input
        value={roca.responsable}
        onChange={(e) => onUpdate(roca.id, { responsable: e.target.value })}
        placeholder="Responsable"
        className="h-7 w-24 text-xs"
      />
      <Input
        type="date"
        value={roca.fecha}
        onChange={(e) => onUpdate(roca.id, { fecha: e.target.value })}
        className="h-7 w-32 text-xs"
      />
      <button
        onClick={() => onRemove(roca.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── RocaColumn — fuera del componente para evitar re-mount ───────────────────
interface RocaColProps {
  title: string;
  hint: string;
  rocas: Roca[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Roca>) => void;
  onRemove: (id: string) => void;
}

function RocaColumn({ title, hint, rocas, onAdd, onUpdate, onRemove }: RocaColProps) {
  const done = rocas.filter((r) => r.completada).length;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-display font-semibold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          {rocas.length > 0 && (
            <span className="text-xs text-muted-foreground">{done}/{rocas.length}</span>
          )}
          <button
            onClick={onAdd}
            className="text-primary hover:text-primary/80 transition-colors print:hidden"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <FieldHint>{hint}</FieldHint>

      <div className="mt-3 space-y-0.5 divide-y divide-border">
        {rocas.length === 0 && (
          <p className="py-3 text-center text-xs italic text-muted-foreground">Sin rocas.</p>
        )}
        {rocas.map((r) => (
          <RocaRow key={r.id} roca={r} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

export function Rocas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "rocas",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  // ── Empresa ────────────────────────────────────────────────────────────────
  const addEmpresa = () =>
    setData({ ...data, empresa: [...data.empresa, newRoca()] });

  const updateEmpresa = (id: string, patch: Partial<Roca>) =>
    setData({ ...data, empresa: data.empresa.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const removeEmpresa = (id: string) =>
    setData({ ...data, empresa: data.empresa.filter((r) => r.id !== id) });

  // ── Semanales ──────────────────────────────────────────────────────────────
  const addSemanal = () =>
    setData({ ...data, semanales: [...data.semanales, newRoca()] });

  const updateSemanal = (id: string, patch: Partial<Roca>) =>
    setData({ ...data, semanales: data.semanales.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const removeSemanal = (id: string) =>
    setData({ ...data, semanales: data.semanales.filter((r) => r.id !== id) });

  // ── Departamentos ──────────────────────────────────────────────────────────
  const addDept = () =>
    setData({
      ...data,
      departamentos: [
        ...data.departamentos,
        { id: `dept-${Date.now()}`, nombre: "", rocas: [] },
      ],
    });

  const removeDept = (id: string) =>
    setData({ ...data, departamentos: data.departamentos.filter((d) => d.id !== id) });

  const updateDeptNombre = (id: string, nombre: string) =>
    setData({
      ...data,
      departamentos: data.departamentos.map((d) => (d.id === id ? { ...d, nombre } : d)),
    });

  const addDeptRoca = (deptId: string) =>
    setData({
      ...data,
      departamentos: data.departamentos.map((d) =>
        d.id === deptId ? { ...d, rocas: [...d.rocas, newRoca()] } : d
      ),
    });

  const updateDeptRoca = (deptId: string, rocaId: string, patch: Partial<Roca>) =>
    setData({
      ...data,
      departamentos: data.departamentos.map((d) =>
        d.id === deptId
          ? { ...d, rocas: d.rocas.map((r) => (r.id === rocaId ? { ...r, ...patch } : r)) }
          : d
      ),
    });

  const removeDeptRoca = (deptId: string, rocaId: string) =>
    setData({
      ...data,
      departamentos: data.departamentos.map((d) =>
        d.id === deptId
          ? { ...d, rocas: d.rocas.filter((r) => r.id !== rocaId) }
          : d
      ),
    });

  return (
    <div className="max-w-6xl">
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

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {/* Columna 1: Empresa */}
        <RocaColumn
          title="Rocas Empresa"
          hint="Prioridades de toda la organización este trimestre"
          rocas={data.empresa}
          onAdd={addEmpresa}
          onUpdate={updateEmpresa}
          onRemove={removeEmpresa}
        />

        {/* Columna 2: Semanales */}
        <RocaColumn
          title="Rocas Semanales"
          hint="Compromisos y tareas a revisar cada semana"
          rocas={data.semanales}
          onAdd={addSemanal}
          onUpdate={updateSemanal}
          onRemove={removeSemanal}
        />

        {/* Columna 3: Departamentos */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold">Rocas Departamento</h2>
            <button
              onClick={addDept}
              className="text-primary hover:text-primary/80 transition-colors print:hidden"
              title="Añadir departamento"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <FieldHint>Rocas específicas por área o departamento</FieldHint>

          <div className="mt-3 space-y-4">
            {data.departamentos.length === 0 && (
              <p className="text-xs italic text-muted-foreground">
                Pulsa + para crear un departamento.
              </p>
            )}
            {data.departamentos.map((dept) => (
              <div key={dept.id} className="rounded border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={dept.nombre}
                    onChange={(e) => updateDeptNombre(dept.id, e.target.value)}
                    placeholder="Nombre del departamento"
                    className="h-7 text-xs font-semibold"
                  />
                  <button
                    onClick={() => removeDept(dept.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5 divide-y divide-border">
                  {dept.rocas.length === 0 && (
                    <p className="py-2 text-center text-xs italic text-muted-foreground">Sin rocas.</p>
                  )}
                  {dept.rocas.map((r) => (
                    <RocaRow
                      key={r.id}
                      roca={r}
                      onUpdate={(id, patch) => updateDeptRoca(dept.id, id, patch)}
                      onRemove={(id) => removeDeptRoca(dept.id, id)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => addDeptRoca(dept.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors print:hidden"
                >
                  <Plus className="h-3 w-3" /> Añadir roca
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
