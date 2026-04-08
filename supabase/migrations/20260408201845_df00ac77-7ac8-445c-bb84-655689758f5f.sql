
-- Enable RLS
ALTER TABLE public.usuarios_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- usuarios_cliente policies
CREATE POLICY "Users can view own record" ON public.usuarios_cliente
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert own record" ON public.usuarios_cliente
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own record" ON public.usuarios_cliente
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- respuestas_auditoria policies
CREATE POLICY "Users can view own answers" ON public.respuestas_auditoria
  FOR SELECT TO authenticated USING (usuario_id = auth.uid());

CREATE POLICY "Users can insert own answers" ON public.respuestas_auditoria
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Users can update own answers" ON public.respuestas_auditoria
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

-- clientes: allow authenticated users to read
CREATE POLICY "Authenticated can view clients" ON public.clientes
  FOR SELECT TO authenticated USING (true);
