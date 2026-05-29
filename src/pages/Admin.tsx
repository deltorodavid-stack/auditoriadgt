import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuditoriasPanel } from "@/components/admin/AuditoriasPanel";
import { EosEvaluation } from "@/components/eos/EosEvaluation";
import { VisionVTO } from "@/components/eos/templates/VisionVTO";
import { ReunionSemanal } from "@/components/eos/templates/ReunionSemanal";
import { ReunionTrimestral } from "@/components/eos/templates/ReunionTrimestral";
import { ReunionAnual } from "@/components/eos/templates/ReunionAnual";
import { Rocas } from "@/components/eos/templates/Rocas";
import { Asuntos } from "@/components/eos/templates/Asuntos";
import { AnalizadorPersonas } from "@/components/eos/templates/AnalizadorPersonas";
import { Indicadores } from "@/components/eos/templates/Indicadores";
import { Organigrama } from "@/components/eos/templates/Organigrama";
import { Loader2 } from "lucide-react";
import Auth from "./Auth";

import type { AdminSection } from "@/types/admin";

export default function Admin() {
  const { loading: authLoading, user } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("auditorias");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Auth />;

  const clienteProps = { clienteId: selectedClientId, clienteNombre: selectedClientName };

  function renderContent() {
    switch (activeSection) {
      case "auditorias":
        return <AuditoriasPanel selectedClientId={selectedClientId} />;
      case "eos_eval":
        return <EosEvaluation {...clienteProps} />;
      case "plantilla_vision":
        return <VisionVTO {...clienteProps} />;
      case "plantilla_reunion_semanal":
        return <ReunionSemanal {...clienteProps} />;
      case "plantilla_reunion_trimestral":
        return <ReunionTrimestral {...clienteProps} />;
      case "plantilla_reunion_anual":
        return <ReunionAnual {...clienteProps} />;
      case "plantilla_rocas":
        return <Rocas {...clienteProps} />;
      case "plantilla_asuntos":
        return <Asuntos {...clienteProps} />;
      case "plantilla_personas":
        return <AnalizadorPersonas {...clienteProps} />;
      case "plantilla_indicadores":
        return <Indicadores {...clienteProps} />;
      case "plantilla_organigrama":
        return <Organigrama {...clienteProps} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        selectedClientId={selectedClientId}
        onClientChange={(id, name) => {
          setSelectedClientId(id);
          setSelectedClientName(name);
        }}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="-ml-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img
            src="/images/logo-david-del-toro.png"
            alt="Logo"
            className="h-auto"
            style={{ maxHeight: "32px" }}
          />
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
