import { Check } from "lucide-react";
import { useAudit } from "@/contexts/AuditContext";
import { AUDIT_BLOCKS } from "@/data/auditQuestions";

export function AuditSidebar() {
  const { currentBlock, setCurrentBlock, completedBlocks } = useAudit();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="border-b border-border px-6 py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
          Auditoría Estratégica
        </p>
        <h2 className="mt-1 font-display text-lg font-bold text-foreground">La Receta</h2>
      </div>

      {/* Steps */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="space-y-1">
          {AUDIT_BLOCKS.map((block) => {
            const isActive = currentBlock === block.number;
            const isCompleted = completedBlocks.has(block.number);

            return (
              <li key={block.number}>
                <button
                  onClick={() => setCurrentBlock(block.number)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
                    isActive
                      ? "bg-sidebar-accent text-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : block.number}
                  </span>
                  <span className="truncate">{block.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Progress */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progreso</span>
          <span>{completedBlocks.size}/10</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(completedBlocks.size / 10) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
