import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAudit } from "@/contexts/AuditContext";

export function WelcomeScreen() {
  const [accepted, setAccepted] = useState(false);
  const { setStarted, setCurrentBlock } = useAudit();

  const handleStart = () => {
    setStarted(true);
    setCurrentBlock(1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="animate-fade-in w-full max-w-2xl">
        {/* Introduction Card */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm md:p-10">
          <h2 className="mb-6 text-xl font-display font-bold text-foreground uppercase tracking-wide">
            Introducción — Leer urgente antes de rellenar nada
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Es importante que este cuestionario te lo tomes en serio. En caso contrario:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mi trabajo no será tan efectivo como queremos todas las partes.</li>
              <li>Habremos perdido tiempo todos.</li>
              <li>Habrás tirado tu dinero a la basura.</li>
              <li>No sacaremos el máximo rendimiento.</li>
            </ul>
            <p>
              Es importante que contestes y razones todas las preguntas. Usar monosílabos no sirve de nada.
            </p>
            <p>
              Al final de cada bloque, hay una pregunta libre: usa esta pregunta para que rellenes todo lo que se te ocurra y que no te haya preguntado, si no tienes nada que añadir, escribe "nada más que aportar".
            </p>
            <p>
              Si tú no te preocupas en darme información de tu empresa:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>¿Por qué debo preocuparme yo por tu empresa?</li>
              <li>No tendré información para realizar mi trabajo ni sacar el máximo rendimiento.</li>
            </ul>
            <p>
              Dedícate un día de la semana para hacerlo todo de una vez. Debes concentrarte en esto, si lo haces a ratos, no nos servirá de nada. Aíslate y piensa bien todas las preguntas, <strong className="text-foreground">"cuanto más lo trabajes mejor será el resultado conseguido"</strong>.
            </p>
            <p className="font-medium text-foreground">
              Si no le das la importancia que tiene a este cuestionario es mejor que no trabajemos juntos.
            </p>
          </div>

          {/* Commitment Checkbox */}
          <div className="mt-8 flex items-start gap-3 rounded-md border border-border bg-secondary/50 p-4">
            <Checkbox
              id="commitment"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5 border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            <label
              htmlFor="commitment"
              className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
            >
              He leído la introducción y me comprometo a dedicar el tiempo necesario para completar
              esta auditoría de forma reflexiva y completa.
            </label>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button
              onClick={handleStart}
              disabled={!accepted}
              size="lg"
              className="min-w-[200px] font-display font-semibold tracking-wide transition-all duration-200 disabled:opacity-30"
            >
              Empezar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
