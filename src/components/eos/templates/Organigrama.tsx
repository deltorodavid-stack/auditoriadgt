import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Save, Plus, Trash2, Eye, Printer, List, ChevronLeft } from "lucide-react";
import { NoClientSelected, LoadingSpinner, SavingIndicator, FieldHint, type NoClientProps } from "./shared";
import { toast } from "sonner";
import { DocumentViewer, DocSection, makeMdFilename } from "@/components/ui/DocumentViewer";

// ── CSS del diagrama (inyectado como <style>) ──────────────────────────────────
const ORG_CSS = `
  .org-wrap { text-align: center; font-family: 'Inter', sans-serif; }
  .org-wrap ul {
    padding: 0; margin: 0; list-style: none;
    position: relative; display: flex; justify-content: center;
  }
  .org-wrap li {
    text-align: center; list-style-type: none;
    position: relative; padding: 20px 8px 0 8px;
  }
  .org-wrap li::before, .org-wrap li::after {
    content: ''; position: absolute; top: 0; right: 50%;
    border-top: 1px solid #9ca3af; width: 50%; height: 20px;
  }
  .org-wrap li::after {
    right: auto; left: 50%; border-left: 1px solid #9ca3af;
  }
  .org-wrap li:only-child::before, .org-wrap li:only-child::after { display: none; }
  .org-wrap li:only-child { padding-top: 0; }
  .org-wrap li:first-child::before, .org-wrap li:last-child::after { border: none; }
  .org-wrap li:last-child::before {
    border-right: 1px solid #9ca3af; border-radius: 0 5px 0 0;
  }
  .org-wrap li:first-child::after { border-radius: 5px 0 0 0; }
  .org-wrap ul::before {
    content: ''; position: absolute; top: 0; left: 50%;
    border-left: 1px solid #9ca3af; height: 20px;
  }
  .org-box {
    border: 2px solid #1E40AF; border-radius: 6px;
    padding: 6px 14px; display: inline-block;
    min-width: 100px; max-width: 160px;
    background: white; word-break: break-word;
  }
  .org-box-label { font-size: 12px; font-weight: 700; color: #111; }
  .org-box-persona { font-size: 10px; color: #6b7280; margin-top: 2px; }
  @media print {
    #org-diagram-print {
      position: fixed !important; inset: 0 !important;
      background: white !important; z-index: 99999 !important;
      padding: 20px !important; display: flex !important;
      flex-direction: column !important; overflow: hidden !important;
    }
    #org-diagram-print .no-print { display: none !important; }
  }
`;

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface OrgNodeData {
  label: string; persona: string; fixed: boolean;
  onLabelChange: (id: string, val: string) => void;
  onPersonaChange: (id: string, val: string) => void;
  onDelete: (id: string) => void;
  [key: string]: unknown;
}

interface TreeNode { id: string; label: string; persona: string; children: TreeNode[] }

function buildTree(nodes: Node[], edges: Edge[]): TreeNode[] {
  const childMap: Record<string, string[]> = {};
  const hasParent = new Set<string>();
  for (const e of edges) {
    if (!childMap[e.source]) childMap[e.source] = [];
    childMap[e.source].push(e.target);
    hasParent.add(e.target);
  }
  const build = (id: string): TreeNode => {
    const n = nodes.find((x) => x.id === id)!;
    return {
      id, label: n.data.label as string, persona: n.data.persona as string,
      children: (childMap[id] || []).map(build),
    };
  };
  return nodes.filter((n) => !hasParent.has(n.id)).map((n) => build(n.id));
}

function OrgChartNode({ node }: { node: TreeNode }) {
  return (
    <li>
      <div className="org-box">
        <div className="org-box-label">{node.label}</div>
        {node.persona && <div className="org-box-persona">{node.persona}</div>}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => <OrgChartNode key={c.id} node={c} />)}
        </ul>
      )}
    </li>
  );
}

