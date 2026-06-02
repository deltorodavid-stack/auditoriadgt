import { useCallback, useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
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
import { Save, Plus, Trash2, Eye, Printer, List } from "lucide-react";
import { NoClientSelected, LoadingSpinner, SavingIndicator, FieldHint, type NoClientProps } from "./shared";
import { toast } from "sonner";
import { DocumentViewer, DocSection, makeMdFilename } from "@/components/ui/DocumentViewer";

// ── Tipos ──────────────────────────────────────────────────────────────────────
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
  for (const n of nodes) lines.push(`| ${n.data.label as string} | ${(n.data.persona as string) || "—"} |`);
  return lines.join("\n");
}

// ── Componente principal ────────────────────────────────────────────────────────
export function Organigrama({ clienteId, clienteNombre }: NoClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const clienteIdRef = useRef(clienteId);
  // Ref al contenedor del React Flow para html2canvas
  const flowContainerRef = useRef<HTMLDivElement>(null);
  // Instancia de React Flow para llamar fitView
  const rfInstanceRef = useRef<{ fitView: (opts?: object) => void; zoomTo: (zoom: number) => void } | null>(null);

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

  // ── Captura con html2canvas y abre ventana de impresión ──────────────────────
  const handlePrintVisual = async () => {
    const container = flowContainerRef.current;
    if (!container) return;

    setCapturing(true);
    try {
      // Zoom out y ajusta vista para que todos los nodos quepan
      if (rfInstanceRef.current) {
        rfInstanceRef.current.zoomTo(0.7);
        await new Promise((r) => setTimeout(r, 200));
        rfInstanceRef.current.fitView({ padding: 0.15, duration: 0 });
        await new Promise((r) => setTimeout(r, 500));
      }

      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        removeContainer: true,
      });

      const imageUrl = canvas.toDataURL("image/png");
      const logoUrl = `${window.location.origin}/images/logo-david-del-toro.png`;

      const win = window.open("", "_blank", "width=1000,height=750");
      if (!win) {
        toast.error("El navegador bloqueó la ventana. Permite popups para esta página.");
        return;
      }

      win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Organigrama — ${clienteNombre}</title>
  <style>
    @page { size: A4 landscape; margin: 0.5cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; font-family: Arial, sans-serif; width: 100%; }
    .wrapper { width: 100%; padding: 0.5cm; }
    .header { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; margin-bottom: 12px; }
    .header img { max-height: 30px; width: auto; }
    .header .client { font-size: 11px; color: #666; margin-bottom: 1px; }
    .header .title { font-size: 15px; font-weight: 700; color: #111; }
    .chart img { width: 100%; height: auto; max-width: 100%; display: block; }
    .print-btn {
      position: fixed; top: 16px; right: 16px;
      padding: 8px 18px; background: #1E40AF; color: white;
      border: none; border-radius: 6px; cursor: pointer;
      font-size: 13px; font-weight: 600; z-index: 999;
    }
    .print-btn:hover { background: #1e3a8a; }
    .hint { position: fixed; top: 56px; right: 16px; font-size: 11px; color: #9ca3af; }
    @media print {
      .print-btn, .hint { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Imprimir / PDF</button>
  <p class="hint">Desactiva «Encabezados y pies» al imprimir</p>
  <div class="wrapper">
    <div class="header">
      <img src="${logoUrl}" onerror="this.style.display='none'" />
      <div>
        <div class="client">${clienteNombre}</div>
        <div class="title">Organigrama</div>
      </div>
    </div>
    <div class="chart">
      <img src="${imageUrl}" />
    </div>
  </div>
</body>
</html>`);
      win.document.close();
    } catch (err) {
      console.error(err);
      toast.error("Error al capturar el organigrama. Inténtalo de nuevo.");
    } finally {
      setCapturing(false);
    }
  };

  if (!clienteId) return <NoClientSelected />;
  if (loading) return <LoadingSpinner />;

  // ── MODO LISTADO — DocumentViewer estándar ────────────────────────────────────
  if (viewMode) {
    return (
      <DocumentViewer
        title="Organigrama"
        clienteNombre={clienteNombre}
        onClose={() => setViewMode(false)}
        mdContent={generateMd(nodes, clienteNombre)}
        mdFilename={makeMdFilename("organigrama", clienteNombre)}
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

  // ── MODO EDICIÓN — React Flow ──────────────────────────────────────────────────
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
          <Button size="sm" variant="outline" onClick={() => setViewMode(true)}>
            <List className="h-4 w-4 mr-1.5" /> Ver listado
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrintVisual} disabled={capturing}>
            <Printer className="h-4 w-4 mr-1.5" />
            {capturing ? "Capturando…" : "Imprimir visual"}
          </Button>
          <Button size="sm" variant="outline" onClick={addNode}><Plus className="h-4 w-4 mr-1.5" /> Añadir caja</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-1.5" /> Guardar</Button>
        </div>
      </div>

      {/* Contenedor con ref para html2canvas */}
      <div ref={flowContainerRef} className="flex-1 rounded-lg border border-border overflow-hidden">
        <ReactFlow
          nodes={nodesWithCbs} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.3 }}
          onInit={(instance) => { rfInstanceRef.current = instance; }}
          className="bg-white"
        >
          <Background gap={16} size={1} className="opacity-30" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
