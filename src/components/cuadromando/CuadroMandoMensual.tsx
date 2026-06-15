import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CuadroMandoData, BloqueKey, Categoria, Concepto, CategoriaTipo,
  ConceptoPersonal, ConceptoSimple,
  categoriaTotal, calcularTotales, newConcepto, uid, eur, num,
} from "./lib";

// ── Fila de concepto (sortable) ──────────────────────────────────────────────────
function SortableConcepto({ concepto, tipo, onUpdate, onRemove }: {
  concepto: Concepto;
  tipo: CategoriaTipo;
  onUpdate: (patch: Partial<ConceptoPersonal & ConceptoSimple>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: concepto.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const grip = (
    <button {...attributes} {...listeners}
      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0">
      <GripVertical className="h-3.5 w-3.5" />
    </button>
  );
  const del = (
    <button onClick={onRemove} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  if (tipo === "personal") {
    const p = concepto as ConceptoPersonal;
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 group">
        {grip}
        <Input value={p.nombre} onChange={(e) => onUpdate({ nombre: e.target.value })} placeholder="Nombre" className="h-7 flex-1 min-w-[120px] text-xs" />
        <Input value={p.salario} onChange={(e) => onUpdate({ salario: e.target.value })} placeholder="Salario" inputMode="decimal" className="h-7 w-24 text-xs text-right" />
        <Input value={p.ss} onChange={(e) => onUpdate({ ss: e.target.value })} placeholder="SS" inputMode="decimal" className="h-7 w-24 text-xs text-right" />
        <Input value={p.pias} onChange={(e) => onUpdate({ pias: e.target.value })} placeholder="PIAS" inputMode="decimal" className="h-7 w-24 text-xs text-right" />
        <Input value={p.salud} onChange={(e) => onUpdate({ salud: e.target.value })} placeholder="Salud" inputMode="decimal" className="h-7 w-24 text-xs text-right" />
        <span className="w-24 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
          {eur(num(p.salario) + num(p.ss) + num(p.pias) + num(p.salud))}
        </span>
        {del}
      </div>
    );
  }

  const s = concepto as ConceptoSimple;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 group">
      {grip}
      <Input value={s.descripcion} onChange={(e) => onUpdate({ descripcion: e.target.value })} placeholder="Descripción" className="h-7 flex-1 text-xs" />
      <Input value={s.importe} onChange={(e) => onUpdate({ importe: e.target.value })} placeholder="Importe" inputMode="decimal" className="h-7 w-28 text-xs text-right" />
      {del}
    </div>
  );
}

// ── Categoría (acordeón) ──────────────────────────────────────────────────────────
function CategoriaPanel({ categoria, onChange, onRemove }: {
  categoria: Categoria;
  onChange: (next: Categoria) => void;
  onRemove: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const total = categoriaTotal(categoria);

  const updateConcepto = (id: string, patch: Partial<ConceptoPersonal & ConceptoSimple>) =>
    onChange({ ...categoria, conceptos: categoria.conceptos.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const removeConcepto = (id: string) =>
    onChange({ ...categoria, conceptos: categoria.conceptos.filter((c) => c.id !== id) });
  const addConcepto = () =>
    onChange({ ...categoria, conceptos: [...categoria.conceptos, newConcepto(categoria.tipo)] });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldI = categoria.conceptos.findIndex((c) => c.id === active.id);
      const newI = categoria.conceptos.findIndex((c) => c.id === over.id);
      onChange({ ...categoria, conceptos: arrayMove(categoria.conceptos, oldI, newI) });
    }
  };

  return (
    <AccordionItem value={categoria.id} className="border border-border rounded-lg mb-2 overflow-hidden bg-card">
      <div className="flex items-center gap-2 px-3">
        <AccordionTrigger className="flex-1 py-2.5 hover:no-underline">
          <div className="flex flex-1 items-center justify-between pr-3">
            <Input
              value={categoria.categoria}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onChange({ ...categoria, categoria: e.target.value })}
              className="h-7 w-auto max-w-[260px] border-0 bg-transparent px-0 text-sm font-semibold focus-visible:ring-0 shadow-none"
            />
            <span className="text-sm font-semibold tabular-nums text-primary">{eur(total)}</span>
          </div>
        </AccordionTrigger>
        <button onClick={() => setConfirmDel(true)} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0" title="Eliminar categoría">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <AccordionContent className="px-3 pb-3">
        {categoria.tipo === "personal" && categoria.conceptos.length > 0 && (
          <div className="flex items-center gap-2 px-[22px] pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span className="flex-1 min-w-[120px]">Nombre</span>
            <span className="w-24 text-right">Salario</span>
            <span className="w-24 text-right">SS</span>
            <span className="w-24 text-right">PIAS</span>
            <span className="w-24 text-right">Salud</span>
            <span className="w-24 text-right">Total</span>
            <span className="w-3.5" />
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categoria.conceptos.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categoria.conceptos.map((c) => (
              <SortableConcepto
                key={c.id} concepto={c} tipo={categoria.tipo}
                onUpdate={(patch) => updateConcepto(c.id, patch)}
                onRemove={() => removeConcepto(c.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {categoria.conceptos.length === 0 && (
          <p className="py-2 text-xs text-muted-foreground">Sin conceptos. Añade el primero.</p>
        )}

        <Button size="sm" variant="ghost" onClick={addConcepto} className="mt-1 h-7 text-xs text-primary">
          <Plus className="h-3.5 w-3.5 mr-1" /> Añadir concepto
        </Button>
      </AccordionContent>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoría «{categoria.categoria}»</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos sus conceptos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccordionItem>
  );
}

// ── Bloque (sección con varias categorías) ───────────────────────────────────────
function Bloque({ titulo, total, categorias, onChange, allowPersonal }: {
  titulo: string;
  total: number;
  categorias: Categoria[];
  onChange: (next: Categoria[]) => void;
  allowPersonal?: boolean;
}) {
  const updateCat = (id: string, next: Categoria) => onChange(categorias.map((c) => c.id === id ? next : c));
  const removeCat = (id: string) => onChange(categorias.filter((c) => c.id !== id));
  const addCat = (tipo: CategoriaTipo) =>
    onChange([...categorias, { id: uid(), categoria: "Nueva categoría", tipo, conceptos: [] }]);

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">{titulo}</h3>
        <span className="text-sm font-bold tabular-nums text-foreground">{eur(total)}</span>
      </div>

      <Accordion type="multiple" className="w-full">
        {categorias.map((c) => (
          <CategoriaPanel key={c.id} categoria={c}
            onChange={(next) => updateCat(c.id, next)}
            onRemove={() => removeCat(c.id)} />
        ))}
      </Accordion>

      <div className="mt-1 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => addCat("simple")} className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Categoría
        </Button>
        {allowPersonal && (
          <Button size="sm" variant="outline" onClick={() => addCat("personal")} className="h-7 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Categoría (Personal)
          </Button>
        )}
      </div>
    </section>
  );
}

// ── Vista mensual completa ────────────────────────────────────────────────────────
interface Props {
  data: CuadroMandoData;
  umbral: number;
  onDataChange: (d: CuadroMandoData) => void;
  onUmbralChange: (u: number) => void;
}

export function CuadroMandoMensual({ data, umbral, onDataChange, onUmbralChange }: Props) {
  const t = calcularTotales(data, umbral);
  const setBloque = (key: BloqueKey, next: Categoria[]) => onDataChange({ ...data, [key]: next });

  const resultadoTone =
    t.resultado > 0 && t.diffUmbral >= 0 ? "ok"
      : t.resultado >= 0 ? "warn"
      : "bad";
  const toneClasses: Record<string, string> = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div>
      {/* Panel resumen */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <SummaryCard label="Total gastos" value={eur(t.gastosTotal)} />
        <SummaryCard label="Total ingresos" value={eur(t.ingresosTotal)} />
        <div className={`rounded-lg border px-3 py-2.5 ${toneClasses[resultadoTone]}`}>
          <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">Resultado del mes</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{eur(t.resultado)}</p>
          <p className="text-[11px] opacity-80">Margen {t.margen.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Umbral rentabilidad</p>
          <div className="mt-0.5 flex items-center gap-1">
            <Input
              value={umbral || ""}
              onChange={(e) => onUmbralChange(num(e.target.value))}
              placeholder="0"
              inputMode="decimal"
              className="h-7 text-sm font-semibold tabular-nums"
            />
            <span className="text-xs text-muted-foreground">€</span>
          </div>
          <p className={`mt-0.5 text-[11px] tabular-nums ${t.diffUmbral >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {t.diffUmbral >= 0 ? "+" : ""}{eur(t.diffUmbral)} vs umbral
          </p>
        </div>
      </div>

      <Bloque titulo="Gastos Fijos" total={t.gastosFijos} categorias={data.gastos_fijos}
        onChange={(n) => setBloque("gastos_fijos", n)} allowPersonal />
      <Bloque titulo="Gastos Variables" total={t.gastosVariables} categorias={data.gastos_variables}
        onChange={(n) => setBloque("gastos_variables", n)} />
      <Bloque titulo="Ingresos Fijos" total={t.ingresosFijos} categorias={data.ingresos_fijos}
        onChange={(n) => setBloque("ingresos_fijos", n)} />
      <Bloque titulo="Ingresos Variables" total={t.ingresosVariables} categorias={data.ingresos_variables}
        onChange={(n) => setBloque("ingresos_variables", n)} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
