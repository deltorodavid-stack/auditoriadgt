-- Add direct company name column to usuarios_cliente
ALTER TABLE public.usuarios_cliente ADD COLUMN IF NOT EXISTS empresa_nombre_directo text;

-- Allow authenticated users to insert into clientes
CREATE POLICY "Authenticated can insert clients" ON public.clientes
  FOR INSERT TO authenticated WITH CHECK (true);