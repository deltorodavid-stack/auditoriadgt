import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botón visible solo fuera de impresión */
export function PrintButton({ className = "" }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className={`print:hidden ${className}`}
    >
      <Printer className="mr-1.5 h-4 w-4" />
      Imprimir / PDF
    </Button>
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
