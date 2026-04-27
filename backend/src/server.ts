import cors from 'cors';
import express from 'express';
import prisma from './db.js';
import { parseInvoiceText } from './parse-invoice.js';
import multer from 'multer';
import { createRequire } from 'module';

const app = express();
const port = Number(process.env.PORT ?? 3001);
const upload = multer({ storage: multer.memoryStorage() });

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
        salesPerDay: 0,
        expensesPerDay: 0,
        pendingInvoices: sales.filter(s => s.status === 'pendiente').length,
        openProviders: 0
      },
      salesTotal: sales.reduce((total, invoice) => total + invoice.amount, 0),
      expensesTotal: expenses.reduce((total, invoice) => total + invoice.amount, 0),
      bankMovements
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Error al cargar el dashboard' });
  }
});

app.get('/api/accounting', async (request, response) => {
  try {
    const range = String(request.query.range || 'month');
    const settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
    
    const selectFields = { id: true, date: true, amount: true, subtotal: true, iva: true, category: true, source: true, invoiceNumber: true, description: true, type: true, providerId: true, providerName: true, customerName: true, paymentMethod: true, status: true, createdAt: true };
    const sales = await prisma.invoice.findMany({ where: { type: 'SALE' }, select: selectFields });
    const expenses = await prisma.invoice.findMany({ where: { type: 'EXPENSE' }, select: selectFields });
    
    const salesTotal = sales.reduce((t, i) => t + i.amount, 0);
    const expenseTotal = expenses.reduce((t, i) => t + i.amount, 0);
    const net = salesTotal - expenseTotal;
    const margin = salesTotal === 0 ? 0 : (net / salesTotal) * 100;

    const mappedSales = sales.map(s => ({ ...s, customer: s.customerName }));
    const mappedExpenses = expenses.map(e => ({ ...e, issuer: e.providerName }));

    response.json({
      range,
      bankBalance: settings?.bankBalance || 0,
      summary: {
        salesTotal,
        expenseTotal,
        net,
        margin,
        salesCount: sales.length,
        expenseCount: expenses.length
      },
      sales: mappedSales,
      expenses: mappedExpenses,
      items: [...mappedSales, ...mappedExpenses]
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Error en contabilidad' });
  }
});

app.get('/api/ai/insight', async (request, response) => {
  const range = String(request.query.range || 'month');
  const sales = await prisma.invoice.findMany({ where: { type: 'SALE' } });
  const expenses = await prisma.invoice.findMany({ where: { type: 'EXPENSE' } });
  
  const salesTotal = sales.reduce((t, i) => t + i.amount, 0);
  const expenseTotal = expenses.reduce((t, i) => t + i.amount, 0);
  const utility = salesTotal - expenseTotal;
  const margin = salesTotal > 0 ? (utility / salesTotal) * 100 : 0;

  let insight;
  if (utility > 0 && margin > 20) {
    insight = {
      status: 'saludable',
      message: `La empresa presenta una rentabilidad sólida del ${margin.toFixed(1)}%.`,
      nextActions: ['Reinvertir en inventario', 'Optimizar impuestos']
    };
  } else if (utility > 0) {
    insight = {
      status: 'estable',
      message: `La rentabilidad es positiva (${margin.toFixed(1)}%), pero el margen es ajustado.`,
      nextActions: ['Reducir gastos de oficina', 'Negociar con emisores']
    };
  } else {
    insight = {
      status: 'critico',
      message: `El periodo actual presenta pérdidas. Los egresos han superado los ingresos.`,
      nextActions: ['Corte de gastos no esenciales', 'Revisión de precios']
    };
  }
  
  response.json(insight);
});

app.get('/api/providers', async (_request, response) => {
  const items = await prisma.provider.findMany();
  response.json({ items });
});

app.get('/api/expenses', async (_request, response) => {
  try {
    const items = await prisma.invoice.findMany({ 
      where: { type: 'EXPENSE' },
      select: { id: true, date: true, amount: true, subtotal: true, iva: true, category: true, source: true, invoiceNumber: true, description: true, type: true, providerId: true, providerName: true, customerName: true, paymentMethod: true, status: true, createdAt: true }
    });
    response.json({ items: items.map(i => ({ ...i, issuer: i.providerName })) });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    response.status(500).json({ error: 'Error al obtener los gastos de la base de datos' });
  }
});

app.get('/api/sales', async (_request, response) => {
  const items = await prisma.invoice.findMany({ 
    where: { type: 'SALE' },
    select: { id: true, date: true, amount: true, subtotal: true, iva: true, category: true, source: true, invoiceNumber: true, description: true, type: true, providerId: true, providerName: true, customerName: true, paymentMethod: true, status: true, createdAt: true }
  });
  response.json({ items: items.map(i => ({ ...i, customer: i.customerName })) });
});

app.post('/api/invoices', async (request, response) => {
  try {
    const body = request.body;
    const isExpense = body.type === 'EXPENSE';

    const newItem = await prisma.invoice.create({
      data: {
        date: body.date,
        amount: body.amount,
        subtotal: body.subtotal || 0,
        iva: body.iva || 0,
        category: body.category || 'Sin categoría',
        source: body.source || 'Manual',
        invoiceNumber: body.invoiceNumber,
        description: body.description || '',
        type: body.type, // 'SALE' o 'EXPENSE'
        providerName: isExpense ? body.issuer : null,
        customerName: !isExpense ? body.customer : null,
        paymentMethod: body.paymentMethod || null,
        status: body.status || 'confirmado',
        pdfData: body.pdfData || null
      }
    });

    // Si es un gasto, también actualizamos el saldo del banco (restamos)
    if (isExpense) {
      await prisma.globalSettings.update({
        where: { id: 'global' },
        data: { bankBalance: { decrement: body.amount } }
      });
    } else {
      // Si es una venta, sumamos al saldo
      await prisma.globalSettings.update({
        where: { id: 'global' },
        data: { bankBalance: { increment: body.amount } }
      });
    }

    // Crear el movimiento bancario correspondiente
    await prisma.bankMovement.create({
      data: {
        date: body.date,
        concept: isExpense 
          ? `Pago factura ${body.invoiceNumber || ''} - ${body.issuer || 'Gasto'}`
          : `Cobro factura ${body.invoiceNumber || ''} - ${body.customer || 'Venta'}`,
        amount: body.amount,
        kind: isExpense ? 'egreso' : 'ingreso',
        source: body.paymentMethod || 'Transferencia',
        status: 'conciliado'
      }
    });

    const mappedItem = {
      ...newItem,
      issuer: newItem.providerName,
      customer: newItem.customerName
    };

    response.status(201).json(mappedItem);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Error al guardar la factura' });
  }
});

app.get('/api/bank', async (_request, response) => {
  try {
    const settings = await prisma.globalSettings.findUnique({ where: { id: 'global' } });
    const items = await prisma.bankMovement.findMany({ orderBy: { date: 'desc' } });
    const invoices = await prisma.invoice.findMany({ select: { invoiceNumber: true } });
    const validInvoiceNumbers = new Set(invoices.map(inv => inv.invoiceNumber));

    // Identificar movimientos huérfanos generados por facturas borradas
    const movementsToDelete: string[] = [];
    const cleanItems = items.filter(item => {
      // Extraer el número de factura del concepto
      const match = item.concept.match(/factura\s+([^\s-]+)/);
      if (match && match[1]) {
        const invoiceNum = match[1];
        if (!validInvoiceNumbers.has(invoiceNum)) {
          movementsToDelete.push(item.id);
          return false; // Filtrar para no mostrarlo
        }
      }
      return true;
    });

    // Borrar los huérfanos de la base de datos
    if (movementsToDelete.length > 0) {
      await prisma.bankMovement.deleteMany({
        where: {
          id: { in: movementsToDelete }
        }
      });
    }

    response.json({ items: cleanItems, balance: settings?.bankBalance ?? 0 });
  } catch (error) {
    console.error('Error al cargar banco:', error);
    response.status(500).json({ error: 'Error al cargar banco' });
  }
});

app.post('/api/bank/balance', async (request, response) => {
  try {
    const { balance } = request.body;
    if (typeof balance !== 'number') {
      return response.status(400).json({ error: 'Saldo inválido' });
    }

    const updated = await prisma.globalSettings.upsert({
      where: { id: 'global' },
      update: { bankBalance: balance },
      create: { id: 'global', bankBalance: balance }
    });

    response.json({ ok: true, balance: updated.bankBalance });
  } catch (error) {
    console.error('Error al actualizar saldo:', error);
    response.status(500).json({ error: 'Error al actualizar saldo' });
  }
});

app.get('/api/invoices/:id/pdf', async (request, response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: request.params.id },
      select: { pdfData: true, invoiceNumber: true }
    });
    if (!invoice || !invoice.pdfData) {
      return response.status(404).json({ error: 'PDF no encontrado o no fue guardado' });
    }
    response.json({ pdfData: invoice.pdfData, invoiceNumber: invoice.invoiceNumber });
  } catch (error) {
    console.error('Error al obtener PDF:', error);
    response.status(500).json({ error: 'Error al obtener PDF' });
  }
});

