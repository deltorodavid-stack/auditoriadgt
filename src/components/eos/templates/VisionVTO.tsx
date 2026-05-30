import { useState } from "react";
import { usePlantilla } from "@/hooks/usePlantilla";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Save } from "lucide-react";
import {
  NoClientSelected, LoadingSpinner, SavingIndicator,
  SectionTitle, FieldHint, type NoClientProps,
} from "./shared";
import {
  DocumentViewer, DocSection, DocField, DocList,
  makeMdFilename,
} from "@/components/ui/DocumentViewer";

interface VTO {
  valores: string[];
  enfoque_medular: string;
  enfoque_accesorio: string;
  enfoque_pasion: string;
  enfoque_nicho: string;
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
  enfoque_accesorio: "",
  enfoque_pasion: "",
  enfoque_nicho: "",
  meta_10: "",
  panorama_3: "",
  estrategia_mercado_objetivo: "",
  estrategia_cualidades: "",
  estrategia_proceso: "",
  estrategia_garantia: "",
  plan_anio: "",
};

function generateMd(data: VTO, clienteNombre: string): string {
  const today = new Date().toLocaleDateString("es-ES");
  const lines: string[] = [
    `# V/TO — Visión / Tracción Organizer — ${clienteNombre}`,
    `\n*Generado: ${today}*`,
  ];
  const valores = data.valores.filter(Boolean);
  if (valores.length) {
    lines.push(`\n## Valores Medulares`);
    valores.forEach((v, i) => lines.push(`${i + 1}. ${v}`));
  }
  if (data.enfoque_medular || data.enfoque_accesorio || data.enfoque_pasion || data.enfoque_nicho) {
    lines.push(`\n## Enfoque Medular`);
    if (data.enfoque_medular) lines.push(`\n**Enfoque Medular**\n${data.enfoque_medular}`);
    if (data.enfoque_accesorio) lines.push(`\n**Enfoque Accesorio**\n${data.enfoque_accesorio}`);
    if (data.enfoque_pasion) lines.push(`\n**Pasión / Propósito**\n${data.enfoque_pasion}`);
    if (data.enfoque_nicho) lines.push(`\n**Nicho**\n${data.enfoque_nicho}`);
  }
  if (data.meta_10) lines.push(`\n## Meta a 10 Años\n${data.meta_10}`);
  if (data.panorama_3) lines.push(`\n## Panorama a 3 Años\n${data.panorama_3}`);
  if (data.estrategia_mercado_objetivo || data.estrategia_cualidades || data.estrategia_proceso || data.estrategia_garantia) {
    lines.push(`\n## Estrategia de Mercado`);
    if (data.estrategia_mercado_objetivo) lines.push(`\n**Mercado objetivo**\n${data.estrategia_mercado_objetivo}`);
    if (data.estrategia_cualidades) lines.push(`\n**3 Cualidades únicas**\n${data.estrategia_cualidades}`);
    if (data.estrategia_proceso) lines.push(`\n**Proceso comprobado**\n${data.estrategia_proceso}`);
    if (data.estrategia_garantia) lines.push(`\n**Garantía**\n${data.estrategia_garantia}`);
  }
  if (data.plan_anio) lines.push(`\n## Plan a 1 Año\n${data.plan_anio}`);
  return lines.join("\n");
}

export function VisionVTO({ clienteId, clienteNombre }: NoClientProps) {
  const { data, setData, saveNow, saving, loading } = usePlantilla<VTO>(clienteId, "vision", DEFAULT);
  const [viewMode, setViewMode] = useState(false);

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  const set = (key: keyof VTO, val: string) => setData({ ...data, [key]: val });
  const setValor = (i: number, val: string) => {
    const v = [...data.valores];
    v[i] = val;
    setData({ ...data, valores: v });
  };

  // ── Vista documento ─────────────────────────────────────────────────────────
  if (viewMode) {
    return (
      <DocumentViewer
        title="V/TO — Visión / Tracción Organizer"
        clienteNombre={clienteNombre}
        onClose={() => setViewMode(false)}
        mdContent={generateMd(data, clienteNombre)}
        mdFilename={makeMdFilename("vision", clienteNombre)}
      >
        <DocSection label="Valores Medulares">
          <DocList items={data.valores} />
        </DocSection>
        <DocSection label="Enfoque Medular">
          <DocField label="Enfoque Medular" value={data.enfoque_medular} />
          <DocField label="Enfoque Accesorio" value={data.enfoque_accesorio} />
          <DocField label="Pasión / Propósito" value={data.enfoque_pasion} />
          <DocField label="Nicho" value={data.enfoque_nicho} />
        </DocSection>
        <DocSection label="Meta a 10 Años">
          <DocField label="" value={data.meta_10} />
        </DocSection>
        <DocSection label="Panorama a 3 Años">
          <DocField label="" value={data.panorama_3} />
        </DocSection>
        <DocSection label="Estrategia de Mercado">
          <DocField label="Mercado objetivo" value={data.estrategia_mercado_objetivo} />
          <DocField label="3 Cualidades únicas" value={data.estrategia_cualidades} />
          <DocField label="Proceso comprobado" value={data.estrategia_proceso} />
          <DocField label="Garantía" value={data.estrategia_garantia} />
        </DocSection>
        <DocSection label="Plan a 1 Año">
          <DocField label="" value={data.plan_anio} />
        </DocSection>
      </DocumentViewer>
    );
  }

  // ── Vista edición ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold">V/TO — Visión / Tracción Organizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-3">
          <SavingIndicator saving={saving} />
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}>
            <Eye className="h-4 w-4 mr-1.5" /> Ver documento
          </Button>
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

        {/* Enfoque Medular — 4 sub-campos en el orden pedido */}
        <section className="rounded-lg border border-border bg-card p-6">
          <SectionTitle>Enfoque Medular</SectionTitle>
          <FieldHint>El propósito profundo de la empresa en cuatro dimensiones</FieldHint>
          <div className="mt-4 space-y-4">
            <div>
              <Label className="text-xs">Enfoque Medular</Label>
              <FieldHint>El propósito central de la empresa</FieldHint>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.enfoque_medular}
                onChange={(e) => set("enfoque_medular", e.target.value)}
                placeholder="El propósito central es…"
              />
            </div>
            <div>
              <Label className="text-xs">Enfoque Accesorio</Label>
              <FieldHint>Servicios o productos secundarios que complementan el enfoque principal</FieldHint>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.enfoque_accesorio}
                onChange={(e) => set("enfoque_accesorio", e.target.value)}
                placeholder="Complementamos con…"
              />
            </div>
            <div>
              <Label className="text-xs">Pasión / Propósito</Label>
              <FieldHint>¿Por qué existe la empresa? ¿Qué la mueve?</FieldHint>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.enfoque_pasion}
                onChange={(e) => set("enfoque_pasion", e.target.value)}
                placeholder="La empresa existe para…"
              />
            </div>
            <div>
              <Label className="text-xs">Nicho</Label>
              <FieldHint>¿A qué segmento específico se dirige?</FieldHint>
              <Textarea
                className="mt-1 min-h-[70px] bg-background"
                value={data.enfoque_nicho}
                onChange={(e) => set("enfoque_nicho", e.target.value)}
                placeholder="Nuestro nicho es…"
              />
            </div>
          </div>
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
          <FieldHint>Qué tiene que pasar este año para estar en el camino correcto</FieldHint>
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
