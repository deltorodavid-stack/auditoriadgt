// ── Tipos y utilidades del Cuadro de Mando ────────────────────────────────────

export type CategoriaTipo = "personal" | "simple";

export interface ConceptoPersonal {
  id: string;
  nombre: string;
  salario: number | string;
  ss: number | string;
  pias: number | string;
  salud: number | string;
}

export interface ConceptoSimple {
  id: string;
  descripcion: string;
  importe: number | string;
}

export type Concepto = ConceptoPersonal | ConceptoSimple;

export interface Categoria {
  id: string;
  categoria: string;
  tipo: CategoriaTipo;
  conceptos: Concepto[];
}

export interface CuadroMandoData {
  gastos_fijos: Categoria[];
  gastos_variables: Categoria[];
  ingresos_fijos: Categoria[];
  ingresos_variables: Categoria[];
}

export type BloqueKey = keyof CuadroMandoData;

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const MESES_CORTO = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ── Identificadores ────────────────────────────────────────────────────────────
export function uid(): string {
  return (crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

function cat(categoria: string, tipo: CategoriaTipo): Categoria {
  return { id: uid(), categoria, tipo, conceptos: [] };
}

// ── Datos por defecto al crear el primer mes ─────────────────────────────────────
export function makeDefaultData(): CuadroMandoData {
  return {
    gastos_fijos: [
      cat("Personal", "personal"),
      cat("Autónomos", "simple"),
      cat("Asesoría", "simple"),
      cat("Socios", "simple"),
      cat("Instalaciones", "simple"),
      cat("Comunicaciones", "simple"),
      cat("Transporte", "simple"),
      cat("Seguros / Ahorros", "simple"),
      cat("Financiación", "simple"),
    ],
    gastos_variables: [
      cat("Banco", "simple"),
      cat("Proveedores", "simple"),
      cat("Impuestos", "simple"),
      cat("Otros", "simple"),
    ],
    ingresos_fijos: [
      cat("Ingresos fijos (trabajos recurrentes)", "simple"),
    ],
    ingresos_variables: [
      cat("Ingresos variables (trabajos puntuales)", "simple"),
    ],
  };
}

// Garantiza que un objeto cargado tenga los 4 bloques (compatibilidad futura)
export function mergeWithDefaults(raw: unknown): CuadroMandoData {
  const base = makeDefaultData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<CuadroMandoData>;
  return {
    gastos_fijos: Array.isArray(r.gastos_fijos) ? r.gastos_fijos : base.gastos_fijos,
    gastos_variables: Array.isArray(r.gastos_variables) ? r.gastos_variables : base.gastos_variables,
    ingresos_fijos: Array.isArray(r.ingresos_fijos) ? r.ingresos_fijos : base.ingresos_fijos,
    ingresos_variables: Array.isArray(r.ingresos_variables) ? r.ingresos_variables : base.ingresos_variables,
  };
}

export function newConcepto(tipo: CategoriaTipo): Concepto {
  return tipo === "personal"
    ? { id: uid(), nombre: "", salario: "", ss: "", pias: "", salud: "" }
    : { id: uid(), descripcion: "", importe: "" };
}

// ── Conversión numérica robusta ──────────────────────────────────────────────────
export function num(v: number | string | undefined | null): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
}

// ── Cálculos ──────────────────────────────────────────────────────────────────────
export function conceptoTotal(c: Concepto, tipo: CategoriaTipo): number {
  if (tipo === "personal") {
    const p = c as ConceptoPersonal;
    return num(p.salario) + num(p.ss) + num(p.pias) + num(p.salud);
  }
  return num((c as ConceptoSimple).importe);
}

export function categoriaTotal(c: Categoria): number {
  return c.conceptos.reduce((s, x) => s + conceptoTotal(x, c.tipo), 0);
}

export function bloqueTotal(block: Categoria[]): number {
  return block.reduce((s, c) => s + categoriaTotal(c), 0);
}

export interface Totales {
  gastosFijos: number;
  gastosVariables: number;
  gastosTotal: number;
  ingresosFijos: number;
  ingresosVariables: number;
  ingresosTotal: number;
  resultado: number;
  margen: number;
  diffUmbral: number;
}

export function calcularTotales(data: CuadroMandoData, umbral: number): Totales {
  const gastosFijos = bloqueTotal(data.gastos_fijos);
  const gastosVariables = bloqueTotal(data.gastos_variables);
  const gastosTotal = gastosFijos + gastosVariables;
  const ingresosFijos = bloqueTotal(data.ingresos_fijos);
  const ingresosVariables = bloqueTotal(data.ingresos_variables);
  const ingresosTotal = ingresosFijos + ingresosVariables;
  const resultado = ingresosTotal - gastosTotal;
  const margen = ingresosTotal > 0 ? (resultado / ingresosTotal) * 100 : 0;
  const diffUmbral = resultado - umbral;
  return {
    gastosFijos, gastosVariables, gastosTotal,
    ingresosFijos, ingresosVariables, ingresosTotal,
    resultado, margen, diffUmbral,
  };
}

// ── Formato moneda ──────────────────────────────────────────────────────────────
const fmtEUR = new Intl.NumberFormat("es-ES", {
  style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
export function eur(n: number): string {
  return fmtEUR.format(n || 0);
}
export function eurShort(n: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(n || 0) + " €";
}
