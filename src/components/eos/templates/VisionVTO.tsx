import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { PrintButton, PrintHeader } from "@/components/ui/print";
import { NoClientSelected, LoadingSpinner, SavingIndicator, SectionTitle, FieldHint, type NoClientProps } from "./shared";

interface VTO {
  valores: string[];
  enfoque_medular: string;
  meta_10: string;
  panorama_3: string;
  estrategia_mercado_objetivo: string;
  estrategia_cualidades: string;
  estrategia_proceso: string;
  estrategia_garantia: string;
  plan_anio: string;
}

const DEFAULT: VTO = {
  valores: ["", "", "", "", ""],
  enfoque_medular: "",
  meta_10: "",
  panorama_3: "",
  estrategia_mercado_objetivo: "",
  estrategia_cualidades: "",
  estrategia_proceso: "",
  estrategia_garantia: "",
  plan_anio: "",
};

export function VisionVTO({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<VTO>(clienteId, "vision", DEFAULT);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const set = (key: keyof VTO, val: string) => setData({ ...data, [key]: val });
  const setValor = (i: number, val: string) => {
    const v = [...data.valores];
    v[i] = val;
    setData({ ...data, valores: v });
  };

  return (
    <div className="max-w-3xl">
      <PrintHeader title="V/TO — Visión / Tracción Organizer" subtitle={clienteNombre} />

      <div className="flex items-start justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-display font-bold">V/TO — Visión / Tracción Organizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <SavingIndicator saving={saving} />
          <PrintButton />
          <Button size="sm" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Valores medulares */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Valores Medulares</SectionTitle>
          <FieldHint>Los 3-5 principios no negociables que definen cómo trabajáis</FieldHint>
          <div className="mt-4 space-y-2">
            {data.valores.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                <Input value={v} onChange={(e) => setValor(i, e.target.value)} placeholder={`Valor ${i + 1}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Enfoque medular */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Enfoque Medular</SectionTitle>
          <FieldHint>El propósito profundo de la empresa, por qué existe</FieldHint>
          <Textarea className="mt-4 min-h-[80px] bg-background" value={data.enfoque_medular} onChange={(e) => set("enfoque_medular", e.target.value)} />
        </section>

        {/* Meta 10 años */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Meta a 10 Años</SectionTitle>
          <FieldHint>Un objetivo claro, ambicioso y medible para dentro de 10 años</FieldHint>
          <Textarea className="mt-4 min-h-[100px] bg-background" value={data.meta_10} onChange={(e) => set("meta_10", e.target.value)} />
        </section>

        {/* Panorama 3 años */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Panorama a 3 Años</SectionTitle>
          <FieldHint>Cómo se ve la empresa dentro de 3 años: facturación, equipo, posicionamiento, aspectos clave</FieldHint>
          <Textarea
            className="mt-4 min-h-[140px] bg-background"
            value={data.panorama_3}
            onChange={(e) => set("panorama_3", e.target.value)}
            placeholder="Describe con detalle cómo será la empresa en 3 años…"
          />
        </section>

        {/* Estrategia de mercado */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Estrategia de Mercado</SectionTitle>
          <FieldHint>A quién os dirigís y por qué os eligen a vosotros</FieldHint>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Mercado objetivo</Label>
              <Textarea className="mt-1 min-h-[70px] bg-background" value={data.estrategia_mercado_objetivo} onChange={(e) => set("estrategia_mercado_objetivo", e.target.value)} placeholder="Describe el cliente ideal…" />
            </div>
            <div>
              <Label className="text-xs">3 Cualidades únicas</Label>
              <Textarea className="mt-1 min-h-[70px] bg-background" value={data.estrategia_cualidades} onChange={(e) => set("estrategia_cualidades", e.target.value)} placeholder="Las 3 razones por las que os eligen a vosotros…" />
            </div>
            <div>
              <Label className="text-xs">Proceso comprobado</Label>
              <Textarea className="mt-1 min-h-[70px] bg-background" value={data.estrategia_proceso} onChange={(e) => set("estrategia_proceso", e.target.value)} placeholder="El sistema o método que usáis…" />
            </div>
            <div>
              <Label className="text-xs">Garantía</Label>
              <Textarea className="mt-1 min-h-[60px] bg-background" value={data.estrategia_garantia} onChange={(e) => set("estrategia_garantia", e.target.value)} placeholder="Qué garantizáis a vuestros clientes…" />
            </div>
          </div>
        </section>

        {/* Plan 1 año */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Plan a 1 Año</SectionTitle>
          <FieldHint>Qué tiene que pasar este año para estar en el camino correcto: objetivos, métricas clave y prioridades</FieldHint>
          <Textarea
            className="mt-4 min-h-[140px] bg-background"
            value={data.plan_anio}
            onChange={(e) => set("plan_anio", e.target.value)}
            placeholder="Describe los objetivos, métricas y prioridades del año…"
          />
        </section>
      </div>
    </div>
  );
}
