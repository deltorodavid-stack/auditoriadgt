import { useAuth } from "@/hooks/useAuth";
import { AuditProvider, useAudit } from "@/contexts/AuditContext";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { AuditWorkspace } from "@/components/AuditWorkspace";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import Auth from "./Auth";

function AuditApp() {
  const { loading, user } = useAuth();
  const { started, setUserId } = useAudit();

  useEffect(() => {
    if (user) setUserId(user.id);
  }, [user, setUserId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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
