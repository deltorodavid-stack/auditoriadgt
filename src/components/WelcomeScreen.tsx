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
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/images/logo-david-del-toro.png"
            alt="David Del Toro - Consultoría Estratégica"
            className="mx-auto h-auto max-w-[250px]"
          />
        </div>

        {/* Branding */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Auditoría Estratégica
          </p>
          <h1 className="text-4xl font-display font-bold text-foreground md:text-5xl">
            La Receta
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-primary" />
        </div>

        {/* Introduction Card */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm md:p-10">
          <h2 className="mb-4 text-lg font-display font-semibold text-foreground">
            Antes de comenzar
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Esta auditoría estratégica está diseñada para profundizar en los pilares fundamentales
              de tu negocio. Consta de <strong className="text-foreground">10 bloques temáticos</strong> que
              abordan desde tu visión y propuesta de valor hasta tu estrategia comercial y operativa.
            </p>
            <p>
              Tómate el tiempo que necesites. Tus respuestas se guardan automáticamente, por lo que
              puedes cerrar la ventana y volver en cualquier momento usando tu enlace personal.
            </p>
            <p>
              La honestidad y la reflexión profunda son esenciales para obtener un diagnóstico
              preciso. No existen respuestas correctas o incorrectas.
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
              Me comprometo a responder con honestidad y dedicar el tiempo necesario para completar
              esta auditoría estratégica de forma reflexiva y completa.
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
