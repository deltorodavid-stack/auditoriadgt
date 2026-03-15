import { useTokenAuth } from "@/hooks/useTokenAuth";
import { AuditProvider, useAudit } from "@/contexts/AuditContext";
import { AccessDenied } from "@/components/AccessDenied";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AuditWorkspace } from "@/components/AuditWorkspace";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AuditApp() {
  const { loading, error, usuario } = useTokenAuth();
  const { started, setUsuario } = useAudit();

  useEffect(() => {
    if (usuario) setUsuario(usuario);
  }, [usuario, setUsuario]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !usuario) {
    return <AccessDenied message={error || "Token de acceso inválido."} />;
  }

  if (!started) {
    return <WelcomeScreen />;
  }

  return <AuditWorkspace />;
}

export default function Index() {
  return (
    <AuditProvider>
      <AuditApp />
    </AuditProvider>
  );
}
