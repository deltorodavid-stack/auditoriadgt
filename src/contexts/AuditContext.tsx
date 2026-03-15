import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { UsuarioCliente } from "@/hooks/useTokenAuth";

interface AuditContextType {
  currentBlock: number;
  setCurrentBlock: (block: number) => void;
  started: boolean;
  setStarted: (v: boolean) => void;
  usuario: UsuarioCliente | null;
  setUsuario: (u: UsuarioCliente | null) => void;
  answers: Record<string, string>;
  saveAnswer: (preguntaId: string, valor: string) => void;
  completedBlocks: Set<number>;
  markBlockComplete: (block: number) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [started, setStarted] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioCliente | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const upsertAnswer = useCallback(async (preguntaId: string, valor: string, userId: string) => {
    await supabase.from("respuestas_auditoria").upsert(
      { usuario_cliente_id: userId, pregunta_id: preguntaId, respuesta: valor },
      { onConflict: "usuario_cliente_id,pregunta_id" }
    );
  }, []);

  const saveAnswer = useCallback((preguntaId: string, valor: string) => {
    setAnswers((prev) => ({ ...prev, [preguntaId]: valor }));

    // Debounce 2s
    if (debounceTimers.current[preguntaId]) {
      clearTimeout(debounceTimers.current[preguntaId]);
    }
    debounceTimers.current[preguntaId] = setTimeout(() => {
      if (usuario) {
        upsertAnswer(preguntaId, valor, usuario.id);
      }
    }, 2000);
  }, [usuario, upsertAnswer]);

  const markBlockComplete = useCallback((block: number) => {
    setCompletedBlocks((prev) => new Set(prev).add(block));
  }, []);

  return (
    <AuditContext.Provider
      value={{
        currentBlock, setCurrentBlock,
        started, setStarted,
        usuario, setUsuario,
        answers, saveAnswer,
        completedBlocks, markBlockComplete,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used within AuditProvider");
  return ctx;
}
