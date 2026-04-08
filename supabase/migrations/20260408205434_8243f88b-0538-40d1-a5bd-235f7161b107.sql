
-- Drop all existing individual policies on usuarios_cliente
DROP POLICY IF EXISTS "Authenticated can view all users" ON public.usuarios_cliente;
DROP POLICY IF EXISTS "Users can insert own record" ON public.usuarios_cliente;
DROP POLICY IF EXISTS "Users can update own record" ON public.usuarios_cliente;

-- Single FOR ALL policy
CREATE POLICY "Authenticated full access usuarios_cliente"
  ON public.usuarios_cliente FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Drop all existing individual policies on respuestas_auditoria
DROP POLICY IF EXISTS "Authenticated can view all answers" ON public.respuestas_auditoria;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.respuestas_auditoria;
DROP POLICY IF EXISTS "Users can update own answers" ON public.respuestas_auditoria;

-- Single FOR ALL policy
CREATE POLICY "Authenticated full access respuestas_auditoria"
  ON public.respuestas_auditoria FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
