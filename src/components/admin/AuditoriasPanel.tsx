import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AUDIT_BLOCKS } from "@/data/auditQuestions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileDown, Eye, Download } from "lucide-react";
import { downloadMd, makeMdFilename } from "@/components/ui/DocumentViewer";

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

const TOTAL_QUESTIONS = AUDIT_BLOCKS.reduce(
  (sum, b) => sum + b.questions.length,
  0
);

interface Props {
  selectedClientId: string | null;
}

export function AuditoriasPanel({ selectedClientId }: Props) {
  const [users, setUsers] = useState<AuditUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuditUser | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedClientId]);

  async function fetchData() {
    setLoading(true);

    let usuariosQuery = supabase
      .from("usuarios_cliente")
      .select(
        "id, nombre_usuario, email, finalizado, ultimo_bloque_completado, created_at, cliente_id, empresa_nombre_directo"
      );

    if (selectedClientId) {
      usuariosQuery = usuariosQuery.eq("cliente_id", selectedClientId);
    }

    const { data: usuarios } = await usuariosQuery;
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nombre_empresa");
    const { data: respuestas } = await supabase
      .from("respuestas_auditoria")
      .select("usuario_id, pregunta_id, respuesta, updated_at");

    const clientMap = new Map(
      (clientes || []).map((c) => [c.id, c.nombre_empresa])
    );

    const merged: AuditUser[] = (usuarios || []).map((u) => {
      const userResp = (respuestas || []).filter((r) => r.usuario_id === u.id);
      const respMap: Record<string, string> = {};
      let lastUp: string | null = null;
      userResp.forEach((r) => {
        if (r.respuesta) respMap[r.pregunta_id] = r.respuesta;
        if (r.updated_at && (!lastUp || r.updated_at > lastUp))
          lastUp = r.updated_at;
      });
      return {
        id: u.id,
        nombre_usuario: u.nombre_usuario,
        email: u.email,
        finalizado: u.finalizado,
        ultimo_bloque_completado: u.ultimo_bloque_completado,
        created_at: u.created_at,
        cliente_nombre:
          u.empresa_nombre_directo ||
          (u.cliente_id ? clientMap.get(u.cliente_id) || null : null),
        respuestas: respMap,
        last_updated: lastUp || u.created_at,
      };
    });

    setUsers(merged);
    setLoading(false);
  }

  function getProgress(user: AuditUser) {
    return Math.round(
      (Object.keys(user.respuestas).length / TOTAL_QUESTIONS) * 100
    );
  }

  function handleExportPDF(user: AuditUser) {
    setSelectedUser(user);
    setTimeout(() => window.print(), 300);
  }

  function generateMd(user: AuditUser): string {
    const empresa = user.cliente_nombre || "Sin empresa";
    const lines: string[] = [`# Auditoría — ${empresa}`, ""];
    for (const block of AUDIT_BLOCKS) {
      lines.push(`## Bloque ${block.number}: ${block.title}`, "");
      for (const q of block.questions) {
        const resp = user.respuestas[q.id]?.trim();
        lines.push(`**${q.label}**`, resp || "_Sin respuesta_", "");
      }
    }
    return lines.join("\n");
  }

  function handleDownloadMd(user: AuditUser) {
    const empresa = user.cliente_nombre || "auditoria";
    downloadMd(makeMdFilename("auditoria", empresa), generateMd(user));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-display font-bold text-foreground">
        Auditorías
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {users.length} usuario(s) registrado(s)
        {selectedClientId ? " para este cliente" : ""}
      </p>

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
            {users.map((u) => {
              const progress = getProgress(u);
              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedUser(u)}
                >
                  <TableCell className="font-medium">
                    {u.cliente_nombre || "—"}
                  </TableCell>
                  <TableCell>{u.nombre_usuario || u.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 w-24" />
                      <span className="text-xs text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.finalizado ? (
                      <Badge className="bg-secondary text-primary hover:bg-secondary">
                        Finalizada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">En proceso</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.last_updated
                      ? new Date(u.last_updated).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPDF(u)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No hay auditorías registradas aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto print:max-w-none print:shadow-none">
          <DialogHeader>
            <DialogTitle className="font-display">
              Respuestas de{" "}
              {selectedUser?.nombre_usuario || selectedUser?.email || "Usuario"}
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
                      <div
                        key={q.id}
                        className="rounded-md border border-border bg-background p-4"
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {q.label}
                        </p>
                        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                          {selectedUser.respuestas[q.id] || (
                            <span className="italic text-muted-foreground/60">
                              Sin respuesta
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 border-t border-border pt-4 print:hidden">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadMd(selectedUser)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar .md
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportPDF(selectedUser)}
                >
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
