import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  SectionTitle,
  FieldHint,
  type NoClientProps,
} from "./shared";

interface Departamento {
  id: string;
  nombre: string;
  lider: string;
  roles: string[];
}

interface Data {
  visionario_nombre: string;
  visionario_responsabilidades: string;
  integrador_nombre: string;
  integrador_responsabilidades: string;
  departamentos: Departamento[];
}

const DEFAULT: Data = {
  visionario_nombre: "",
  visionario_responsabilidades: "",
  integrador_nombre: "",
  integrador_responsabilidades: "",
  departamentos: [],
};

export function Organigrama({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "organigrama",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const set = (patch: Partial<Data>) => setData({ ...data, ...patch });

  const addDept = () =>
    setData({
      ...data,
      departamentos: [
        ...data.departamentos,
        { id: crypto.randomUUID(), nombre: "", lider: "", roles: [] },
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

  const addRole = (id: string) => {
    const dept = data.departamentos.find((d) => d.id === id);
    if (!dept) return;
    updateDept(id, { roles: [...dept.roles, ""] });
  };

  const updateRole = (deptId: string, i: number, val: string) => {
    const dept = data.departamentos.find((d) => d.id === deptId);
    if (!dept) return;
    const roles = [...dept.roles];
    roles[i] = val;
    updateDept(deptId, { roles });
  };

  const removeRole = (deptId: string, i: number) => {
    const dept = data.departamentos.find((d) => d.id === deptId);
    if (!dept) return;
    updateDept(deptId, { roles: dept.roles.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-display font-bold">Organigrama</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
        </div>
      </div>

      <FieldHint>
        Solo una persona por función. Diseña la estructura que necesita la empresa, no la que tiene ahora.
      </FieldHint>

      <div className="mt-6 space-y-4">
        {/* Visionario */}
        <div className="rounded-lg border border-primary/30 bg-card p-5">
          <SectionTitle>Visionario</SectionTitle>
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input
                className="mt-1"
                value={data.visionario_nombre}
                onChange={(e) => set({ visionario_nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label className="text-xs">Responsabilidades</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.visionario_responsabilidades}
                onChange={(e) => set({ visionario_responsabilidades: e.target.value })}
                placeholder="Visión, innovación, cultura, relaciones clave…"
              />
            </div>
          </div>
        </div>

        {/* Integrador */}
        <div className="rounded-lg border border-primary/30 bg-card p-5">
          <SectionTitle>Integrador</SectionTitle>
          <div className="mt-3 space-y-3">
            <div>
              <Label className="text-xs">Nombre</Label>
              <Input
                className="mt-1"
                value={data.integrador_nombre}
                onChange={(e) => set({ integrador_nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label className="text-xs">Responsabilidades</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.integrador_responsabilidades}
                onChange={(e) => set({ integrador_responsabilidades: e.target.value })}
                placeholder="Ejecución, coordinación, P&L, resolución de conflictos…"
              />
            </div>
          </div>
        </div>

        {/* Departamentos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Departamentos</h2>
            <Button size="sm" variant="outline" onClick={addDept}>
              <Plus className="h-4 w-4 mr-1.5" /> Departamento
            </Button>
          </div>

          {data.departamentos.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Añade departamentos para completar el organigrama.
            </p>
          )}

          <div className="space-y-3">
            {data.departamentos.map((dept) => (
              <div key={dept.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Nombre del departamento</Label>
                        <Input
                          className="mt-1"
                          value={dept.nombre}
                          onChange={(e) => updateDept(dept.id, { nombre: e.target.value })}
                          placeholder="Ej: Ventas"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Responsable (LDR)</Label>
                        <Input
                          className="mt-1"
                          value={dept.lider}
                          onChange={(e) => updateDept(dept.id, { lider: e.target.value })}
                          placeholder="Nombre"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Roles dentro del departamento</Label>
                      <div className="mt-2 space-y-1.5">
                        {dept.roles.map((role, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={role}
                              onChange={(e) => updateRole(dept.id, i, e.target.value)}
                              placeholder={`Rol ${i + 1}`}
                              className="h-8 text-sm"
                            />
                            <button onClick={() => removeRole(dept.id, i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addRole(dept.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Añadir rol
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeDept(dept.id)}
                    className="mt-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
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
