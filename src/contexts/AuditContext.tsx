import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditContextType {
  currentBlock: number;
  setCurrentBlock: (block: number) => void;
  started: boolean;
  setStarted: (v: boolean) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  answers: Record<string, string>;
  saveAnswer: (preguntaId: string, valor: string) => void;
  completedBlocks: Set<number>;
  markBlockComplete: (block: number) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [started, setStarted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Load existing answers when userId is set
  useEffect(() => {
    if (!userId) return;
    const loadAnswers = async () => {
      const { data, error } = await supabase
        .from("respuestas_auditoria")
        .select("pregunta_id, respuesta")
        .eq("usuario_id", userId);
      if (error) {
        console.error("Error loading answers:", error.message);
        return;
      }
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {};
        data.forEach((row) => {
          if (row.respuesta) loaded[row.pregunta_id] = row.respuesta;
        });
        setAnswers(loaded);
      }
    };
    loadAnswers();
  }, [userId]);

  const upsertAnswer = useCallback(async (preguntaId: string, valor: string, uid: string) => {
    const { error } = await supabase.from("respuestas_auditoria").upsert(
      { usuario_id: uid, pregunta_id: preguntaId, respuesta: valor, bloque_n: currentBlock },
      { onConflict: "usuario_id,pregunta_id" }
    );
    if (error) {
      console.error("Error saving answer:", error.message);
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Guardado correctamente");
    }
  }, [currentBlock]);

  const saveAnswer = useCallback((preguntaId: string, valor: string) => {
    setAnswers((prev) => ({ ...prev, [preguntaId]: valor }));

    if (debounceTimers.current[preguntaId]) {
      clearTimeout(debounceTimers.current[preguntaId]);
    }
    debounceTimers.current[preguntaId] = setTimeout(() => {
      if (userId) {
        upsertAnswer(preguntaId, valor, userId);
      }
    }, 2000);
  }, [userId, upsertAnswer]);

  const markBlockComplete = useCallback((block: number) => {
    setCompletedBlocks((prev) => new Set(prev).add(block));
  }, []);

  return (
    <AuditContext.Provider
      value={{
        currentBlock, setCurrentBlock,
        started, setStarted,
        userId, setUserId,
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
