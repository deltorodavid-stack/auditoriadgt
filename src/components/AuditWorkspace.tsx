import { useAudit } from "@/contexts/AuditContext";
import { AuditSidebar } from "./AuditSidebar";

const BLOCK_TITLES = [
  "",
  "Visión y Propósito",
  "Propuesta de Valor",
  "Cliente Ideal",
  "Modelo de Negocio",
  "Estrategia Comercial",
  "Marketing y Marca",
  "Operaciones",
  "Equipo y Cultura",
  "Finanzas",
  "Plan de Acción",
];

export function AuditWorkspace() {
  const { currentBlock } = useAudit();

  return (
    <div className="flex min-h-screen bg-background">
      <AuditSidebar />
      <main className="ml-64 flex-1">
        <div className="mx-auto max-w-3xl px-8 py-12">
          <div className="animate-fade-in">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Bloque {currentBlock} de 10
            </p>
            <h1 className="mt-2 text-2xl font-display font-bold text-foreground">
              {BLOCK_TITLES[currentBlock]}
            </h1>
            <div className="mt-2 h-px w-16 bg-primary" />

            {/* Questions placeholder */}
            <div className="mt-10 rounded-lg border border-border bg-card p-8">
              <p className="text-muted-foreground text-sm">
                Las preguntas de este bloque se cargarán próximamente. Comparte las preguntas del
                Bloque {currentBlock} para implementarlas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
