import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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
  { label: "Datos", from: 11, to: 14 },  // renamed: Tracción in EOS = Datos aquí
  { label: "Tracción", from: 15, to: 19 },
];

type Respuestas = Record<number, number>;

function scoreLabel(score: number) {
  if (score >= 80) return { label: "Excelente", color: "bg-emerald-500" };
  if (score >= 60) return { label: "Bueno", color: "bg-yellow-500" };
  if (score >= 40) return { label: "Regular", color: "bg-orange-500" };
  return { label: "Crítico", color: "bg-red-500" };
}

interface Props {
  clienteId: string | null;
  clienteNombre: string;
}

export function EosEvaluation({ clienteId, clienteNombre }: Props) {
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!clienteId) {
      setRespuestas({});
      return;
    }
    setLoading(true);
    supabase
      .from("evaluaciones_eos")
      .select("respuestas, puntuacion")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.respuestas) {
          setRespuestas(data.respuestas as Respuestas);
        } else {
          setRespuestas({});
        }
        setLoading(false);
      });
  }, [clienteId]);

  const setScore = (idx: number, val: number) => {
    setRespuestas((prev) => ({ ...prev, [idx]: val }));
    setSaved(false);
  };

  const answered = Object.keys(respuestas).length;
  const total = PREGUNTAS.length;
  const puntuacion = answered === 0
    ? 0
    : Math.round(
        (Object.values(respuestas).reduce((a, b) => a + b, 0) / (total * 5)) * 100
      );

  const { label: scoreText, color: scoreColor } = scoreLabel(puntuacion);

  const handleSave = async () => {
    if (!clienteId) return;
    setSaving(true);
    const { error } = await supabase.from("evaluaciones_eos").insert({
      cliente_id: clienteId,
      respuestas: respuestas as Record<string, unknown>,
      puntuacion,
    });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("Evaluación guardada correctamente");
      setSaved(true);
    }
  };

  const handleReset = () => {
    setRespuestas({});
    setSaved(false);
  };

  if (!clienteId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">
          Selecciona un cliente en el menú lateral para ver su evaluación EOS.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">
            Evaluación Organizacional EOS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reiniciar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || answered < total}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Guardar
          </Button>
        </div>
      </div>

      {/* Score summary */}
      {answered > 0 && (
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">
              Puntuación actual
            </span>
            <div className="flex items-center gap-2">
              <Badge
                className={`${scoreColor} text-white hover:opacity-90`}
              >
                {scoreText}
              </Badge>
              <span className="text-2xl font-display font-bold text-foreground">
                {puntuacion}/100
              </span>
            </div>
          </div>
          <Progress value={puntuacion} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {answered} de {total} preguntas respondidas
          </p>
        </div>
      )}

      {/* Questions by section */}
      <div className="space-y-8">
        {SECCIONES.map((sec) => (
          <div key={sec.label}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {sec.label}
            </h2>
            <div className="space-y-3">
              {PREGUNTAS.slice(sec.from, sec.to + 1).map((pregunta, relIdx) => {
                const idx = sec.from + relIdx;
                const valor = respuestas[idx];
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="mb-3 text-sm font-medium text-foreground">
                      <span className="mr-2 text-xs text-muted-foreground">
                        {idx + 1}.
                      </span>
                      {pregunta}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          onClick={() => setScore(idx, v)}
                          className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-all ${
                            valor === v
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                      <span className="ml-2 flex items-center text-xs text-muted-foreground">
                        {valor === 1 && "Muy bajo"}
                        {valor === 2 && "Bajo"}
                        {valor === 3 && "Regular"}
                        {valor === 4 && "Bueno"}
                        {valor === 5 && "Excelente"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom save */}
      {answered === total && !saved && (
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Guardar evaluación
          </Button>
        </div>
      )}
    </div>
  );
}
