import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";

// ── Estilos con !important inyectados como <style> ─────────────────────────────
const DV_STYLES = `
  .dv-field-value {
    font-size: 12px !important;
    font-family: 'Calibri', 'Arial', sans-serif !important;
    line-height: 1.6 !important;
    white-space: pre-wrap !important;
    color: #111 !important;
  }
  .dv-list-wrap {
    font-size: 12px !important;
    color: #111 !important;
    line-height: 1.8 !important;
    font-family: 'Calibri', 'Arial', sans-serif !important;
  }
  .dv-item-main {
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #111 !important;
    margin: 0 !important;
  }
  .dv-item-meta {
    font-size: 11px !important;
    color: #999 !important;
    margin: 1px 0 0 0 !important;
  }
  .dv-row-text {
    font-size: 12px !important;
    color: #374151 !important;
    font-family: 'Calibri', 'Arial', sans-serif !important;
    margin-right: 20px !important;
  }
`;

// ── Utilidades ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeMdFilename(tipo: string, clienteNombre: string, date?: string): string {
  const today = date || new Date().toISOString().split("T")[0];
  return `${tipo}-${slugify(clienteNombre)}-${today}.md`;
}

export function downloadMd(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── DocSection / DocField — componentes de sección para el viewer ──────────────

export function DocSection({ label, children }: { label: string; children: React.ReactNode }) {
  const hasContent = React.Children.toArray(children).some(Boolean);
  if (!hasContent) return null;
  return (
    <div style={{ marginTop: "24px", marginBottom: "4px" }}>
      <div style={{
        fontSize: "13px", fontWeight: "700", textTransform: "uppercase" as const,
        letterSpacing: "0.08em", color: "#1E40AF",
        paddingBottom: "4px", borderBottom: "1.5px solid #1E40AF", marginBottom: "12px",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function DocField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "12px" }}>
      {label && (
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
          {label}
        </div>
      )}
      <div className="dv-field-value">{value}</div>
    </div>
  );
}

export function DocList({ items, numbered = true }: { items: string[]; numbered?: boolean }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <div className="dv-list-wrap">
      {filtered.map((item, i) => (
        <div key={i}>{numbered ? `${i + 1}. ` : "• "}{item}</div>
      ))}
    </div>
  );
}

export function DocItem({ texto, responsable, fecha }: { texto: string; responsable?: string; fecha?: string }) {
  if (!texto) return null;
  const meta = [responsable, fecha].filter(Boolean).join(" · ");
  return (
    <div style={{ marginBottom: "8px" }}>
      <p className="dv-item-main">{texto}</p>
      {meta && <p className="dv-item-meta">{meta}</p>}
    </div>
  );
}

export function DocRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <span className="dv-row-text">
      <strong>{label}:</strong> {value}
    </span>
  );
}

// ── DocumentViewer — vista limpia con toolbar de impresión y descarga ──────────

interface DocumentViewerProps {
  title: string;
  clienteNombre: string;
  date?: string;
  onClose: () => void;
  mdContent: string;
  mdFilename: string;
  children: React.ReactNode;
  /** Botones extra en la toolbar (ej: modos de impresión alternativos) */
  extraToolbar?: React.ReactNode;
}

export function DocumentViewer({
  title, clienteNombre, date, onClose, mdContent, mdFilename, children, extraToolbar,
}: DocumentViewerProps) {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "dv-page-orientation";
    style.textContent = `@page { size: A4 ${orientation}; margin: 1.5cm; }`;
    document.head.appendChild(style);
    window.print();
    window.addEventListener("afterprint", () => {
      document.getElementById("dv-page-orientation")?.remove();
    }, { once: true });
  };

  return (
    <div>
      {/* Estilos !important para texto del usuario */}
      <style>{DV_STYLES}</style>

      {/* ── Toolbar (oculto al imprimir) ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a editar
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Orientación */}
          <div className="flex overflow-hidden rounded border border-border">
            <button
              onClick={() => setOrientation("portrait")}
              className={`px-2.5 py-1 text-xs transition-colors ${orientation === "portrait" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              ↕ Vertical
            </button>
            <button
              onClick={() => setOrientation("landscape")}
              className={`border-l border-border px-2.5 py-1 text-xs transition-colors ${orientation === "landscape" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              ↔ Horizontal
            </button>
          </div>

          <span className="hidden text-xs text-muted-foreground sm:block">
            Desactiva «Encabezados y pies» al imprimir
          </span>

          {/* Botones extra (ej: Organigrama visual) */}
          {extraToolbar}

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadMd(mdFilename, mdContent)}>
            <Download className="h-4 w-4 mr-1.5" /> Descargar .md
          </Button>
        </div>
      </div>

      {/* ── Documento ── */}
      <div
        className="bg-white rounded-lg border border-border/50 p-8 max-w-3xl"
        style={{ fontFamily: "'Inter', sans-serif", color: "#111827" }}
      >
        {/* Cabecera con logo — una sola vez */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "14px",
          paddingBottom: "16px", borderBottom: "2px solid #e5e7eb", marginBottom: "24px",
        }}>
          <img
            src="/images/logo-david-del-toro.png"
            alt=""
            style={{ maxHeight: "40px", width: "auto", flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: "13px", fontWeight: "400", color: "#666", marginBottom: "2px" }}>
              {clienteNombre}
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#111" }}>{title}</div>
            {date && (
              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{date}</div>
            )}
          </div>
        </div>

        {/* Contenido del documento */}
        {children}
      </div>
    </div>
  );
}
