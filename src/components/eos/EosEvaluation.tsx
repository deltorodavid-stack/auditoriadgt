import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, RotateCcw, Plus, ChevronLeft, Printer } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import { toast } from "sonner";

// ── Preguntas y secciones ──────────────────────────────────────────────────────
const PREGUNTAS = [
  "¿Tenemos visión clara por escrito comunicada y compartida con todos?",
  "¿Los valores medulares están claros y los usamos para contratar, evaluar y despedir?",
  "¿El enfoque medular es claro y todo está alineado a él?",
  "¿La meta a 10 años es clara y compartida por todos?",
  "¿El mercado objetivo es claro y toda la estrategia va enfocada a él?",
  "¿Las 3 habilidades únicas son claras y se comunican?",
  "¿Tenemos un proceso comprobado nombrado, ilustrado y usado por todos?",
  "¿Todas las personas de la organización son las «personas correctas»?",
  "¿El organigrama de responsabilidades es claro, completo y actualizado?",
  "¿Todos están en el «asiento correcto» (Comprenden, Desean, tienen Capacidad)?",
  "¿El equipo directivo es abierto, honesto y demuestra alto nivel de confianza?",
  "¿Todos tienen Rocas (1-7 prioridades trimestrales) y están enfocados en ellas?",
  "¿Todos participan en un ritmo de reuniones regular (semanal, trimestral, anual)?",
  "¿Todas las reuniones son el mismo día y hora, con agenda fija, empiezan y terminan a tiempo?",
  "¿Los equipos identifican, debaten y resuelven claramente los problemas?",
  "¿Los procesos principales están documentados, simplificados y son seguidos por todos?",
  "¿Hay sistemas para recibir retroalimentación regular de clientes y empleados?",
  "¿Existe un cuadro de mando con métricas semanales?",
  "¿Todos tienen al menos un número del que son responsables cada semana?",
  "¿Tienen presupuesto y lo monitorizan regularmente?",
];

const SECCIONES = [
  { label: "Visión", from: 0, to: 6 },
  { label: "Personas", from: 7, to: 10 },
  { label: "Datos", from: 11, to: 14 },
  { label: "Tracción", from: 15, to: 19 },
];

type Respuestas = Record<number, number>;

interface EvaluacionRow {
  id: string;
  respuestas: Respuestas;
  puntuacion: number | null;
  created_at: string;
}

function scoreLabel(score: number) {
  if (score >= 80) return { label: "Excelente", color: "bg-emerald-500" };
  if (score >= 60) return { label: "Bueno", color: "bg-yellow-500" };
  if (score >= 40) return { label: "Regular", color: "bg-orange-500" };
  return { label: "Crítico", color: "bg-red-500" };
}

function calcPuntuacion(resp: Respuestas): number {
  const vals = Object.values(resp);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (PREGUNTAS.length * 5)) * 100);
}

interface Props { clienteId: string | null; clienteNombre: string }

