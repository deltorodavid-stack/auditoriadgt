import { Loader2 } from "lucide-react";

export interface NoClientProps {
  clienteId: string | null;
  clienteNombre: string;
}

export function NoClientSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-muted-foreground">
        Selecciona un cliente en el menú lateral para trabajar con esta plantilla.
      </p>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SavingIndicator({ saving }: { saving: boolean }) {
  if (!saving) return null;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Guardando…
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-display font-semibold text-foreground">
      {children}
    </h2>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}
