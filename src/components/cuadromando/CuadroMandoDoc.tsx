import { DocumentViewer, DocSection, makeMdFilename } from "@/components/ui/DocumentViewer";
import {
  CuadroMandoData, Categoria, MESES,
  categoriaTotal, conceptoTotal, calcularTotales, eur,
  ConceptoPersonal, ConceptoSimple,
} from "./lib";

function bloqueRows(block: Categoria[]) {
  return block.flatMap((c) =>
    c.conceptos
      .filter((x) => c.tipo === "personal"
        ? (x as ConceptoPersonal).nombre
        : (x as ConceptoSimple).descripcion)
      .map((x) => ({
        categoria: c.categoria,
        concepto: c.tipo === "personal"
          ? (x as ConceptoPersonal).nombre
          : (x as ConceptoSimple).descripcion,
        importe: conceptoTotal(x, c.tipo),
      }))
  );
}

const thStyle: React.CSSProperties = { textAlign: "left", padding: "5px 8px", fontWeight: 700, fontSize: "11px", color: "#374151", borderBottom: "2px solid #1E40AF" };
const tdStyle: React.CSSProperties = { padding: "4px 8px", fontSize: "12px", color: "#111", borderBottom: "1px solid #f3f4f6" };
const importeStyle: React.CSSProperties = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" };

function BloqueTabla({ titulo, block }: { titulo: string; block: Categoria[] }) {
  const rows = bloqueRows(block);
  const total = block.reduce((s, c) => s + categoriaTotal(c), 0);
  if (rows.length === 0 && total === 0) return null;
  return (
    <DocSection label={titulo}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Categoría</th>
            <th style={thStyle}>Concepto</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Importe</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ ...tdStyle, color: "#6b7280" }}>{r.categoria}</td>
              <td style={tdStyle}>{r.concepto}</td>
              <td style={importeStyle}>{eur(r.importe)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...tdStyle, fontWeight: 700, borderTop: "1.5px solid #d1d5db" }} colSpan={2}>Total {titulo}</td>
            <td style={{ ...importeStyle, fontWeight: 700, borderTop: "1.5px solid #d1d5db" }}>{eur(total)}</td>
          </tr>
        </tbody>
      </table>
    </DocSection>
  );
}

export function generateMd(data: CuadroMandoData, umbral: number, clienteNombre: string, mes: number, anio: number): string {
  const t = calcularTotales(data, umbral);
  const lines: string[] = [`# Cuadro de Mando — ${clienteNombre}`, `### ${MESES[mes - 1]} ${anio}`, ""];

  const bloque = (titulo: string, block: Categoria[]) => {
    const rows = bloqueRows(block);
    if (rows.length === 0) return;
    lines.push(`## ${titulo}`, "", "| Categoría | Concepto | Importe |", "|---|---|---:|");
    for (const r of rows) lines.push(`| ${r.categoria} | ${r.concepto} | ${eur(r.importe)} |`);
    lines.push(`| **Total ${titulo}** | | **${eur(block.reduce((s, c) => s + categoriaTotal(c), 0))}** |`, "");
  };

  bloque("Gastos Fijos", data.gastos_fijos);
  bloque("Gastos Variables", data.gastos_variables);
  bloque("Ingresos Fijos", data.ingresos_fijos);
  bloque("Ingresos Variables", data.ingresos_variables);

  lines.push(
    "## Resumen", "",
    `- Total gastos fijos: ${eur(t.gastosFijos)}`,
    `- Total gastos variables: ${eur(t.gastosVariables)}`,
    `- **Total gastos: ${eur(t.gastosTotal)}**`,
    `- Total ingresos fijos: ${eur(t.ingresosFijos)}`,
    `- Total ingresos variables: ${eur(t.ingresosVariables)}`,
    `- **Total ingresos: ${eur(t.ingresosTotal)}**`,
    `- **Resultado del mes: ${eur(t.resultado)}**`,
    `- Margen: ${t.margen.toFixed(1)} %`,
    `- Umbral de rentabilidad: ${eur(umbral)}`,
    `- Diferencia vs umbral: ${eur(t.diffUmbral)}`,
  );
  return lines.join("\n");
}

interface Props {
  data: CuadroMandoData;
  umbral: number;
  clienteNombre: string;
  mes: number;
  anio: number;
  onClose: () => void;
}

export function CuadroMandoDoc({ data, umbral, clienteNombre, mes, anio, onClose }: Props) {
  const t = calcularTotales(data, umbral);
  const resColor = t.resultado > 0 ? "#16a34a" : t.resultado < 0 ? "#dc2626" : "#374151";

  return (
    <DocumentViewer
      title={`Cuadro de Mando — ${MESES[mes - 1]} ${anio}`}
      clienteNombre={clienteNombre}
      onClose={onClose}
      mdContent={generateMd(data, umbral, clienteNombre, mes, anio)}
      mdFilename={makeMdFilename("cuadro-mando", `${clienteNombre}-${anio}-${String(mes).padStart(2, "0")}`)}
    >
      <BloqueTabla titulo="Gastos Fijos" block={data.gastos_fijos} />
      <BloqueTabla titulo="Gastos Variables" block={data.gastos_variables} />
      <BloqueTabla titulo="Ingresos Fijos" block={data.ingresos_fijos} />
      <BloqueTabla titulo="Ingresos Variables" block={data.ingresos_variables} />

      <DocSection label="Resumen del mes">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[
              ["Total gastos fijos", eur(t.gastosFijos)],
              ["Total gastos variables", eur(t.gastosVariables)],
              ["Total gastos", eur(t.gastosTotal)],
              ["Total ingresos fijos", eur(t.ingresosFijos)],
              ["Total ingresos variables", eur(t.ingresosVariables)],
              ["Total ingresos", eur(t.ingresosTotal)],
              ["Umbral de rentabilidad", eur(umbral)],
              ["Diferencia vs umbral", eur(t.diffUmbral)],
            ].map(([k, v], i) => (
              <tr key={i}>
                <td style={tdStyle}>{k}</td>
                <td style={importeStyle}>{v}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...tdStyle, fontWeight: 700, fontSize: "13px", borderTop: "2px solid #1E40AF" }}>Resultado del mes</td>
              <td style={{ ...importeStyle, fontWeight: 700, fontSize: "13px", color: resColor, borderTop: "2px solid #1E40AF" }}>
                {eur(t.resultado)} &nbsp;({t.margen.toFixed(1)} %)
              </td>
            </tr>
          </tbody>
        </table>
      </DocSection>
    </DocumentViewer>
  );
}
