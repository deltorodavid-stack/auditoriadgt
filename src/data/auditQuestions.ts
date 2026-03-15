export interface AuditQuestion {
  id: string;
  label: string;
  type: "textarea" | "slider" | "free";
}

export interface AuditBlock {
  number: number;
  title: string;
  questions: AuditQuestion[];
}

export const AUDIT_BLOCKS: AuditBlock[] = [
  {
    number: 1,
    title: "Empresa",
    questions: [
      { id: "b1_p1", label: "¿Cuál es la actividad principal de tu empresa?", type: "textarea" },
      { id: "b1_p2", label: "¿Cuántos años lleva operando?", type: "textarea" },
      { id: "b1_p3", label: "¿Cuál es la estructura legal de la empresa?", type: "textarea" },
      { id: "b1_p4", label: "¿Cuántos empleados tiene actualmente?", type: "textarea" },
      { id: "b1_p5", label: "¿Cuál es la misión de tu empresa?", type: "textarea" },
      { id: "b1_p6", label: "¿Cuál es la visión a 5 años?", type: "textarea" },
      { id: "b1_p7", label: "¿Cuáles son los valores fundamentales de la empresa?", type: "textarea" },
      { id: "b1_p8", label: "¿Cuáles son tus principales fortalezas como empresa?", type: "textarea" },
      { id: "b1_p9", label: "¿Cuáles son las mayores debilidades o retos internos?", type: "textarea" },
      { id: "b1_p10", label: "¿Cuáles son las oportunidades que ves en el mercado?", type: "textarea" },
      { id: "b1_p11", label: "¿Cuáles son las amenazas externas que más te preocupan?", type: "textarea" },
      { id: "b1_free", label: "¿Hay algo más que quieras añadir sobre tu empresa?", type: "free" },
    ],
  },
  {
    number: 2,
    title: "Recursos Humanos",
    questions: [
      { id: "b2_p1", label: "¿Cómo está organizado tu organigrama actual?", type: "textarea" },
      { id: "b2_p2", label: "¿Tienes definidas las funciones de cada puesto?", type: "textarea" },
      { id: "b2_p3", label: "¿Cómo es tu proceso de selección y contratación?", type: "textarea" },
      { id: "b2_p4", label: "¿Qué formación o capacitación ofreces a tu equipo?", type: "textarea" },
      { id: "b2_p5", label: "¿Cómo mides el rendimiento de tus empleados?", type: "textarea" },
      { id: "b2_p6", label: "¿Cuál es el nivel de rotación de personal?", type: "textarea" },
      { id: "b2_p7", label: "¿Cómo describirías la cultura interna de la empresa?", type: "textarea" },
      { id: "b2_p8", label: "¿Qué beneficios o incentivos ofreces a tus empleados?", type: "textarea" },
      { id: "b2_free", label: "¿Hay algo más que quieras añadir sobre RRHH?", type: "free" },
    ],
  },
  {
    number: 3,
    title: "Producto / Servicio",
    questions: [
      { id: "b3_p1", label: "¿Cuáles son tus principales productos o servicios?", type: "textarea" },
      { id: "b3_p2", label: "¿Qué te diferencia de la competencia en tu oferta?", type: "textarea" },
      { id: "b3_p3", label: "¿Cuál es tu producto o servicio estrella?", type: "textarea" },
      { id: "b3_p4", label: "¿Cómo estableces tus precios?", type: "textarea" },
      { id: "b3_p5", label: "¿Tienes un proceso de innovación o desarrollo de nuevos productos?", type: "textarea" },
      { id: "b3_p6", label: "¿Cómo garantizas la calidad de lo que ofreces?", type: "textarea" },
      { id: "b3_p7", label: "¿Qué feedback recibes habitualmente de tus clientes?", type: "textarea" },
      { id: "b3_p8", label: "¿Hay productos o servicios que quieras lanzar próximamente?", type: "textarea" },
      { id: "b3_free", label: "¿Hay algo más que quieras añadir sobre tu producto/servicio?", type: "free" },
    ],
  },
  {
    number: 4,
    title: "Ventas",
    questions: [
      { id: "b4_p1", label: "¿Cuál es tu proceso de ventas actual (paso a paso)?", type: "textarea" },
      { id: "b4_p2", label: "¿Qué canales de venta utilizas?", type: "textarea" },
      { id: "b4_p3", label: "¿Cuál es tu tasa de conversión aproximada?", type: "textarea" },
      { id: "b4_p4", label: "¿Cuál es el ticket medio de venta?", type: "textarea" },
      { id: "b4_p5", label: "¿Tienes un CRM implementado? ¿Cuál?", type: "textarea" },
      { id: "b4_p6", label: "¿Cómo gestionas el seguimiento de clientes potenciales?", type: "textarea" },
      { id: "b4_p7", label: "¿Cuáles son tus objetivos de ventas para este año?", type: "textarea" },
      { id: "b4_p8", label: "¿Qué obstáculos encuentras en el proceso de cierre?", type: "textarea" },
      { id: "b4_free", label: "¿Hay algo más que quieras añadir sobre ventas?", type: "free" },
    ],
  },
  {
    number: 5,
    title: "Logística y Operaciones",
    questions: [
      { id: "b5_p1", label: "¿Cómo es tu cadena de suministro o proceso operativo?", type: "textarea" },
      { id: "b5_p2", label: "¿Qué proveedores clave tienes y cómo los gestionas?", type: "textarea" },
      { id: "b5_p3", label: "¿Cómo gestionas el inventario o stock (si aplica)?", type: "textarea" },
      { id: "b5_p4", label: "¿Cuáles son los principales cuellos de botella operativos?", type: "textarea" },
      { id: "b5_p5", label: "¿Qué herramientas o software usas para las operaciones?", type: "textarea" },
      { id: "b5_p6", label: "¿Cómo mides la eficiencia operativa?", type: "textarea" },
      { id: "b5_free", label: "¿Hay algo más que quieras añadir sobre logística?", type: "free" },
    ],
  },
  {
    number: 6,
    title: "Competencia",
    questions: [
      { id: "b6_p1", label: "¿Quiénes son tus 3-5 competidores principales?", type: "textarea" },
      { id: "b6_p2", label: "¿Qué hacen mejor que tú?", type: "textarea" },
      { id: "b6_p3", label: "¿Qué haces tú mejor que ellos?", type: "textarea" },
      { id: "b6_p4", label: "¿Cómo se posicionan en precio respecto a ti?", type: "textarea" },
      { id: "b6_p5", label: "¿Qué estrategias de marketing usan tus competidores?", type: "textarea" },
      { id: "b6_p6", label: "¿Has perdido clientes frente a la competencia? ¿Por qué?", type: "textarea" },
      { id: "b6_p7", label: "¿Hay nichos de mercado que la competencia no está cubriendo?", type: "textarea" },
      { id: "b6_p8", label: "¿Cómo te gustaría diferenciarte aún más?", type: "textarea" },
      { id: "b6_free", label: "¿Hay algo más que quieras añadir sobre la competencia?", type: "free" },
    ],
  },
  {
    number: 7,
    title: "Finanzas",
    questions: [
      { id: "b7_p1", label: "¿Cuál es tu facturación anual aproximada?", type: "textarea" },
      { id: "b7_p2", label: "¿Cuál es tu margen de beneficio neto?", type: "textarea" },
      { id: "b7_p3", label: "¿Tienes un presupuesto anual definido?", type: "textarea" },
      { id: "b7_p4", label: "¿Cómo financias la operación (fondos propios, crédito, inversores)?", type: "textarea" },
      { id: "b7_p5", label: "¿Cuáles son tus costes fijos principales?", type: "textarea" },
      { id: "b7_p6", label: "¿Llevas un control de flujo de caja? ¿Cómo?", type: "textarea" },
      { id: "b7_p7", label: "¿Qué KPIs financieros monitorizas?", type: "textarea" },
      { id: "b7_p8", label: "¿Cuáles son tus objetivos financieros a corto y largo plazo?", type: "textarea" },
      { id: "b7_free", label: "¿Hay algo más que quieras añadir sobre finanzas?", type: "free" },
    ],
  },
  {
    number: 8,
    title: "Sistemas e IA",
    questions: [
      { id: "b8_p1", label: "¿Qué herramientas tecnológicas usas actualmente en el día a día?", type: "textarea" },
      { id: "b8_p2", label: "¿Tienes tu negocio digitalizado? ¿En qué grado?", type: "textarea" },
      { id: "b8_p3", label: "¿Utilizas alguna herramienta de inteligencia artificial?", type: "textarea" },
      { id: "b8_p4", label: "¿Qué procesos te gustaría automatizar?", type: "textarea" },
      { id: "b8_p5", label: "¿Cómo gestionas los datos de tu empresa (clientes, ventas, etc.)?", type: "textarea" },
      { id: "b8_p6", label: "¿Tienes una página web? ¿Está optimizada?", type: "textarea" },
      { id: "b8_free", label: "¿Hay algo más que quieras añadir sobre sistemas e IA?", type: "free" },
    ],
  },
  {
    number: 9,
    title: "Marketing",
    questions: [
      { id: "b9_p1", label: "¿Cuál es tu estrategia de marketing actual?", type: "textarea" },
      { id: "b9_p2", label: "¿Qué canales de marketing utilizas (redes, email, SEO, ads…)?", type: "textarea" },
      { id: "b9_p3", label: "¿Cuál es tu presupuesto mensual de marketing?", type: "textarea" },
      { id: "b9_p4", label: "¿Cómo mides el retorno de tus acciones de marketing?", type: "textarea" },
      { id: "b9_p5", label: "Del 1 al 10, ¿cómo valorarías la presencia de tu marca en el mercado?", type: "slider" },
      { id: "b9_p6", label: "¿Tienes definido tu público objetivo o buyer persona?", type: "textarea" },
      { id: "b9_p7", label: "¿Generas contenido de valor (blog, vídeos, podcasts…)?", type: "textarea" },
      { id: "b9_p8", label: "¿Cuál ha sido tu acción de marketing más exitosa?", type: "textarea" },
      { id: "b9_p9", label: "¿Qué te gustaría mejorar en tu marketing?", type: "textarea" },
      { id: "b9_free", label: "¿Hay algo más que quieras añadir sobre marketing?", type: "free" },
    ],
  },
  {
    number: 10,
    title: "Cierre y Visión Final",
    questions: [
      { id: "b10_p1", label: "¿Cuál es el mayor reto que enfrenta tu empresa ahora mismo?", type: "textarea" },
      { id: "b10_p2", label: "Si pudieras cambiar una sola cosa de tu negocio, ¿cuál sería?", type: "textarea" },
      { id: "b10_p3", label: "¿Dónde te ves a ti y a tu empresa en 3 años?", type: "textarea" },
      { id: "b10_p4", label: "¿Qué esperas obtener de esta auditoría estratégica?", type: "textarea" },
      { id: "b10_free_final", label: "Espacio libre: Cualquier otro comentario, idea o reflexión que quieras compartir.", type: "free" },
    ],
  },
];
