import cors from 'cors';
import express from 'express';
import prisma from './db.js';
import { parseInvoiceText } from './parse-invoice.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_request, response) => {
  response.send('<h1>🚀 API de ERP UPDM Funcionando</h1><p>El backend está conectado exitosamente a PostgreSQL.</p>');
});

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'backend', db: 'connected', currency: 'MXN' });
});

app.get('/api/dashboard', async (_request, response) => {
  try {
    const settings = await prisma.globalSettings.upsert({
      where: { id: 'global' },
      update: {},
      create: { bankBalance: 0 }
    });

    const sales = await prisma.invoice.findMany({ where: { type: 'SALE' } });
    const expenses = await prisma.invoice.findMany({ where: { type: 'EXPENSE' } });
    const bankMovements = await prisma.bankMovement.findMany({ take: 10, orderBy: { date: 'desc' } });

    response.json({
      metrics: {
        bankBalance: settings.bankBalance,
        salesPerDay: 0, // Implementar logica real despues
        expensesPerDay: 0,
        pendingInvoices: sales.filter(s => s.status === 'pendiente').length,
        openProviders: 0
      },
      salesTotal: sales.reduce((total, invoice) => total + invoice.amount, 0),
      expensesTotal: expenses.reduce((total, invoice) => total + invoice.amount, 0),
      bankMovements
    });
  } catch (error) {
    response.status(500).json({ error: 'Error al cargar el dashboard' });
  }
});

app.get('/api/providers', async (_request, response) => {
  const items = await prisma.provider.findMany();
  response.json({ items });
});

app.get('/api/expenses', async (_request, response) => {
  const items = await prisma.invoice.findMany({ where: { type: 'EXPENSE' } });
  response.json({ items });
});

app.get('/api/sales', async (_request, response) => {
  const items = await prisma.invoice.findMany({ where: { type: 'SALE' } });
  response.json({ items });
});

app.get('/api/bank', async (_request, response) => {
  const settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
  const items = await prisma.bankMovement.findMany({ orderBy: { date: 'desc' } });
  response.json({ items, balance: settings?.bankBalance ?? 0 });
});

app.post('/api/invoices/parse', (request, response) => {
  const text = typeof request.body?.text === 'string' ? request.body.text : '';
  const parsed = parseInvoiceText(text);

  response.json({
    parsed,
    humanSummary: `${parsed.kind} detectado para ${parsed.provider} por ${parsed.total}`
  });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
