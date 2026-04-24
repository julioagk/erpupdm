export type MoneyRecord = {
  id: string;
  date: string;
  amount: number; // Total
  subtotal?: number;
  iva?: number;
  category: string;
  source: string;
};

export type ExpenseInvoice = MoneyRecord & {
  issuer: string;
  invoiceNumber: string;
  kind: string;
  description: string;
};

export type SalesInvoice = MoneyRecord & {
  customer: string;
  invoiceNumber: string;
  description: string;
  paymentMethod: string;
  status: 'confirmado' | 'pendiente' | 'revisar';
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

export type Provider = {
  id: string;
  name: string;
  taxId: string;
  category: string;
  contact: string;
  lastInvoice: string;
};

export const providers: Provider[] = [
  {
    id: 'prov-1',
    name: 'Papeleria Central',
    taxId: 'PCN-104928',
    category: 'Insumos de oficina',
    contact: 'compras@papeleriacentral.mx',
    lastInvoice: 'F-8821'
  },
  {
    id: 'prov-2',
    name: 'Logistica Norte',
    taxId: 'LGN-903114',
    category: 'Flete y distribucion',
    contact: 'facturacion@logisticanorte.mx',
    lastInvoice: 'F-4422'
  },
  {
    id: 'prov-3',
    name: 'Energia Urbana',
    taxId: 'EUA-201889',
    category: 'Servicios',
    contact: 'cobranza@energiaurbana.mx',
    lastInvoice: 'E-1503'
  }
];

export const expenseInvoices: ExpenseInvoice[] = [
  {
    id: 'g-1',
    date: '2026-04-23',
    amount: 8420,
    subtotal: 7258,
    iva: 1162,
    category: 'Servicios y Materiales Indirectos',
    source: 'OCR / PDF',
    issuer: 'Papeleria Central',
    invoiceNumber: 'FAC-7842',
    kind: 'Compra',
    description: 'Compra de insumos y empaque'
  },
  {
    id: 'g-2',
    date: '2026-04-22',
    amount: 3120,
    subtotal: 2690,
    iva: 430,
    category: 'Gastos de Oficina',
    source: 'Carga manual',
    issuer: 'Energia Urbana',
    invoiceNumber: 'E-1503',
    kind: 'Servicio',
    description: 'Consumo electrico mensual'
  },
  {
    id: 'g-3',
    date: '2026-04-21',
    amount: 2190,
    subtotal: 1888,
    iva: 302,
    category: 'Mensajería',
    source: 'OCR / imagen',
    issuer: 'Logistica Norte',
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
    subtotal: 13103,
    iva: 2097,
    category: 'Ventas',
    source: 'OCR / PDF',
    status: 'confirmado',
    customer: 'Comercial Ortega',
    invoiceNumber: 'VTA-9912',
    paymentMethod: 'PUE - Pago en una sola exhibición',
    description: 'Venta de lote de productos A'
  },
  {
    id: 'v-2',
    date: '2026-04-22',
    amount: 9850,
    subtotal: 8491,
    iva: 1359,
    category: 'Ventas',
    source: 'Carga manual',
    status: 'confirmado',
    customer: 'Distribuciones Alfa',
    invoiceNumber: 'VTA-9907',
    paymentMethod: 'Transferencia electrónica',
    description: 'Venta recurrente de abastecimiento'
  },
  {
    id: 'v-3',
    date: '2026-04-21',
    amount: 12400,
    subtotal: 10690,
    iva: 1710,
    category: 'Ventas',
    source: 'OCR / imagen',
    status: 'pendiente',
    customer: 'Nexo Retail',
    invoiceNumber: 'VTA-9901',
    paymentMethod: 'PPD - Pago en parcialidades o diferido',
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
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function filterByRange<T extends { date: string }>(items: T[], range: 'day' | 'week' | 'month' | 'year') {
  const currentDate = new Date('2026-04-23T12:00:00Z');
  const dayWindow = range === 'day' ? 1 : range === 'week' ? 7 : range === 'month' ? 30 : 365;
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



export function accountingReportRows(range: 'day' | 'week' | 'month') {
  const summary = buildAccountingSummary(range);
  const salesRows = summary.sales.map((sale) => ({
    type: 'Venta',
    date: sale.date,
    reference: sale.invoiceNumber,
    party: sale.customer,
    category: sale.category,
    amount: sale.amount,
    note: sale.description,
    source: sale.source
  }));

  const expenseRows = summary.expenses.map((expense) => ({
    type: expense.kind === 'Compra' ? 'Compra' : 'Gasto',
    date: expense.date,
    reference: expense.invoiceNumber,
    party: expense.issuer,
    category: expense.category,
    amount: expense.amount,
    note: expense.description,
    source: expense.source
  }));

  return {
    summary,
    rows: [...salesRows, ...expenseRows]
  };
}

export function buildUpdmReport(range: 'day' | 'week' | 'month' | 'year') {
  const periodSales = filterByRange(salesInvoices, range);
  const periodExpenses = filterByRange(expenseInvoices, range);
  
  const accumSales = salesInvoices; // All time
  const accumExpenses = expenseInvoices;

  const totalPeriodSales = sumAmounts(periodSales);
  const totalAccumSales = sumAmounts(accumSales);

  const categories = [
    'Servicios y Materiales Indirectos',
    'Mensajería',
    'Gastos de Administración',
    'Honorarios Administrativos',
    'Arrendamiento de Inmuebles',
    'Viáticos y Gastos de Viaje',
    'Gastos de Oficina',
    'Combustibles y Lubricantes',
    'Otros Impuestos y Derechos',
    'Suscripciones y Cuotas',
    'Comisiones Bancarias',
    'Partidas No Deducibles'
  ];

  const reportRows = categories.map(cat => {
    const periodVal = sumAmounts(periodExpenses.filter(e => e.category === cat));
    const accumVal = sumAmounts(accumExpenses.filter(e => e.category === cat));
    const invoices = periodExpenses.filter(e => e.category === cat);
    
    return {
      label: cat,
      period: periodVal,
      periodPct: totalPeriodSales > 0 ? (periodVal / totalPeriodSales) * 100 : 0,
      accum: accumVal,
      accumPct: totalAccumSales > 0 ? (accumVal / totalAccumSales) * 100 : 0,
      group: cat === 'Servicios y Materiales Indirectos' ? 'COSTO DE VENTAS' : 'GASTOS DE VENTA Y ADMINISTRACION',
      invoices // desglose individual
    };
  });

  return {
    period: {
      sales: totalPeriodSales,
      expenses: sumAmounts(periodExpenses),
      utility: totalPeriodSales - sumAmounts(periodExpenses)
    },
    accum: {
      sales: totalAccumSales,
      expenses: sumAmounts(accumExpenses),
      utility: totalAccumSales - sumAmounts(accumExpenses)
    },
    rows: reportRows,
    periodSales,     // desglose individual de ingresos
    periodExpenses   // desglose individual de egresos
  };
}

export function buildAIInsight(range: 'day' | 'week' | 'month' | 'year') {
  const report = buildUpdmReport(range);
  const utility = report.period.utility;
  const margin = report.period.sales > 0 ? (utility / report.period.sales) * 100 : 0;

  if (utility > 0 && margin > 20) {
    return {
      status: 'saludable',
      message: `La empresa presenta una rentabilidad sólida del ${margin.toFixed(1)}% en este periodo. Los ingresos superan ampliamente los costos operativos, lo que indica un modelo de negocio eficiente.`,
      nextActions: ['Reinvertir en inventario', 'Explorar nuevos canales de venta', 'Optimizar impuestos']
    };
  } else if (utility > 0) {
    return {
      status: 'estable',
      message: `La rentabilidad es positiva (${margin.toFixed(1)}%), pero el margen es ajustado. Se recomienda revisar los gastos de administración para liberar flujo de caja.`,
      nextActions: ['Reducir gastos de oficina', 'Negociar con emisores', 'Revisar comisiones']
    };
  } else {
    return {
      status: 'critico',
      message: `El periodo actual presenta pérdidas. Los egresos han superado los ingresos. Es urgente identificar fugas de capital o aumentar el volumen de ventas nacionales.`,
      nextActions: ['Corte de gastos no esenciales', 'Revision de precios', 'Inyeccion de capital']
    };
  }
}
