import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Save, Eye, CalendarDays, Table2 } from "lucide-react";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator, type NoClientProps,
} from "@/components/eos/templates/shared";
import { MESES } from "./lib";
import { useCuadroMando } from "./useCuadroMando";
import { CuadroMandoMensual } from "./CuadroMandoMensual";
import { CuadroMandoAnual } from "./CuadroMandoAnual";
import { CuadroMandoDoc } from "./CuadroMandoDoc";

type Vista = "mensual" | "anual";

export function CuadroMando({ clienteId, clienteNombre }: NoClientProps) {
  const now = new Date();
  const [vista, setVista] = useState<Vista>("mensual");
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [docOpen, setDocOpen] = useState(false);

  const { data, umbral, setData, setUmbral, saveNow, saving, loading, inherited } =
    useCuadroMando(clienteId, mes, anio);

  if (!clienteId) return <NoClientSelected />;

  // Vista documento (pantalla limpia)
  if (docOpen) {
    return (
      <CuadroMandoDoc
        data={data} umbral={umbral} clienteNombre={clienteNombre}
        mes={mes} anio={anio} onClose={() => setDocOpen(false)}
      />
    );
  }

  const anios = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 4 + i);

  return (
    <div className="max-w-full">
      {/* Cabecera */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold">Cuadro de Mando</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SavingIndicator saving={saving} />

          {/* Conmutador de vista */}
          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              onClick={() => setVista("mensual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${vista === "mensual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Mensual
            </button>
            <button
              onClick={() => setVista("anual")}
              className={`flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs transition-colors ${vista === "anual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Table2 className="h-3.5 w-3.5" /> Anual
            </button>
          </div>

          {vista === "mensual" && (
            <>
              <Button size="sm" variant="outline" onClick={() => setDocOpen(true)}>
                <Eye className="h-4 w-4 mr-1.5" /> Ver documento
              </Button>
              <Button size="sm" variant="outline" onClick={saveNow} disabled={saving}>
                <Save className="h-4 w-4 mr-1.5" /> Guardar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Selectores de periodo */}
      <div className="mb-5 flex items-center gap-2">
        {vista === "mensual" && (
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {anios.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        {vista === "mensual" && inherited && (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
            Heredado del mes anterior — modifica algo para crear este mes
          </span>
        )}
      </div>

      {/* Contenido */}
      {vista === "mensual" ? (
        loading ? <LoadingSpinner /> : (
          <CuadroMandoMensual
            data={data} umbral={umbral}
            onDataChange={setData} onUmbralChange={setUmbral}
          />
        )
      ) : (
        <CuadroMandoAnual
          clienteId={clienteId} anio={anio}
          onSelectMonth={(m) => { setMes(m); setVista("mensual"); }}
        />
      )}
    </div>
  );
}
