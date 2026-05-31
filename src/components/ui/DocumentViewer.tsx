import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";

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
      <div style={{
        fontSize: "10px", fontWeight: "400", color: "#111",
        fontFamily: "'Calibri', 'Arial', sans-serif",
        lineHeight: "1.6", whiteSpace: "pre-wrap",
      }}>
        {value}
      </div>
    </div>
  );
}

export function DocList({ items, numbered = true }: { items: string[]; numbered?: boolean }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <div style={{ fontSize: "10px", color: "#111", lineHeight: "1.8", fontFamily: "'Calibri', 'Arial', sans-serif" }}>
      {filtered.map((item, i) => (
        <div key={i}>{numbered ? `${i + 1}. ` : "• "}{item}</div>
      ))}
    </div>
  );
}

export function DocRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <span style={{ fontSize: "10px", marginRight: "20px", color: "#374151", fontFamily: "'Calibri', 'Arial', sans-serif" }}>
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
}

export function DocumentViewer({
  title, clienteNombre, date, onClose, mdContent, mdFilename, children,
}: DocumentViewerProps) {
  return (
    <div>
      {/* ── Toolbar (oculto al imprimir) ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a editar
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:block">
            En el diálogo de impresión, desactiva «Encabezados y pies»
          </span>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
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
