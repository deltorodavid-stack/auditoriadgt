import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import type { NoClientProps } from "./shared";
import { NoClientSelected, SavingIndicator, FieldHint, SectionTitle } from "./shared";

interface VTO {
  valores: string[];
  enfoque_medular: string;
  meta_10: string;
  panorama_3_facturacion: string;
  panorama_3_empleados: string;
  panorama_3_aspectos: string;
  mercado_objetivo: string;
  cualidades_unicas: string;
  proceso_comprobado: string;
  garantia: string;
  objetivos_anio: string;
  metricas_clave: string;
}

const DEFAULT: VTO = {
  valores: ["", "", "", "", ""],
  enfoque_medular: "",
  meta_10: "",
  panorama_3_facturacion: "",
  panorama_3_empleados: "",
  panorama_3_aspectos: "",
  mercado_objetivo: "",
  cualidades_unicas: "",
  proceso_comprobado: "",
  garantia: "",
  objetivos_anio: "",
  metricas_clave: "",
};

export function VisionVTO({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<VTO>(
    clienteId,
    "vision",
    DEFAULT
  );

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const set = (key: keyof VTO, val: string) =>
    setData({ ...data, [key]: val });

  const setValor = (i: number, val: string) => {
    const v = [...data.valores];
    v[i] = val;
    setData({ ...data, valores: v });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">V/TO — Visión / Tracción Organizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <SavingIndicator saving={saving} />
          <Button size="sm" onClick={saveNow} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> Guardar
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Valores medulares */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Valores Medulares</SectionTitle>
          <FieldHint>Los 3-5 principios no negociables que definen cómo trabajáis</FieldHint>
          <div className="mt-4 space-y-2">
            {data.valores.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
                <Input
                  value={v}
                  onChange={(e) => setValor(i, e.target.value)}
                  placeholder={`Valor ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Enfoque medular */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Enfoque Medular</SectionTitle>
          <FieldHint>El propósito profundo de la empresa, por qué existe</FieldHint>
          <Textarea
            className="mt-4 min-h-[80px] bg-background"
            value={data.enfoque_medular}
            onChange={(e) => set("enfoque_medular", e.target.value)}
          />
        </section>

        {/* Meta 10 años */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Meta a 10 Años</SectionTitle>
          <FieldHint>Un objetivo claro, ambicioso y medible para dentro de 10 años</FieldHint>
          <Textarea
            className="mt-4 min-h-[80px] bg-background"
            value={data.meta_10}
            onChange={(e) => set("meta_10", e.target.value)}
          />
        </section>

        {/* Panorama 3 años */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Panorama a 3 Años</SectionTitle>
          <FieldHint>Cómo se ve la empresa dentro de 3 años, en detalle</FieldHint>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Facturación objetivo</Label>
              <Input
                className="mt-1"
                value={data.panorama_3_facturacion}
                onChange={(e) => set("panorama_3_facturacion", e.target.value)}
                placeholder="Ej: 2.000.000 €"
              />
            </div>
            <div>
              <Label className="text-xs">Nº de empleados</Label>
              <Input
                className="mt-1"
                value={data.panorama_3_empleados}
                onChange={(e) => set("panorama_3_empleados", e.target.value)}
                placeholder="Ej: 25 personas"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-xs">Aspectos clave a conseguir</Label>
            <Textarea
              className="mt-1 min-h-[80px] bg-background"
              value={data.panorama_3_aspectos}
              onChange={(e) => set("panorama_3_aspectos", e.target.value)}
              placeholder="Describe los aspectos más importantes que caracterizarán a la empresa en 3 años…"
            />
          </div>
        </section>

        {/* Estrategia de mercado */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Estrategia de Mercado</SectionTitle>
          <FieldHint>A quién os dirigís y por qué os eligen a vosotros</FieldHint>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Mercado objetivo</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.mercado_objetivo}
                onChange={(e) => set("mercado_objetivo", e.target.value)}
                placeholder="Describe el cliente ideal: quién es, dónde está, qué necesita…"
              />
            </div>
            <div>
              <Label className="text-xs">3 Cualidades únicas</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.cualidades_unicas}
                onChange={(e) => set("cualidades_unicas", e.target.value)}
                placeholder="Las 3 razones por las que os eligen a vosotros y no a la competencia…"
              />
            </div>
            <div>
              <Label className="text-xs">Proceso comprobado</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.proceso_comprobado}
                onChange={(e) => set("proceso_comprobado", e.target.value)}
                placeholder="El sistema o método que usáis para entregar resultados…"
              />
            </div>
            <div>
              <Label className="text-xs">Garantía</Label>
              <Textarea
                className="mt-1 min-h-[60px] bg-background"
                value={data.garantia}
                onChange={(e) => set("garantia", e.target.value)}
                placeholder="Qué garantizáis a vuestros clientes…"
              />
            </div>
          </div>
        </section>

        {/* Plan 1 año */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Plan a 1 Año</SectionTitle>
          <FieldHint>Qué tiene que pasar este año para estar en el camino correcto</FieldHint>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Objetivos del año</Label>
              <Textarea
                className="mt-1 min-h-[80px] bg-background"
                value={data.objetivos_anio}
                onChange={(e) => set("objetivos_anio", e.target.value)}
                placeholder="Los 3-7 objetivos más importantes para este año…"
              />
            </div>
            <div>
              <Label className="text-xs">Métricas clave</Label>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.metricas_clave}
                onChange={(e) => set("metricas_clave", e.target.value)}
                placeholder="Los números que medirán el éxito del año…"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
