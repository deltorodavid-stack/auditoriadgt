import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ── Estilos de impresión inyectados ───────────────────────────────────────────
const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 0.5cm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: white !important; font-family: Arial, sans-serif; }
  @media print {
    .no-print { display: none !important; }
    html, body { height: 100%; overflow: hidden; }
    #org-flow-wrap {
      position: fixed !important;
      top: 60px !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    }
  }
`;

interface OrgNodeData {
  label: string;
  persona: string;
  fixed?: boolean;
  [key: string]: unknown;
}

// Nodo visual de sólo lectura (sin inputs)
function OrgNodeView({ data }: { data: Record<string, unknown> }) {
  const d = data as OrgNodeData;
  return (
    <div style={{
      position: "relative",
      minWidth: 140, borderRadius: 8, border: "2px solid #1E40AF",
      background: "white", padding: "10px 16px", textAlign: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }}>
      <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, border: 0, background: "#1E40AF" }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{d.label as string}</div>
      {d.persona && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{d.persona as string}</div>}
      <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, border: 0, background: "#1E40AF" }} />
    </div>
  );
}

const nodeTypes = { orgNode: OrgNodeView };

interface OrgData {
  clienteNombre?: string;
  nodes: Node[];
  edges: Edge[];
}

export default function OrganigramaPrint() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("org-print-data");
      if (!raw) { setError("No hay datos de organigrama. Cierra esta ventana y pulsa «Imprimir visual» de nuevo."); return; }
      const parsed = JSON.parse(raw) as OrgData;
      // Asignar tipo de nodo correcto a TODOS los nodos (incl. visionario)
      parsed.nodes = (parsed.nodes || []).map((n) => ({ ...n, type: "orgNode" }));
      parsed.edges = (parsed.edges || []).map((e) => ({ ...e, type: e.type || "smoothstep" }));
      console.log("[OrganigramaPrint] nodos leídos:", parsed.nodes.map((n) => n.id), "| total:", parsed.nodes.length);
      console.log("[OrganigramaPrint] edges leídos:", parsed.edges.length, parsed.edges);
      setOrgData(parsed);
    } catch {
      setError("Error al leer los datos del organigrama.");
    }
  }, []);

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

  return (
    <>
      <style>{PRINT_STYLES}</style>

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid #e5e7eb",
        background: "white", height: 52,
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

      {/* ── React Flow ───────────────────────────────────────────────────── */}
      <div id="org-flow-wrap" style={{ position: "absolute", top: 52, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={orgData.nodes}
          edges={orgData.edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ style: { stroke: "#1E40AF", strokeWidth: 2 }, type: "smoothstep" }}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          style={{ background: "white" }}
        >
          <Background gap={16} size={1} style={{ opacity: 0.15 }} />
        </ReactFlow>
      </div>
    </>
  );
}
