import React from "react";

// ── PrintLayout ────────────────────────────────────────────────────────────────
// Wraps a clean, print-only document section.
// Add className="print-only" so it hides on screen (@media screen { .print-only { display:none } })
// and appears on print (@media print { .print-only { display:block } }).
//
// Usage in a template:
//   <div className="print:hidden"> { ...interactive UI... } </div>
//   <PrintLayout title="..." clienteNombre={clienteNombre}>
//     <PrintSection label="Valores Medulares"><PrintList items={...} /></PrintSection>
//   </PrintLayout>

interface LayoutProps {
  title: string;
  clienteNombre: string;
  children: React.ReactNode;
  /** Optional date string shown next to the title area */
  date?: string;
}

export function PrintLayout({ title, clienteNombre, date, children }: LayoutProps) {
  return (
    <div className="print-only" style={{ fontFamily: "'Inter', sans-serif", color: "#111827" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          paddingBottom: "14px",
          borderBottom: "2px solid #e5e7eb",
          marginBottom: "22px",
        }}
      >
        <img
          src="/images/logo-david-del-toro.png"
          alt=""
          style={{ maxHeight: "56px", width: "auto", flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginBottom: "2px", letterSpacing: "0.03em" }}>
            {clienteNombre}
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{title}</div>
          {date && (
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{date}</div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {children}
    </div>
  );
}

// ── PrintSection — titled group of fields ────────────────────────────────────
export function PrintSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#1d4ed8",
          paddingBottom: "4px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ── PrintField — label + value ────────────────────────────────────────────────
export function PrintField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: "600", color: "#374151", marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "12px", color: "#1f2937", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
        {value}
      </div>
    </div>
  );
}

// ── PrintList — numbered or bulleted list ─────────────────────────────────────
export function PrintList({ items, numbered = true }: { items: string[]; numbered?: boolean }) {
  const filtered = items.filter(Boolean);
  if (!filtered.length) return null;
  return (
    <div style={{ fontSize: "12px", color: "#1f2937", lineHeight: "1.7" }}>
      {filtered.map((item, i) => (
        <div key={i}>
          {numbered ? `${i + 1}. ` : "• "}
          {item}
        </div>
      ))}
    </div>
  );
}

// ── PrintRow — inline key:value pair ─────────────────────────────────────────
export function PrintRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <span style={{ fontSize: "11px", marginRight: "18px", color: "#374151" }}>
      <strong>{label}:</strong> {value}
    </span>
  );
}