app.delete('/api/invoices/:id', async (request, response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: request.params.id }
    });
    if (!invoice) return response.status(404).json({ error: 'Factura no encontrada' });

    await prisma.invoice.delete({
      where: { id: request.params.id }
    });

    // Revertir el saldo
    if (invoice.type === 'EXPENSE') {
      await prisma.globalSettings.update({
        where: { id: 'global' },
        data: { bankBalance: { increment: invoice.amount } }
      });
    } else {
      await prisma.globalSettings.update({
        where: { id: 'global' },
        data: { bankBalance: { decrement: invoice.amount } }
      });
    }

    // Eliminar el movimiento bancario correspondiente
    if (invoice.invoiceNumber) {
      await prisma.bankMovement.deleteMany({
        where: {
          concept: {
            contains: invoice.invoiceNumber
          }
        }
      });
    }

    response.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    response.status(500).json({ error: 'Error al eliminar factura' });
  }
});

app.put('/api/invoices/:id', async (request, response) => {
  try {
    const body = request.body;
    const isExpense = body.type === 'EXPENSE';
    
    // Si se están actualizando los montos, tendríamos que ajustar el balance, pero por simplicidad de este MVP,
    // solo actualizaremos los datos del registro para la UI. Para un balance exacto, 
    // en la vida real revertiríamos el anterior y aplicaríamos el nuevo.
    
    const updated = await prisma.invoice.update({
      where: { id: request.params.id },
      data: {
        date: body.date,
        amount: body.amount,
        subtotal: body.subtotal,
        iva: body.iva,
        category: body.category,
        invoiceNumber: body.invoiceNumber,
        providerName: isExpense ? body.issuer : null,
        customerName: !isExpense ? body.customer : null,
        paymentMethod: body.paymentMethod,
        description: body.description
      }
    });

    const mappedItem = {
      ...updated,
      issuer: updated.providerName,
      customer: updated.customerName
    };

    response.json(mappedItem);
  } catch (error) {
    console.error('Error al editar factura:', error);
    response.status(500).json({ error: 'Error al editar factura' });
  }
});

app.post('/api/extract-pdf', upload.single('file'), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const pdf = require('pdf-parse');
    const data = await pdf(request.file.buffer);
    response.json({ text: data.text });
  } catch (error) {
    console.error('Error procesando PDF:', error);
    response.status(500).json({ 
      error: 'Error al procesar el PDF', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.post('/api/invoices/parse', (request, response) => {
  const text = typeof request.body?.text === 'string' ? request.body.text : '';
  const parsed = parseInvoiceText(text);

  response.json({
    parsed,
    humanSummary: `${parsed.kind} detectado para ${parsed.issuer} por ${parsed.amount}`
  });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
