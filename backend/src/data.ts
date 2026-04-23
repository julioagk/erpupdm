export type Provider = {
  id: string;
  name: string;
  taxId: string;
  category: string;
  contact: string;
  dueBalance: number;
  lastInvoice: string;
};

export type ExpenseInvoice = {
  id: string;
  date: string;
  amount: number;
  category: string;
  source: string;
  status: 'confirmado' | 'pendiente' | 'revisar';
  provider: string;
  invoiceNumber: string;
  kind: string;
  description: string;
};

export type SalesInvoice = {
  id: string;
  date: string;
  amount: number;
  category: string;
  source: string;
  status: 'confirmado' | 'pendiente' | 'revisar';
  customer: string;
  invoiceNumber: string;
  description: string;
};

export type BankMovement = {
  id: string;
  date: string;
  concept: string;
  amount: number;
  kind: 'ingreso' | 'egreso';
  source: string;
  status: 'conciliado' | 'pendiente';
};

export const providers: Provider[] = [
  {
    id: 'prov-1',
    name: 'Papeleria Central',
    taxId: 'PCN-104928',
    category: 'Insumos de oficina',
    contact: 'compras@papeleriacentral.mx',
    dueBalance: 12840,
    lastInvoice: 'F-8821'
  },
  {
    id: 'prov-2',
    name: 'Logistica Norte',
    taxId: 'LGN-903114',
    category: 'Flete y distribucion',
    contact: 'facturacion@logisticanorte.mx',
    dueBalance: 6120,
    lastInvoice: 'F-4422'
  },
  {
    id: 'prov-3',
    name: 'Energia Urbana',
    taxId: 'EUA-201889',
    category: 'Servicios',
    contact: 'cobranza@energiaurbana.mx',
    dueBalance: 9200,
    lastInvoice: 'E-1503'
  }
];

export const expenseInvoices: ExpenseInvoice[] = [
  {
    id: 'g-1',
    date: '2026-04-23',
    amount: 8420,
    category: 'Inventario',
    source: 'OCR / PDF',
    status: 'confirmado',
    provider: 'Papeleria Central',
    invoiceNumber: 'FAC-7842',
    kind: 'Compra',
    description: 'Compra de insumos y empaque'
  },
  {
    id: 'g-2',
    date: '2026-04-22',
    amount: 3120,
    category: 'Servicios',
    source: 'Carga manual',
    status: 'pendiente',
    provider: 'Energia Urbana',
    invoiceNumber: 'E-1503',
    kind: 'Servicio',
    description: 'Consumo electrico mensual'
  },
  {
    id: 'g-3',
    date: '2026-04-21',
    amount: 2190,
    category: 'Flete',
    source: 'OCR / imagen',
    status: 'revisar',
    provider: 'Logistica Norte',
    invoiceNumber: 'LN-2245',
    kind: 'Transporte',
    description: 'Envio de pedidos a clientes'
  }
];

export const salesInvoices: SalesInvoice[] = [
  {
    id: 'v-1',
    date: '2026-04-23',
    amount: 15200,
    category: 'Ventas',
    source: 'OCR / PDF',
    status: 'confirmado',
    customer: 'Comercial Ortega',
    invoiceNumber: 'VTA-9912',
    description: 'Venta de lote de productos A'
  },
  {
    id: 'v-2',
    date: '2026-04-22',
    amount: 9850,
    category: 'Ventas',
    source: 'Carga manual',
    status: 'confirmado',
    customer: 'Distribuciones Alfa',
    invoiceNumber: 'VTA-9907',
    description: 'Venta recurrente de abastecimiento'
  },
  {
    id: 'v-3',
    date: '2026-04-21',
    amount: 12400,
    category: 'Ventas',
    source: 'OCR / imagen',
    status: 'pendiente',
    customer: 'Nexo Retail',
    invoiceNumber: 'VTA-9901',
    description: 'Venta de reposicion mensual'
  }
];

export const bankMovements: BankMovement[] = [
  {
    id: 'b-1',
    date: '2026-04-23',
    concept: 'Cobro factura VTA-9912',
    amount: 15200,
    kind: 'ingreso',
    source: 'Banco principal',
    status: 'conciliado'
  },
  {
    id: 'b-2',
    date: '2026-04-23',
    concept: 'Pago factura FAC-7842',
    amount: 8420,
    kind: 'egreso',
    source: 'Banco principal',
    status: 'conciliado'
  },
  {
    id: 'b-3',
    date: '2026-04-22',
    concept: 'Movimiento pendiente de identificar',
    amount: 4100,
    kind: 'ingreso',
    source: 'Tarjeta empresarial',
    status: 'pendiente'
  }
];

export const dashboardSeed = {
  salesPerDay: 41860,
  expensesPerDay: 13730,
  bankBalance: 184320,
  pendingInvoices: 4,
  openProviders: 3
};

export function money(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(value);
}

export function filterByRange<T extends { date: string }>(items: T[], range: 'day' | 'week' | 'month') {
  const currentDate = new Date('2026-04-23T12:00:00Z');
  const dayWindow = range === 'day' ? 1 : range === 'week' ? 7 : 30;
  const threshold = currentDate.getTime() - dayWindow * 24 * 60 * 60 * 1000;

  return items.filter((item) => new Date(`${item.date}T12:00:00Z`).getTime() >= threshold);
}

export function sumAmounts<T extends { amount: number }>(items: T[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function buildAccountingSummary(range: 'day' | 'week' | 'month') {
  const sales = filterByRange(salesInvoices, range);
  const expenses = filterByRange(expenseInvoices, range);
  const salesTotal = sumAmounts(sales);
  const expenseTotal = sumAmounts(expenses);
  const net = salesTotal - expenseTotal;
  const margin = salesTotal === 0 ? 0 : (net / salesTotal) * 100;

  return {
    salesTotal,
    expenseTotal,
    net,
    margin,
    sales,
    expenses,
    range
  };
}

export function buildAIInsight(range: 'day' | 'week' | 'month') {
  const summary = buildAccountingSummary(range);
  const marginStatus = summary.margin >= 20 ? 'rentable' : summary.margin >= 0 ? 'estable' : 'en riesgo';
  const cashStatus = dashboardSeed.bankBalance > summary.expenseTotal ? 'liquidez saludable' : 'revisar caja';

  return {
    title: `Lectura automatica para ${range}`,
    status: marginStatus,
    message:
      summary.margin >= 20
        ? 'La empresa muestra una tendencia rentable, con margen positivo y banco por encima del ritmo de gasto.'
        : summary.margin >= 0
          ? 'La empresa se mantiene estable. Conviene vigilar gastos operativos y cobrar ventas pendientes.'
          : 'Los gastos estan superando los ingresos del periodo. Conviene actuar sobre costos y cobranza.',
    highlight: cashStatus,
    nextActions: [
      'Revisar facturas con estado pendiente o por revisar.',
      'Priorizar cobros de ventas recientes.',
      'Conectar el motor IA para recomendaciones mas precisas.'
    ]
  };
}
