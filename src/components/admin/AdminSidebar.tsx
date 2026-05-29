import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { AdminSection } from "@/types/admin";

interface Cliente {
  id: string;
  nombre_empresa: string;
}

interface Props {
  activeSection: AdminSection;
  onSectionChange: (s: AdminSection) => void;
  selectedClientId: string | null;
  onClientChange: (id: string | null, name: string) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const PLANTILLAS: { key: AdminSection; label: string }[] = [
  { key: "plantilla_vision", label: "V/TO — Visión" },
  { key: "plantilla_reunion_semanal", label: "Reunión Semanal" },
  { key: "plantilla_reunion_trimestral", label: "Reunión Trimestral" },
  { key: "plantilla_reunion_anual", label: "Reunión Anual" },
  { key: "plantilla_rocas", label: "Rocas" },
  { key: "plantilla_asuntos", label: "Asuntos" },
  { key: "plantilla_personas", label: "Analizador de Personas" },
  { key: "plantilla_indicadores", label: "Indicadores" },
  { key: "plantilla_organigrama", label: "Organigrama" },
];

export function AdminSidebar({
  activeSection,
  onSectionChange,
  selectedClientId,
  onClientChange,
  mobileOpen = false,
  onClose,
}: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [plantillasOpen, setPlantillasOpen] = useState(
    activeSection.startsWith("plantilla_")
  );

  useEffect(() => {
    supabase
      .from("clientes")
      .select("id, nombre_empresa")
      .order("nombre_empresa")
      .then(({ data }) => {
        if (data) setClientes(data);
      });
  }, []);

  // Auto-expand plantillas submenu when a plantilla is active
  useEffect(() => {
    if (activeSection.startsWith("plantilla_")) setPlantillasOpen(true);
  }, [activeSection]);

  const navItem = (
    key: AdminSection,
    label: string,
    icon: React.ReactNode
  ) => {
    const isActive = activeSection === key;
    return (
      <button
        key={key}
        onClick={() => {
          onSectionChange(key);
          onClose?.();
        }}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
          isActive
            ? "bg-sidebar-accent font-medium text-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`print:hidden fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <img
              src="/images/logo-david-del-toro.png"
              alt="David Del Toro"
              className="mb-3 h-auto"
              style={{ maxHeight: "50px" }}
            />
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Panel de Administración
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden -mr-2 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Client selector */}
        <div className="border-b border-border px-4 py-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Cliente activo
          </p>
          <Select
            value={selectedClientId ?? "__todos__"}
            onValueChange={(val) => {
              if (val === "__todos__") {
                onClientChange(null, "");
              } else {
                const c = clientes.find((c) => c.id === val);
                onClientChange(val, c?.nombre_empresa ?? "");
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Seleccionar cliente…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">— Todos —</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre_empresa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItem(
            "auditorias",
            "Auditorías",
            <ClipboardList className="h-4 w-4 shrink-0" />
          )}

          {navItem(
            "eos_eval",
            "Evaluación EOS",
            <LayoutDashboard className="h-4 w-4 shrink-0" />
          )}

          {/* Plantillas EOS group */}
          <div>
            <button
              onClick={() => setPlantillasOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="flex-1">Plantillas EOS</span>
              {plantillasOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>

            {plantillasOpen && (
              <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                {PLANTILLAS.map(({ key, label }) => {
                  const isActive = activeSection === key;
                  return (
                    <li key={key}>
                      <button
                        onClick={() => {
                          onSectionChange(key);
                          onClose?.();
                        }}
                        className={`w-full rounded-md px-2 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-sidebar-accent font-medium text-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
