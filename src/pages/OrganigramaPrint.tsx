import { useEffect, useMemo, useState } from "react";

// ── Estilos de impresión ───────────────────────────────────────────────────────
const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 0.5cm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white !important; font-family: Arial, Helvetica, sans-serif; }

  #org-header { page-break-after: avoid; break-after: avoid; }
  #org-svg-wrap, #org-svg-wrap svg {
    page-break-inside: avoid; break-inside: avoid;
    page-break-before: avoid; break-before: avoid;
  }

  @media print {
    .no-print { display: none !important; }
    html, body, #root { margin: 0 !important; padding: 0 !important; height: auto !important; }
    #org-header { position: relative !important; margin-bottom: 10px !important; }
    #org-svg-wrap {
      width: 100% !important;
      height: auto !important;
      max-height: calc(100vh - 80px) !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    #org-svg-wrap svg {
      width: 100% !important;
      height: auto !important;
      max-height: calc(100vh - 80px) !important;
    }
  }
`;

// Dimensiones de cada caja (idénticas a las del editor React Flow)
const NODE_W = 160;
const NODE_H = 60;

interface PrintNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; persona: string; fixed?: boolean };
}
interface PrintEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}
interface OrgData {
  clienteNombre?: string;
  nodes: PrintNode[];
  edges: PrintEdge[];
}

// Construye un path tipo "smooth step": baja del source, tramo horizontal a
// media altura y baja hasta el target, con esquinas redondeadas.
function buildEdgePath(sx: number, sy: number, tx: number, ty: number): string {
  const midY = (sy + ty) / 2;
  const r = Math.min(12, Math.abs(tx - sx) / 2 || 12, Math.abs(midY - sy) / 2 || 12);

  // Caso vertical directo (mismo x): línea recta
  if (Math.abs(tx - sx) < 1) {
    return `M ${sx},${sy} L ${tx},${ty}`;
  }

  const dirX = tx > sx ? 1 : -1;
  const dirY = ty > sy ? 1 : -1;

  return [
    `M ${sx},${sy}`,
    `L ${sx},${midY - r * dirY}`,
    `Q ${sx},${midY} ${sx + r * dirX},${midY}`,
    `L ${tx - r * dirX},${midY}`,
    `Q ${tx},${midY} ${tx},${midY + r * dirY}`,
    `L ${tx},${ty}`,
  ].join(" ");
}

export default function OrganigramaPrint() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("org-print-data");
      if (!raw) {
        setError("No hay datos de organigrama. Cierra esta ventana y pulsa «Imprimir visual» de nuevo.");
        return;
      }
      const parsed = JSON.parse(raw) as OrgData;
      parsed.nodes = parsed.nodes || [];
      parsed.edges = parsed.edges || [];
      setOrgData(parsed);
    } catch {
      setError("Error al leer los datos del organigrama.");
    }
  }, []);

  // Bounding box + geometría del SVG
  const geometry = useMemo(() => {
    if (!orgData || orgData.nodes.length === 0) return null;
    const xs = orgData.nodes.map((n) => n.position.x);
    const ys = orgData.nodes.map((n) => n.position.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...orgData.nodes.map((n) => n.position.x + NODE_W));
    const maxY = Math.max(...orgData.nodes.map((n) => n.position.y + NODE_H));
    const pad = 50;
    const vbX = minX - pad;
    const vbY = minY - pad;
    const vbW = maxX - minX + pad * 2;
    const vbH = maxY - minY + pad * 2;
    return { vbX, vbY, vbW, vbH };
  }, [orgData]);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial" }}>
        <p style={{ color: "#ef4444", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!orgData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "#6b7280", fontSize: 14 }}>Cargando…</p>
      </div>
    );
  }

  // Mapa id → nodo para resolver edges
  const nodeById = new Map(orgData.nodes.map((n) => [n.id, n]));

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div id="org-header" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/logo-david-del-toro.png"
            alt=""
            style={{ maxHeight: 28, width: "auto" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            {orgData.clienteNombre && (
              <div style={{ fontSize: 11, color: "#6b7280" }}>{orgData.clienteNombre}</div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Organigrama</div>
          </div>
        </div>

        <button
          className="no-print"
          onClick={() => window.print()}
          style={{
            padding: "7px 18px", background: "#1E40AF", color: "white",
            border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Imprimir / PDF
        </button>
      </div>

      {/* ── Organigrama en SVG vectorial ─────────────────────────────────── */}
      <div id="org-svg-wrap" style={{ padding: "16px", width: "100%" }}>
        {geometry && (
          <svg
            viewBox={`${geometry.vbX} ${geometry.vbY} ${geometry.vbW} ${geometry.vbH}`}
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ display: "block", height: "auto", maxHeight: "calc(100vh - 90px)" }}
          >
            {/* Aristas */}
            <g>
              {orgData.edges.map((e) => {
                const s = nodeById.get(e.source);
                const t = nodeById.get(e.target);
                if (!s || !t) return null;
                const sx = s.position.x + NODE_W / 2;
                const sy = s.position.y + NODE_H;
                const tx = t.position.x + NODE_W / 2;
                const ty = t.position.y;
                return (
                  <path
                    key={e.id}
                    d={buildEdgePath(sx, sy, tx, ty)}
                    stroke="#1E40AF"
                    strokeWidth={1.5}
                    fill="none"
                  />
                );
              })}
            </g>

            {/* Nodos */}
            <g>
              {orgData.nodes.map((n) => {
                const x = n.position.x;
                const y = n.position.y;
                const cx = x + NODE_W / 2;
                const hasPersona = Boolean(n.data.persona);
                return (
                  <g key={n.id}>
                    <rect
                      x={x} y={y} width={NODE_W} height={NODE_H} rx={8} ry={8}
                      fill="#ffffff" stroke="#1E40AF" strokeWidth={2}
                    />
                    <text
                      x={cx}
                      y={hasPersona ? y + NODE_H / 2 - 4 : y + NODE_H / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize: 11, fontWeight: 700, fill: "#111827", fontFamily: "Arial, sans-serif" }}
                    >
                      {n.data.label}
                    </text>
                    {hasPersona && (
                      <text
                        x={cx}
                        y={y + NODE_H / 2 + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 9, fill: "#666666", fontFamily: "Arial, sans-serif" }}
                      >
                        {n.data.persona}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </>
  );
}