export function EosEvaluation({ clienteId, clienteNombre }: Props) {
  const [historial, setHistorial] = useState<EvaluacionRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [saving, setSaving] = useState(false);

  // Cargar historial
  useEffect(() => {
    if (!clienteId) { setHistorial([]); return; }
    setLoadingList(true);
    supabase
      .from("evaluaciones_eos")
      .select("id, respuestas, puntuacion, created_at")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHistorial((data || []).map((r) => ({ ...r, respuestas: (r.respuestas as Respuestas) || {} })));
        setLoadingList(false);
      });
  }, [clienteId]);

  const openNew = () => { setRespuestas({}); setEditingId(null); setView("form"); };

  const openExisting = (ev: EvaluacionRow) => { setRespuestas(ev.respuestas); setEditingId(ev.id); setView("form"); };

  const handleSave = async () => {
    if (!clienteId) return;
    setSaving(true);
    const puntuacion = calcPuntuacion(respuestas);

    if (editingId) {
      // Actualizar evaluación existente
      const { error } = await supabase
        .from("evaluaciones_eos")
        .update({ respuestas: respuestas as Record<string, unknown>, puntuacion })
        .eq("id", editingId);
      if (error) { toast.error("Error al guardar"); }
      else {
        toast.success("Evaluación actualizada");
        setHistorial((h) => h.map((e) => e.id === editingId ? { ...e, respuestas, puntuacion } : e));
      }
    } else {
      // Nueva evaluación
      const { data, error } = await supabase
        .from("evaluaciones_eos")
        .insert({ cliente_id: clienteId, respuestas: respuestas as Record<string, unknown>, puntuacion })
        .select("id, respuestas, puntuacion, created_at")
        .single();
      if (error) { toast.error("Error al guardar"); }
      else if (data) {
        toast.success("Evaluación guardada");
        const newRow: EvaluacionRow = { ...data, respuestas: (data.respuestas as Respuestas) || {} };
        setHistorial((h) => [newRow, ...h]);
        setEditingId(data.id);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("evaluaciones_eos").delete().eq("id", id);
    setHistorial((h) => h.filter((e) => e.id !== id));
  };

  if (!clienteId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">Selecciona un cliente para ver su evaluación EOS.</p>
      </div>
    );
  }

  // ── Vista: lista de evaluaciones ────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold">Evaluación Organizacional EOS</h1>
            <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Nueva evaluación
          </Button>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : historial.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No hay evaluaciones. Pulsa «Nueva evaluación» para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historial.map((ev) => {
              const p = ev.puntuacion ?? 0;
              const { label, color } = scoreLabel(p);
              return (
                <div key={ev.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(ev.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={p} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{p}/100</span>
                        <Badge className={`${color} text-white text-xs hover:opacity-90`}>{label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openExisting(ev)}>Ver / Editar</Button>
                    <button onClick={() => handleDelete(ev.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Vista: formulario ───────────────────────────────────────────────────────
  const puntuacion = calcPuntuacion(respuestas);
  const answered = Object.keys(respuestas).length;
  const { label: scoreText, color: scoreColor } = scoreLabel(puntuacion);

  return (
    <div className="max-w-3xl">
      <PrintHeader title="Evaluación Organizacional EOS" subtitle={clienteNombre} />

      <div className="flex items-start justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold">
              {editingId ? "Editar evaluación" : "Nueva evaluación"}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{clienteNombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <PrintButton />
          <Button variant="ghost" size="sm" onClick={() => { setRespuestas({}); }}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reiniciar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || answered < PREGUNTAS.length}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
        </div>
      </div>

      {/* Puntuación */}
      {answered > 0 && (
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Puntuación actual</span>
            <div className="flex items-center gap-2">
              <Badge className={`${scoreColor} text-white hover:opacity-90`}>{scoreText}</Badge>
              <span className="text-2xl font-display font-bold text-foreground">{puntuacion}/100</span>
            </div>
          </div>
          <Progress value={puntuacion} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{answered} de {PREGUNTAS.length} preguntas respondidas</p>
        </div>
      )}

      {/* Preguntas */}
      <div className="space-y-8">
        {SECCIONES.map((sec) => (
          <div key={sec.label}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{sec.label}</h2>
            <div className="space-y-3">
              {PREGUNTAS.slice(sec.from, sec.to + 1).map((pregunta, relIdx) => {
                const idx = sec.from + relIdx;
                const valor = respuestas[idx];
                return (
                  <div key={idx} className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      <span className="mr-2 text-xs text-muted-foreground">{idx + 1}.</span>
                      {pregunta}
                    </p>
                    <div className="flex gap-2 print:hidden">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          onClick={() => setRespuestas((prev) => ({ ...prev, [idx]: v }))}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-all ${valor === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                        >
                          {v}
                        </button>
                      ))}
                      {valor !== undefined && (
                        <span className="ml-2 flex items-center text-xs text-muted-foreground">
                          {["", "Muy bajo", "Bajo", "Regular", "Bueno", "Excelente"][valor]}
                        </span>
                      )}
                    </div>
                    {valor !== undefined && (
                      <p className="hidden text-sm print:block"><strong>{valor}/5</strong> — {["", "Muy bajo", "Bajo", "Regular", "Bueno", "Excelente"][valor]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {answered === PREGUNTAS.length && (
        <div className="mt-8 flex justify-end print:hidden">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Guardar evaluación
          </Button>
        </div>
      )}
    </div>
  );
}
