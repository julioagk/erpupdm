import cors from 'cors';
import express from 'express';
import {
  bankMovements,
  buildAIInsight,
  buildAccountingSummary,
  dashboardSeed,
  expenseInvoices,
  providers,
  salesInvoices,
  money
} from './data.js';
import { parseInvoiceText } from './parse-invoice.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'backend', currency: 'MXN' });
});

app.get('/api/dashboard', (_request, response) => {
  response.json({
    metrics: dashboardSeed,
    salesTotal: salesInvoices.reduce((total, invoice) => total + invoice.amount, 0),
    expensesTotal: expenseInvoices.reduce((total, invoice) => total + invoice.amount, 0),
    bankMovements
  });
});

app.get('/api/providers', (_request, response) => {
  response.json({ items: providers });
});

app.post('/api/providers', (request, response) => {
  const body = request.body as Partial<(typeof providers)[number]>;

  response.status(201).json({
    message: 'Proveedor recibido. Conecta persistencia para guardarlo.',
    item: {
      id: body.id ?? `prov-${Date.now()}`,
      name: body.name ?? 'Proveedor nuevo',
      taxId: body.taxId ?? 'SIN-ID',
      category: body.category ?? 'Sin categoria',
      contact: body.contact ?? 'sin-contacto@example.com',
      dueBalance: body.dueBalance ?? 0,
      lastInvoice: body.lastInvoice ?? 'PENDIENTE'
    }
  });
});

app.get('/api/expenses', (_request, response) => {
  response.json({ items: expenseInvoices });
});

app.get('/api/sales', (_request, response) => {
  response.json({ items: salesInvoices });
});

app.get('/api/bank', (_request, response) => {
  response.json({ items: bankMovements, balance: dashboardSeed.bankBalance });
});

app.get('/api/accounting', (request, response) => {
  const range = normalizeRange(request.query.range);
  const summary = buildAccountingSummary(range);

  response.json({
    range,
    summary: {
      salesTotal: summary.salesTotal,
      expenseTotal: summary.expenseTotal,
      net: summary.net,
      margin: summary.margin,
      salesCount: summary.sales.length,
      expenseCount: summary.expenses.length
    },
    sales: summary.sales,
    expenses: summary.expenses
  });
});

app.get('/api/ai/insight', (request, response) => {
  const range = normalizeRange(request.query.range);
  response.json(buildAIInsight(range));
});

app.post('/api/invoices/parse', (request, response) => {
  const text = typeof request.body?.text === 'string' ? request.body.text : '';
  const parsed = parseInvoiceText(text);

  response.json({
    parsed,
    humanSummary: `${parsed.kind} detectado para ${parsed.provider} por ${money(parsed.amount)}`
  });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

function normalizeRange(value: unknown): 'day' | 'week' | 'month' {
  if (value === 'day' || value === 'week' || value === 'month') {
    return value;
  }

  return 'month';
}
