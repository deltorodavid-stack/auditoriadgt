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
import { Save, Plus, Trash2, Eye, Printer } from "lucide-react";
import { NoClientSelected, LoadingSpinner, SavingIndicator, FieldHint, type NoClientProps } from "./shared";
import { toast } from "sonner";
import { DocumentViewer, DocSection, makeMdFilename } from "@/components/ui/DocumentViewer";

interface OrgNodeData {
  label: string; persona: string; fixed: boolean;
  onLabelChange: (id: string, val: string) => void;
  onPersonaChange: (id: string, val: string) => void;
  onDelete: (id: string) => void;
  [key: string]: unknown;
}

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
  for (const n of nodes) {
    lines.push(`| ${n.data.label as string} | ${(n.data.persona as string) || "—"} |`);
  }
  return lines.join("\n");
}

export function Organigrama({ clienteId, clienteNombre }: NoClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);
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

  // Impresión visual: usa visibility trick para mostrar solo el canvas de React Flow
  const handlePrintVisual = () => {
    const style = document.createElement("style");
    style.id = "org-visual-print-style";
    style.textContent = `
      @media print {
        body { visibility: hidden !important; }
        #org-flow-canvas, #org-flow-canvas * { visibility: visible !important; }
        #org-flow-canvas {
          display: flex !important;
          flex-direction: column !important;
          position: fixed !important;
          inset: 0 !important;
          background: white !important;
          z-index: 99999 !important;
          padding: 0 !important;
        }
        @page { size: A4 landscape; margin: 0.8cm; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    window.addEventListener("afterprint", () => {
      document.getElementById("org-visual-print-style")?.remove();
    }, { once: true });
  };

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  // ── Vista documento (listado) ────────────────────────────────────────────────
  if (viewMode) {
    return (
      <>
        <DocumentViewer
          title="Organigrama"
          clienteNombre={clienteNombre}
          onClose={() => setViewMode(false)}
          mdContent={generateMd(nodes, clienteNombre)}
          mdFilename={makeMdFilename("organigrama", clienteNombre)}
          extraToolbar={
            <Button variant="outline" size="sm" onClick={handlePrintVisual}>
              <Printer className="h-4 w-4 mr-1.5" /> Imprimir visual
            </Button>
          }
        >
          <DocSection label="Estructura Organizativa">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600 }}>Puesto / Área</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600 }}>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((n) => (
                  <tr key={n.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 500 }}>{n.data.label as string}</td>
                    <td style={{ padding: "5px 8px", color: "#6b7280" }}>{(n.data.persona as string) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DocSection>
        </DocumentViewer>

        {/* Canvas de React Flow — oculto en pantalla, visible solo al imprimir visual */}
        <div
          id="org-flow-canvas"
          style={{ display: "none", flexDirection: "column", height: "100vh" }}
        >
          {/* Cabecera con logo para impresión visual */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "white",
            flexShrink: 0,
          }}>
            <img src="/images/logo-david-del-toro.png" alt="" style={{ maxHeight: "28px" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{clienteNombre} — Organigrama</span>
          </div>
          <div style={{ flex: 1 }}>
            <ReactFlow
              nodes={nodesWithCbs} edges={edges}
              nodeTypes={nodeTypes}
              fitView fitViewOptions={{ padding: 0.2 }}
              className="bg-white"
            >
              <Background gap={16} size={1} className="opacity-20" />
            </ReactFlow>
          </div>
        </div>
      </>
    );
  }

  // ── Vista edición ────────────────────────────────────────────────────────────
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
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}><Eye className="h-4 w-4 mr-1.5" /> Ver documento</Button>
          <Button size="sm" variant="outline" onClick={addNode}><Plus className="h-4 w-4 mr-1.5" /> Añadir caja</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
        </div>
      </div>

      <div id="org-flow-canvas" className="flex-1 rounded-lg border border-border overflow-hidden">
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
