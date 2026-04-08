

## Analysis

Looking at the network requests and database data, I found the root causes:

1. **Data IS being saved** to `respuestas_auditoria` (4 rows exist). The saving works.
2. **Data is NOT being loaded back** -- there's no fetch of existing answers when the user returns. `AuditContext` starts with empty `answers: {}`.
3. **`empresa_nombre_directo` is NULL** for both users. Race condition: `syncUser` in `useAuth.ts` creates the `usuarios_cliente` row (without empresa) before `Auth.tsx` can insert it (with empresa), causing a 409 duplicate key error on the second insert.
4. **No save confirmation** -- user has no feedback that data was persisted.

## Plan

### Step 1: Fix race condition in registration (Auth.tsx + useAuth.ts)

- In `Auth.tsx`: use `upsert` instead of `insert` for `usuarios_cliente` so it updates the existing row with `cliente_id` and `empresa_nombre_directo` even if `syncUser` created it first.
- In `useAuth.ts`: use `.maybeSingle()` instead of `.single()` to avoid 406 errors.

### Step 2: Load existing answers on login (AuditContext.tsx)

- Add a `loadAnswers` function that fetches all rows from `respuestas_auditoria` where `usuario_id = userId`.
- Call it when `userId` is set. Populate the `answers` state with the fetched data.
- This ensures returning users see their previous responses.

### Step 3: Add save confirmation toast (AuditContext.tsx)

- After a successful upsert, show a subtle toast: "Guardado correctamente".
- On error, show a destructive toast with the error message.

### Step 4: Fix Admin dashboard empresa display (Admin.tsx)

- Already fetches `empresa_nombre_directo`. The issue is the data is NULL. Step 1 fixes future registrations.
- For existing users, propose a data fix (SQL update) to backfill from the `clientes` table.

### Step 5: RLS simplification (database migration)

- Replace individual INSERT/UPDATE policies on `usuarios_cliente` and `respuestas_auditoria` with a single `FOR ALL` policy per table for authenticated users, removing restrictions temporarily.

### Files to modify
- `src/contexts/AuditContext.tsx` -- add answer loading + save toast
- `src/hooks/useAuth.ts` -- fix `.single()` to `.maybeSingle()`
- `src/pages/Auth.tsx` -- use upsert for usuarios_cliente
- `src/pages/Admin.tsx` -- minor: fallback display logic
- Database migration: simplify RLS policies
- Data fix: update existing NULL `empresa_nombre_directo` values