// ── React Flow node component ──────────────────────────────────────────────────
function OrgNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as OrgNodeData;
  return (
    <div className={`relative min-w-[140px] rounded-lg border-2 bg-card px-4 py-3 text-center shadow-sm transition-all ${selected ? "border-primary" : d.fixed ? "border-primary/40" : "border-border"}`}>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-primary/40" />
      <input value={d.label as string} onChange={(e) => d.onLabelChange(id, e.target.value)} onMouseDown={(e) => e.stopPropagation()} className="w-full bg-transparent text-center text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/50" placeholder="Nombre" />
      <input value={d.persona as string} onChange={(e) => d.onPersonaChange(id, e.target.value)} onMouseDown={(e) => e.stopPropagation()} className="mt-1 w-full bg-transparent text-center text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/40" placeholder="Responsable" />
      {!d.fixed && (
        <button onMouseDown={(e) => { e.stopPropagation(); d.onDelete(id); }} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:!opacity-100" title="Eliminar">
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-primary/40" />
    </div>
  );
}

const nodeTypes = { orgNode: OrgNodeComponent };

const INITIAL_NODES: Node[] = [
  { id: "visionario", type: "orgNode", position: { x: 320, y: 0 }, data: { label: "VISIONARIO", persona: "", fixed: true }, draggable: true },
  { id: "integrador", type: "orgNode", position: { x: 320, y: 120 }, data: { label: "INTEGRADOR", persona: "", fixed: true }, draggable: true },
  { id: "ventas", type: "orgNode", position: { x: 60, y: 270 }, data: { label: "VENTAS", persona: "", fixed: true }, draggable: true },
  { id: "produccion", type: "orgNode", position: { x: 320, y: 270 }, data: { label: "PRODUCCIÓN", persona: "", fixed: true }, draggable: true },
  { id: "administracion", type: "orgNode", position: { x: 580, y: 270 }, data: { label: "ADMINISTRACIÓN", persona: "", fixed: true }, draggable: true },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e-vis-int", source: "visionario", target: "integrador", type: "smoothstep" },
  { id: "e-int-ven", source: "integrador", target: "ventas", type: "smoothstep" },
  { id: "e-int-pro", source: "integrador", target: "produccion", type: "smoothstep" },
  { id: "e-int-adm", source: "integrador", target: "administracion", type: "smoothstep" },
];

interface OrgData {
  nodes: Array<{ id: string; position: { x: number; y: number }; data: { label: string; persona: string; fixed: boolean } }>;
  edges: Array<{ id: string; source: string; target: string; type?: string }>;
}

function generateMd(nodes: Node[], clienteNombre: string): string {
  const lines = [`# Organigrama — ${clienteNombre}`, `\n| Puesto / Área | Responsable |`, `|---|---|`];
  for (const n of nodes) lines.push(`| ${n.data.label as string} | ${(n.data.persona as string) || "—"} |`);
  return lines.join("\n");
}

// ── Componente principal ────────────────────────────────────────────────────────
export function Organigrama({ clienteId, clienteNombre }: NoClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 'edit' | 'list' | 'diagram'
  const [mode, setMode] = useState<"edit" | "list" | "diagram">("edit");
  const clienteIdRef = useRef(clienteId);

  useEffect(() => { clienteIdRef.current = clienteId; }, [clienteId]);

  const onLabelChange = useCallback((id: string, val: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: val } } : n));
  }, [setNodes]);

  const onPersonaChange = useCallback((id: string, val: string) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, persona: val } } : n));
  }, [setNodes]);

  const onDelete = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const nodesWithCbs = nodes.map((n) => ({ ...n, data: { ...n.data, onLabelChange, onPersonaChange, onDelete } }));

  useEffect(() => {
    if (!clienteId) {
      setNodes(INITIAL_NODES.map((n) => ({ ...n, data: { ...n.data, onLabelChange, onPersonaChange, onDelete } })));
      setEdges(INITIAL_EDGES);
      return;
    }
    setLoading(true);
    supabase.from("plantillas").select("datos").eq("cliente_id", clienteId).eq("tipo", "organigrama").maybeSingle()
      .then(({ data: row }) => {
        if (row?.datos) {
          const saved = row.datos as OrgData;
          setNodes((saved.nodes || INITIAL_NODES).map((n) => ({ ...n, type: "orgNode", data: { ...n.data, onLabelChange, onPersonaChange, onDelete } })));
          setEdges((saved.edges || INITIAL_EDGES).map((e) => ({ ...e, type: e.type || "smoothstep" })));
        } else {
          setNodes(INITIAL_NODES.map((n) => ({ ...n, data: { ...n.data, onLabelChange, onPersonaChange, onDelete } })));
          setEdges(INITIAL_EDGES);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
  }, [setEdges]);

  const addNode = () => {
    const id = `node-${Date.now()}`;
    setNodes((nds) => [...nds, {
      id, type: "orgNode",
      position: { x: 320 + Math.random() * 200 - 100, y: 420 + Math.random() * 80 },
      data: { label: "Nuevo", persona: "", fixed: false, onLabelChange, onPersonaChange, onDelete },
    }]);
  };

  const handleSave = async () => {
    const cid = clienteIdRef.current;
    if (!cid) return;
    setSaving(true);
    const payload: OrgData = {
      nodes: nodes.map(({ id, position, data }) => ({ id, position, data: { label: data.label as string, persona: data.persona as string, fixed: Boolean(data.fixed) } })),
      edges: edges.map(({ id, source, target, type }) => ({ id, source, target, type })),
    };
    const { error } = await supabase.from("plantillas").upsert(
      { cliente_id: cid, tipo: "organigrama", datos: payload as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
      { onConflict: "cliente_id,tipo" }
    );
    setSaving(false);
    if (error) toast.error("Error al guardar"); else toast.success("Guardado correctamente");
  };

  // Impresión del diagrama CSS — visibility trick funciona en HTML puro (no en canvas/SVG)
  const handlePrintDiagram = () => {
    const style = document.createElement("style");
    style.id = "org-diagram-print-style";
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #org-diagram-print, #org-diagram-print * { visibility: visible !important; }
        @page { size: A4 landscape; margin: 1cm; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    window.addEventListener("afterprint", () => {
      document.getElementById("org-diagram-print-style")?.remove();
    }, { once: true });
  };

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  // ── MODO LISTADO — DocumentViewer estándar (igual que Visión, Rocas…) ──────────
  if (mode === "list") {
    return (
      <DocumentViewer
        title="Organigrama"
        clienteNombre={clienteNombre}
        onClose={() => setMode("edit")}
        mdContent={generateMd(nodes, clienteNombre)}
        mdFilename={makeMdFilename("organigrama", clienteNombre)}
        extraToolbar={
          <Button variant="outline" size="sm" onClick={() => setMode("diagram")}>
            <Eye className="h-4 w-4 mr-1.5" /> Ver diagrama
          </Button>
        }
      >
        <DocSection label="Estructura Organizativa">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1E40AF" }}>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: "11px", color: "#374151" }}>Puesto / Área</th>
                <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, fontSize: "11px", color: "#374151" }}>Responsable</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => (
                <tr key={n.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "5px 8px", fontWeight: 500, color: "#111", fontSize: "12px" }}>{n.data.label as string}</td>
                  <td style={{ padding: "5px 8px", color: "#6b7280", fontSize: "12px" }}>{(n.data.persona as string) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DocSection>
      </DocumentViewer>
    );
  }

  // ── MODO DIAGRAMA — CSS puro, sin React Flow, imprime correctamente ────────────
  if (mode === "diagram") {
    const roots = buildTree(nodes, edges);
    return (
      <div id="org-diagram-print" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* CSS del árbol */}
        <style>{ORG_CSS}</style>

        {/* Toolbar — oculto al imprimir */}
        <div className="no-print mb-5 flex flex-wrap items-center gap-3 print:hidden">
          <button onClick={() => setMode("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Volver al listado
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">Desactiva «Encabezados y pies» al imprimir</span>
            <Button variant="outline" size="sm" onClick={handlePrintDiagram}>
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir diagrama
            </Button>
          </div>
        </div>

        {/* Cabecera con logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "2px solid #e5e7eb", marginBottom: "28px" }}>
          <img src="/images/logo-david-del-toro.png" alt="" style={{ maxHeight: "36px", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "2px" }}>{clienteNombre}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#111" }}>Organigrama</div>
          </div>
        </div>

        {/* Diagrama árbol CSS */}
        <div className="org-wrap" style={{ overflowX: "auto" }}>
          {roots.map((root) => (
            <div key={root.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="org-box">
                <div className="org-box-label">{root.label}</div>
                {root.persona && <div className="org-box-persona">{root.persona}</div>}
              </div>
              {root.children.length > 0 && (
                <ul>
                  {root.children.map((c) => <OrgChartNode key={c.id} node={c} />)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── MODO EDICIÓN — React Flow interactivo ──────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold">Organigrama</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{clienteNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <SavingIndicator saving={saving} />
          <FieldHint>Arrastra los nodos para reorganizar. Conecta nodos desde el punto inferior al superior.</FieldHint>
          <Button size="sm" variant="outline" onClick={() => setMode("list")}>
            <List className="h-4 w-4 mr-1.5" /> Ver listado
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMode("diagram")}>
            <Eye className="h-4 w-4 mr-1.5" /> Ver diagrama
          </Button>
          <Button size="sm" variant="outline" onClick={addNode}><Plus className="h-4 w-4 mr-1.5" /> Añadir caja</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-border overflow-hidden">
        <ReactFlow
          nodes={nodesWithCbs} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.3 }}
          className="bg-muted/20"
        >
          <Background gap={16} size={1} className="opacity-30" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
