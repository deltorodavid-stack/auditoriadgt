import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Save, Trash2 } from "lucide-react";
import {
  NoClientSelected,
  LoadingSpinner,
  SavingIndicator,
  SectionTitle,
  FieldHint,
  type NoClientProps,
} from "./shared";

interface Reunion {
  id: string;
  fecha: string;
  participantes: string;
  duracion: string;
  transicion: string;
  revision_trimestre: string;
  revision_vto: string;
  lista_asuntos: string;
  rocas_proximo: string;
  ids: string;
  conclusion: string;
  valoracion: number | null;
}

interface Data {
  reuniones: Reunion[];
}

const DEFAULT: Data = { reuniones: [] };

const CAMPOS: { key: keyof Reunion; label: string; hint: string }[] = [
  { key: "transicion", label: "Transición", hint: "Mejor/peor noticia personal y de negocio" },
  {
    key: "revision_trimestre",
    label: "Revisión del Trimestre Anterior",
    hint: "Revisar ingresos, KPIs y estado de las Rocas del trimestre que acaba",
  },
  { key: "revision_vto", label: "Revisión del V/TO", hint: "¿Seguimos alineados con la visión?" },
  { key: "lista_asuntos", label: "Lista de Asuntos", hint: "Volcar todos los asuntos acumulados" },
  {
    key: "rocas_proximo",
    label: "Fijar Rocas del Próximo Trimestre",
    hint: "1-7 Rocas por persona para el próximo trimestre",
  },
  { key: "ids", label: "IDS Asuntos Clave", hint: "Identificar, Debatir, Solucionar los asuntos más importantes" },
  { key: "conclusion", label: "Conclusión", hint: "Repasar tareas nuevas, comunicar, valorar reunión del 1 al 10" },
];

function newReunion(): Reunion {
  return {
    id: crypto.randomUUID(),
    fecha: new Date().toISOString().split("T")[0],
    participantes: "",
    duracion: "",
    transicion: "",
    revision_trimestre: "",
    revision_vto: "",
    lista_asuntos: "",
    rocas_proximo: "",
    ids: "",
    conclusion: "",
    valoracion: null,
  };
}

export function ReunionTrimestral({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<Data>(
    clienteId,
    "reunion_trimestral",
    DEFAULT
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const addReunion = () => {
    const r = newReunion();
    setData({ reuniones: [r, ...data.reuniones] });
    setExpandedId(r.id);
  };

  const update = (id: string, patch: Partial<Reunion>) =>
    setData({ reuniones: data.reuniones.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const remove = (id: string) => {
    setData({ reuniones: data.reuniones.filter((r) => r.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">Reunión Trimestral</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
          <Button size="sm" onClick={addReunion}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva reunión
          </Button>
        </div>
      </div>

      {data.reuniones.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No hay reuniones trimestrales registradas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data.reuniones.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <div
                className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">
                    {r.fecha
                      ? new Date(r.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
                      : "Nueva reunión"}
                  </span>
                  {r.valoracion !== null && <Badge variant="secondary">{r.valoracion}/10</Badge>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border px-5 py-5 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs">Fecha</Label>
                      <Input type="date" className="mt-1" value={r.fecha} onChange={(e) => update(r.id, { fecha: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Participantes</Label>
                      <Input className="mt-1" value={r.participantes} onChange={(e) => update(r.id, { participantes: e.target.value })} placeholder="Nombres o nº de asistentes" />
                    </div>
                    <div>
                      <Label className="text-xs">Duración</Label>
                      <Input className="mt-1" value={r.duracion} onChange={(e) => update(r.id, { duracion: e.target.value })} placeholder="Ej: 1 día" />
                    </div>
                  </div>

                  {CAMPOS.map(({ key, label, hint }) => (
                    <div key={key}>
                      <SectionTitle>{label}</SectionTitle>
                      <FieldHint>{hint}</FieldHint>
                      <Textarea
                        className="mt-2 min-h-[80px] bg-background"
                        value={(r[key] as string) || ""}
                        onChange={(e) => update(r.id, { [key]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div>
                    <SectionTitle>Valoración</SectionTitle>
                    <FieldHint>Puntuación del 1 al 10</FieldHint>
                    <div className="mt-2 flex gap-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                        <button
                          key={v}
                          onClick={() => update(r.id, { valoracion: v })}
                          className={`h-9 w-9 rounded-md border text-sm font-semibold transition-all ${
                            r.valoracion === v
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
