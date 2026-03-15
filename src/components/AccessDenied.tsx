import { ShieldX } from "lucide-react";

interface AccessDeniedProps {
  message: string;
}

export function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-fade-in text-center max-w-md px-6">
        <ShieldX className="mx-auto mb-6 h-16 w-16 text-destructive opacity-70" />
        <h1 className="mb-3 text-2xl font-display font-bold text-foreground">
          Acceso Denegado
        </h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
