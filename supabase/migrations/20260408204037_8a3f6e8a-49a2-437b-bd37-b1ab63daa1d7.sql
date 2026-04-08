-- Drop restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view own record" ON public.usuarios_cliente;
DROP POLICY IF EXISTS "Users can view own answers" ON public.respuestas_auditoria;

-- Allow all authenticated users to read all records (admin dashboard needs this)
CREATE POLICY "Authenticated can view all users" ON public.usuarios_cliente
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can view all answers" ON public.respuestas_auditoria
  FOR SELECT TO authenticated USING (true);