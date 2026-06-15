-- ============================================================
-- NUEVA TABLA: cuadros_mando (gastos e ingresos mensuales)
-- Ejecutar en Supabase > SQL Editor
-- No afecta a ninguna tabla existente.
-- ============================================================

create table if not exists public.cuadros_mando (
  id                  uuid primary key default gen_random_uuid(),
  cliente_id          uuid references public.clientes(id) on delete cascade,
  mes                 integer not null check (mes >= 1 and mes <= 12),
  anio                integer not null,
  datos               jsonb not null default '{}',
  umbral_rentabilidad numeric default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (cliente_id, mes, anio)
);

-- Índice para búsquedas por cliente/año (vista anual)
create index if not exists cuadros_mando_cliente_anio_idx
  on public.cuadros_mando(cliente_id, anio);

alter table public.cuadros_mando enable row level security;

create policy "Authenticated users can manage cuadros_mando"
  on public.cuadros_mando for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Estructura del campo datos (jsonb):
-- {
--   "gastos_fijos":       [ { id, categoria, tipo: "personal"|"simple", conceptos: [...] } ],
--   "gastos_variables":   [ { id, categoria, tipo: "simple", conceptos: [...] } ],
--   "ingresos_fijos":     [ { id, categoria, tipo: "simple", conceptos: [...] } ],
--   "ingresos_variables": [ { id, categoria, tipo: "simple", conceptos: [...] } ]
-- }
-- conceptos (tipo personal):  { id, nombre, salario, ss, pias, salud }
-- conceptos (tipo simple):    { id, descripcion, importe }
-- ============================================================
