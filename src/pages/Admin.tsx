import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AUDIT_BLOCKS } from "@/data/auditQuestions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileDown, ArrowLeft, Eye } from "lucide-react";

interface AuditUser {
  id: string;
  nombre_usuario: string | null;
  email: string | null;
  finalizado: boolean | null;
  ultimo_bloque_completado: number | null;
  created_at: string | null;
  cliente_nombre: string | null;
  respuestas: Record<string, string>;
  last_updated: string | null;
}

// Total questions across all blocks
const TOTAL_QUESTIONS = AUDIT_BLOCKS.reduce((sum, b) => sum + b.questions.length, 0);

export default function Admin() {
  const [users, setUsers] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuditUser | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    // Fetch users with client names
    const { data: usuarios } = await supabase
      .from("usuarios_cliente")
      .select("id, nombre_usuario, email, finalizado, ultimo_bloque_completado, created_at, cliente_id");

    const { data: clientes } = await supabase.from("clientes").select("id, nombre_empresa");

    const { data: respuestas } = await supabase.from("respuestas_auditoria").select("usuario_id, pregunta_id, respuesta, updated_at");

    const clientMap = new Map((clientes || []).map((c) => [c.id, c.nombre_empresa]));

    const merged: AuditUser[] = (usuarios || []).map((u) => {
      const userResp = (respuestas || []).filter((r) => r.usuario_id === u.id);
      const respMap: Record<string, string> = {};
      let lastUp: string | null = null;
      userResp.forEach((r) => {
        if (r.respuesta) respMap[r.pregunta_id] = r.respuesta;
        if (r.updated_at && (!lastUp || r.updated_at > lastUp)) lastUp = r.updated_at;
      });

      return {
        id: u.id,
        nombre_usuario: u.nombre_usuario,
        email: u.email,
        finalizado: u.finalizado,
        ultimo_bloque_completado: u.ultimo_bloque_completado,
        created_at: u.created_at,
        cliente_nombre: u.cliente_id ? clientMap.get(u.cliente_id) || null : null,
        respuestas: respMap,
        last_updated: lastUp || u.created_at,
      };
    });

    setUsers(merged);
    setLoading(false);
  }

  function getProgress(user: AuditUser) {
    const answered = Object.keys(user.respuestas).length;
    return Math.round((answered / TOTAL_QUESTIONS) * 100);
  }

  function handleExportPDF(user: AuditUser) {
    setSelectedUser(user);
    setTimeout(() => window.print(), 300);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo-david-del-toro.png" alt="Logo" className="h-auto max-w-[180px]" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Panel de Administración
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/")}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Volver
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-xl font-display font-bold text-foreground">Auditorías</h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} usuario(s) registrado(s)</p>

        <div className="mt-6 rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const progress = getProgress(user);
                return (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <TableCell className="font-medium">{user.cliente_nombre || "—"}</TableCell>
                    <TableCell>{user.nombre_usuario || user.email || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.finalizado ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Finalizada</Badge>
                      ) : (
                        <Badge variant="secondary">En proceso</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_updated
                        ? new Date(user.last_updated).toLocaleDateString("es-ES", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExportPDF(user)}>
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No hay auditorías registradas aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto print:max-w-none print:shadow-none">
          <DialogHeader>
            <DialogTitle className="font-display">
              Respuestas de {selectedUser?.nombre_usuario || selectedUser?.email || "Usuario"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedUser?.cliente_nombre || "Sin empresa asignada"}
            </p>
          </DialogHeader>

          {selectedUser && (
            <div className="mt-4 space-y-8">
              {AUDIT_BLOCKS.map((block) => (
                <div key={block.number}>
                  <h3 className="text-sm font-display font-semibold text-primary">
                    Bloque {block.number}: {block.title}
                  </h3>
                  <div className="mt-3 space-y-3">
                    {block.questions.map((q) => (
                      <div key={q.id} className="rounded-md border border-border bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">{q.label}</p>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                          {selectedUser.respuestas[q.id] || (
                            <span className="italic text-muted-foreground/60">Sin respuesta</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end border-t border-border pt-4 print:hidden">
                <Button variant="outline" onClick={() => handleExportPDF(selectedUser)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
