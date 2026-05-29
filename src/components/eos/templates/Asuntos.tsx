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

interface Departamento {
  id: string;
  nombre: string;
  items: string[];
}

interface Data {
  vision: string[];
  semanales: string[];
  departamentos: Departamento[];
}

const DEFAULT: Data = { vision: [], semanales: [], departamentos: [] };

// ─── ListColumn definida FUERA del componente Asuntos para evitar re-mount ───
// Si se define dentro, cada render crea un nuevo tipo de componente y React
// desmonta/monta los inputs, perdiendo el foco al escribir.
interface ListColProps {
  title: string;
  hint: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (i: number, v: string) => void;
  onRemove: (i: number) => void;
}

function ListColumn({ title, hint, items, onAdd, onUpdate, onRemove }: ListColProps) {
  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-display font-semibold text-foreground">{title}</h2>
        <button onClick={onAdd} className="text-primary hover:text-primary/80 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <FieldHint>{hint}</FieldHint>
      <div className="mt-3 flex-1 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => onUpdate(i, e.target.value)}
              placeholder="Asunto…"
              className="h-8 text-sm"
            />
            <button
              onClick={() => onRemove(i)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs italic text-muted-foreground">Sin asuntos.</p>
        )}
      </div>
    </div>
  );
}

export function Asuntos({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "asuntos",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  // ── Lista simple (visión / semanales) ──────────────────────────────────────
  const addToList = (key: "vision" | "semanales") =>
    setData({ ...data, [key]: [...data[key], ""] });

  const updateList = (key: "vision" | "semanales", i: number, val: string) => {
    const list = [...data[key]];
    list[i] = val;
    setData({ ...data, [key]: list });
  };

  const removeFromList = (key: "vision" | "semanales", i: number) =>
    setData({ ...data, [key]: data[key].filter((_, idx) => idx !== i) });

  // ── Departamentos ──────────────────────────────────────────────────────────
  const addDept = () =>
    setData({
      ...data,
      departamentos: [
        ...data.departamentos,
        { id: `dept-${Date.now()}`, nombre: "", items: [] },
      ],
    });

  const updateDept = (id: string, patch: Partial<Departamento>) =>
    setData({
      ...data,
      departamentos: data.departamentos.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    });

  const removeDept = (id: string) =>
    setData({ ...data, departamentos: data.departamentos.filter((d) => d.id !== id) });

  const addDeptItem = (id: string) => {
    const dept = data.departamentos.find((d) => d.id === id);
    if (!dept) return;
    updateDept(id, { items: [...dept.items, ""] });
  };

  const updateDeptItem = (deptId: string, i: number, val: string) => {
    const dept = data.departamentos.find((d) => d.id === deptId);
    if (!dept) return;
    const items = [...dept.items];
    items[i] = val;
    updateDept(deptId, { items });
  };

  const removeDeptItem = (deptId: string, i: number) => {
    const dept = data.departamentos.find((d) => d.id === deptId);
    if (!dept) return;
    updateDept(deptId, { items: dept.items.filter((_, idx) => idx !== i) });
  };

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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna 1 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <ListColumn
            title="Asuntos Visión"
            hint="Problemas estratégicos del largo plazo que afectan a la visión"
            items={data.vision}
            onAdd={() => addToList("vision")}
            onUpdate={(i, v) => updateList("vision", i, v)}
            onRemove={(i) => removeFromList("vision", i)}
          />
        </div>

        {/* Columna 2 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <ListColumn
            title="Asuntos Semanales"
            hint="Asuntos que se tratarán en la próxima reunión semanal"
            items={data.semanales}
            onAdd={() => addToList("semanales")}
            onUpdate={(i, v) => updateList("semanales", i, v)}
            onRemove={(i) => removeFromList("semanales", i)}
          />
        </div>

        {/* Columna 3: Departamentos */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-display font-semibold">Asuntos Departamentos</h2>
            <button
              onClick={addDept}
              className="text-primary hover:text-primary/80 transition-colors print:hidden"
              title="Añadir departamento"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <FieldHint>Asuntos específicos por departamento o área</FieldHint>

          <div className="mt-3 space-y-4">
            {data.departamentos.length === 0 && (
              <p className="text-xs italic text-muted-foreground">
                Pulsa el icono + para crear un departamento.
              </p>
            )}
            {data.departamentos.map((dept) => (
              <div key={dept.id} className="rounded border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={dept.nombre}
                    onChange={(e) => updateDept(dept.id, { nombre: e.target.value })}
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
                <div className="space-y-1.5">
                  {dept.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateDeptItem(dept.id, i, e.target.value)}
                        placeholder="Asunto…"
                        className="h-7 text-xs"
                      />
                      <button
                        onClick={() => removeDeptItem(dept.id, i)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors print:hidden"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addDeptItem(dept.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors print:hidden"
                  >
                    <Plus className="h-3 w-3" /> Añadir asunto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
