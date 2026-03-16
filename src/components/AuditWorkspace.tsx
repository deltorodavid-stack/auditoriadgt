import { useAudit } from "@/contexts/AuditContext";
import { AuditSidebar } from "./AuditSidebar";
import { AUDIT_BLOCKS } from "@/data/auditQuestions";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function QualityHint({ value }: { value: string }) {
  if (!value || value.length === 0 || value.length >= 30) return null;
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      David recomienda razonar más la respuesta para obtener mejores resultados.
    </p>
  );
}

export function AuditWorkspace() {
  const { currentBlock, setCurrentBlock, answers, saveAnswer, markBlockComplete, usuario } = useAudit();

  const block = AUDIT_BLOCKS.find((b) => b.number === currentBlock);
  if (!block) return null;

  const progressPercent = (currentBlock / 10) * 100;

  const goNext = () => {
    markBlockComplete(currentBlock);
    if (currentBlock < 10) setCurrentBlock(currentBlock + 1);
  };

  const goPrev = () => {
    if (currentBlock > 1) setCurrentBlock(currentBlock - 1);
  };

  const handleFinalize = async () => {
    markBlockComplete(currentBlock);
    if (usuario) {
      await supabase
        .from("usuarios_cliente")
        .update({ finalizado: true, ultimo_bloque_completado: 10 })
        .eq("id", usuario.id);
    }
    toast({ title: "¡Auditoría finalizada!", description: "Gracias por completar La Receta." });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AuditSidebar />
      <main className="ml-64 flex-1">
        {/* Header with logo + progress */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-8 py-4">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Paso {currentBlock} de 10</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-8 py-12">
          <div className="animate-fade-in" key={currentBlock}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Bloque {currentBlock} de 10
            </p>
            <h1 className="mt-2 text-2xl font-display font-bold text-foreground">
              {block.title}
            </h1>
            <div className="mt-2 h-px w-16 bg-primary" />

            {/* Questions */}
            <div className="mt-10 space-y-8">
              {block.questions.map((q) => (
                <div key={q.id} className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <label htmlFor={q.id} className="mb-3 block text-sm font-medium text-foreground">
                    {q.label}
                  </label>

                  {q.type === "slider" ? (
                    <div className="space-y-3">
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[parseInt(answers[q.id] || "5")]}
                        onValueChange={(v) => saveAnswer(q.id, String(v[0]))}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span className="text-sm font-semibold text-primary">
                          {answers[q.id] || "5"}
                        </span>
                        <span>10</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        id={q.id}
                        placeholder={q.type === "free" ? "Escribe libremente aquí..." : "Tu respuesta..."}
                        value={answers[q.id] || ""}
                        onChange={(e) => saveAnswer(q.id, e.target.value)}
                        className="min-h-[100px] resize-y bg-background"
                      />
                      {q.type === "textarea" && <QualityHint value={answers[q.id] || ""} />}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentBlock === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentBlock < 10 ? (
                <Button onClick={goNext} className="gap-2">
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinalize} className="gap-2 bg-primary px-8 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar Auditoría
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
