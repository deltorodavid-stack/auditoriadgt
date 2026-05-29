import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botón visible solo fuera de impresión. Incluye aviso sobre cabeceras del navegador. */
export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-end print:hidden ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="mr-1.5 h-4 w-4" />
        Imprimir / PDF
      </Button>
      <p className="mt-0.5 text-[10px] text-muted-foreground/60 leading-tight text-right">
        En el diálogo de impresión, desactiva «Encabezados y pies»
      </p>
    </div>
  );
}

/** Cabecera que aparece SOLO al imprimir */
export function PrintHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className="print-header mb-6 hidden flex-col items-center border-b border-gray-200 pb-5 text-center"
      aria-hidden="true"
    >
      <img
        src="/images/logo-david-del-toro.png"
        alt="David Del Toro"
        style={{ maxHeight: "56px", width: "auto" }}
      />
      {title && (
        <h1 className="mt-3 text-lg font-bold text-gray-900">{title}</h1>
      )}
      {subtitle && (
        <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}
