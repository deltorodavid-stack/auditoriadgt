-- ============================================================
-- NUEVAS TABLAS: evaluaciones_eos + plantillas
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- 1. Evaluaciones EOS ----------------------------------------
create table if not exists public.evaluaciones_eos (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  respuestas jsonb not null default '{}',
  puntuacion integer,
  created_at timestamptz default now()
);

alter table public.evaluaciones_eos enable row level security;

create policy "Authenticated users can manage evaluaciones_eos"
  on public.evaluaciones_eos for all
  to authenticated
  using (true)
  with check (true);

-- 2. Plantillas ----------------------------------------------
-- Una fila por (cliente_id, tipo). El campo "datos" guarda toda la estructura en JSON.
-- Tipos: 'vision', 'reunion_semanal', 'reunion_trimestral', 'reunion_anual',
--        'rocas', 'asuntos', 'personas', 'indicadores', 'organigrama'

create table if not exists public.plantillas (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete cascade,
  tipo       text not null,
  datos      jsonb not null default '{}',
  updated_at timestamptz default now()
);

create unique index if not exists plantillas_cliente_tipo_unique
  on public.plantillas(cliente_id, tipo);

alter table public.plantillas enable row level security;

create policy "Authenticated users can manage plantillas"
  on public.plantillas for all
  to authenticated
  using (true)
  with check (true);
