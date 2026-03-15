import { Link2Off } from "lucide-react";

interface AccessDeniedProps {
  message: string;
}

export function AccessDenied({ message }: AccessDeniedProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-fade-in text-center max-w-md px-6">
        <Link2Off className="mx-auto mb-6 h-14 w-14 text-muted-foreground opacity-60" />
        <h1 className="mb-3 text-xl font-display font-bold text-foreground">
          Enlace requerido
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
