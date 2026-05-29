import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  FieldHint,
  type NoClientProps,
} from "./shared";

type CellValue = "✓" | "△" | "✗" | "";

interface Persona {
  id: string;
  nombre: string;
  valores: Record<string, CellValue>;
  cdc_comprende: CellValue;
  cdc_desea: CellValue;
  cdc_capacitado: CellValue;
}

interface Data {
  columnas_valores: string[];
  personas: Persona[];
}

const DEFAULT_COLS = [
  "Seguro de sí mismo",
  "Crecer o morir",
  "Ayudar primero",
  "Hacer lo correcto",
  "Hacer lo que dices",
];

const DEFAULT: Data = {
  columnas_valores: DEFAULT_COLS,
  personas: [],
};

const OPTIONS: CellValue[] = ["✓", "△", "✗"];

function CellSelect({
  value,
  onChange,
}: {
  value: CellValue;
  onChange: (v: CellValue) => void;
}) {
  return (
    <div className="flex gap-1 justify-center">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt === value ? "" : opt)}
          className={`h-7 w-7 rounded text-sm transition-all border ${
            value === opt
              ? opt === "✓"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : opt === "△"
                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                : "border-red-400 bg-red-50 text-red-700"
              : "border-border bg-background text-muted-foreground hover:border-primary/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function AnalizadorPersonas({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "personas",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addPersona = () => {
    const valores: Record<string, CellValue> = {};
    data.columnas_valores.forEach((col) => (valores[col] = ""));
    setData({
      ...data,
      personas: [
        ...data.personas,
        {
          id: crypto.randomUUID(),
          nombre: "",
          valores,
          cdc_comprende: "",
          cdc_desea: "",
          cdc_capacitado: "",
        },
      ],
    });
  };

  const removePersona = (id: string) =>
    setData({ ...data, personas: data.personas.filter((p) => p.id !== id) });

  const updatePersona = (id: string, patch: Partial<Persona>) =>
    setData({
      ...data,
      personas: data.personas.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });

  const setValorCell = (personaId: string, col: string, val: CellValue) => {
    const persona = data.personas.find((p) => p.id === personaId);
    if (!persona) return;
    updatePersona(personaId, {
      valores: { ...persona.valores, [col]: val },
    });
  };

  const addColVal = () => {
    const name = `Valor ${data.columnas_valores.length + 1}`;
    const personas = data.personas.map((p) => ({
      ...p,
      valores: { ...p.valores, [name]: "" as CellValue },
    }));
    setData({ ...data, columnas_valores: [...data.columnas_valores, name], personas });
  };

  const renameCol = (i: number, newName: string) => {
    const oldName = data.columnas_valores[i];
    const cols = [...data.columnas_valores];
    cols[i] = newName;
    const personas = data.personas.map((p) => {
      const valores = { ...p.valores };
      valores[newName] = valores[oldName] ?? "";
      delete valores[oldName];
      return { ...p, valores };
    });
    setData({ ...data, columnas_valores: cols, personas });
  };

  const removeCol = (i: number) => {
    const col = data.columnas_valores[i];
    const cols = data.columnas_valores.filter((_, idx) => idx !== i);
    const personas = data.personas.map((p) => {
      const valores = { ...p.valores };
      delete valores[col];
      return { ...p, valores };
    });
    setData({ ...data, columnas_valores: cols, personas });
  };

  return (
    <div className="max-w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold">Analizador de Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={addColVal}>
            <Plus className="h-4 w-4 mr-1.5" /> Valor
          </Button>
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={addPersona}>
            <Plus className="h-4 w-4 mr-1.5" /> Persona
          </Button>
        </div>
      </div>

      <FieldHint>
        Evalúa si cada persona comparte los valores medulares de la empresa y si está en el puesto correcto
        (CDC: Comprende el rol, lo Desea, tiene Capacidad)
      </FieldHint>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-40 border-b border-border px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Persona
              </th>
              {data.columnas_valores.map((col, i) => (
                <th
                  key={i}
                  className="border-b border-l border-border px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Input
                      value={col}
                      onChange={(e) => renameCol(i, e.target.value)}
                      className="h-6 min-w-[80px] border-0 bg-transparent px-0 text-center text-xs font-medium focus-visible:ring-0"
                    />
                    <button
                      onClick={() => removeCol(i)}
                      className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">
                Comprende
              </th>
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">
                Desea
              </th>
              <th className="border-b border-l border-border px-2 py-2 text-center text-xs font-semibold text-primary">
                Capacitado
              </th>
              <th className="w-8 border-b border-border" />
            </tr>
          </thead>
          <tbody>
            {data.personas.length === 0 && (
              <tr>
                <td
                  colSpan={data.columnas_valores.length + 4}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Pulsa «Persona» para añadir la primera fila.
                </td>
              </tr>
            )}
            {data.personas.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2">
                  <Input
                    value={p.nombre}
                    onChange={(e) => updatePersona(p.id, { nombre: e.target.value })}
                    placeholder="Nombre"
                    className="h-8 text-sm"
                  />
                </td>
                {data.columnas_valores.map((col, i) => (
                  <td key={i} className="border-l border-border px-2 py-2">
                    <CellSelect
                      value={p.valores[col] ?? ""}
                      onChange={(v) => setValorCell(p.id, col, v)}
                    />
                  </td>
                ))}
                <td className="border-l border-border px-2 py-2">
                  <CellSelect
                    value={p.cdc_comprende}
                    onChange={(v) => updatePersona(p.id, { cdc_comprende: v })}
                  />
                </td>
                <td className="border-l border-border px-2 py-2">
                  <CellSelect
                    value={p.cdc_desea}
                    onChange={(v) => updatePersona(p.id, { cdc_desea: v })}
                  />
                </td>
                <td className="border-l border-border px-2 py-2">
                  <CellSelect
                    value={p.cdc_capacitado}
                    onChange={(v) => updatePersona(p.id, { cdc_capacitado: v })}
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => removePersona(p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
