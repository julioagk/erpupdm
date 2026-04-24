"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const db_js_1 = __importDefault(require("./db.js"));
const parse_invoice_js_1 = require("./parse-invoice.js");
const multer_1 = __importDefault(require("multer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3001);
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.get('/', (_request, response) => {
    response.send('<h1>🚀 API de ERP UPDM Funcionando</h1><p>El backend está conectado exitosamente a PostgreSQL.</p>');
});
app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'backend', db: 'connected', currency: 'MXN' });
});
app.get('/api/dashboard', async (_request, response) => {
    try {
        const settings = await db_js_1.default.globalSettings.upsert({
            where: { id: 'global' },
            update: {},
            create: { bankBalance: 0 }
        });
        const sales = await db_js_1.default.invoice.findMany({ where: { type: 'SALE' } });
        const expenses = await db_js_1.default.invoice.findMany({ where: { type: 'EXPENSE' } });
        const bankMovements = await db_js_1.default.bankMovement.findMany({ take: 10, orderBy: { date: 'desc' } });
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
    }
    catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Error al cargar el dashboard' });
    }
});
app.get('/api/accounting', async (request, response) => {
    try {
        const range = String(request.query.range || 'month');
        const sales = await db_js_1.default.invoice.findMany({ where: { type: 'SALE' } });
        const expenses = await db_js_1.default.invoice.findMany({ where: { type: 'EXPENSE' } });
        const salesTotal = sales.reduce((t, i) => t + i.amount, 0);
        const expenseTotal = expenses.reduce((t, i) => t + i.amount, 0);
        const net = salesTotal - expenseTotal;
        const margin = salesTotal === 0 ? 0 : (net / salesTotal) * 100;
        response.json({
            range,
            summary: {
                salesTotal,
                expenseTotal,
                net,
                margin,
                salesCount: sales.length,
                expenseCount: expenses.length
            },
            // Mapeamos para que el frontend reciba "customer" y "provider" como espera
            sales: sales.map(s => ({ ...s, customer: s.customerName })),
            expenses: expenses.map(e => ({ ...e, provider: e.providerName }))
        });
    }
    catch (error) {
        response.status(500).json({ error: 'Error en contabilidad' });
    }
});
app.get('/api/ai/insight', async (request, response) => {
    const range = String(request.query.range || 'month');
    const sales = await db_js_1.default.invoice.findMany({ where: { type: 'SALE' } });
    const expenses = await db_js_1.default.invoice.findMany({ where: { type: 'EXPENSE' } });
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
    }
    else if (utility > 0) {
        insight = {
            status: 'estable',
            message: `La rentabilidad es positiva (${margin.toFixed(1)}%), pero el margen es ajustado.`,
            nextActions: ['Reducir gastos de oficina', 'Negociar con proveedores']
        };
    }
    else {
        insight = {
            status: 'critico',
            message: `El periodo actual presenta pérdidas. Los egresos han superado los ingresos.`,
            nextActions: ['Corte de gastos no esenciales', 'Revisión de precios']
        };
    }
    response.json(insight);
});
app.get('/api/providers', async (_request, response) => {
    const items = await db_js_1.default.provider.findMany();
    response.json({ items });
});
app.get('/api/expenses', async (_request, response) => {
    const items = await db_js_1.default.invoice.findMany({ where: { type: 'EXPENSE' } });
    response.json({ items: items.map(i => ({ ...i, provider: i.providerName })) });
});
app.get('/api/sales', async (_request, response) => {
    const items = await db_js_1.default.invoice.findMany({ where: { type: 'SALE' } });
    response.json({ items: items.map(i => ({ ...i, customer: i.customerName })) });
});
app.post('/api/invoices', async (request, response) => {
    try {
        const body = request.body;
        const isExpense = body.type === 'EXPENSE';
        const newItem = await db_js_1.default.invoice.create({
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
                providerName: isExpense ? body.provider : null,
                customerName: !isExpense ? body.customer : null,
                status: body.status || 'confirmado'
            }
        });
        // Si es un gasto, también actualizamos el saldo del banco (restamos)
        if (isExpense) {
            await db_js_1.default.globalSettings.update({
                where: { id: 'global' },
                data: { bankBalance: { decrement: body.amount } }
            });
        }
        else {
            // Si es una venta, sumamos al saldo
            await db_js_1.default.globalSettings.update({
                where: { id: 'global' },
                data: { bankBalance: { increment: body.amount } }
            });
        }
        response.status(201).json(newItem);
    }
    catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Error al guardar la factura' });
    }
});
app.get('/api/bank', async (_request, response) => {
    const settings = await db_js_1.default.globalSettings.findUnique({ where: { id: 'global' } });
    const items = await db_js_1.default.bankMovement.findMany({ orderBy: { date: 'desc' } });
    response.json({ items, balance: settings?.bankBalance ?? 0 });
});
app.post('/api/extract-pdf', upload.single('file'), async (request, response) => {
    try {
        if (!request.file) {
            return response.status(400).json({ error: 'No se subió ningún archivo' });
        }
        const data = await pdf_parse_1.default(request.file.buffer);
        response.json({ text: data.text });
    }
    catch (error) {
        console.error(error);
        response.status(500).json({ error: 'Error al procesar el PDF' });
    }
});
app.post('/api/invoices/parse', (request, response) => {
    const text = typeof request.body?.text === 'string' ? request.body.text : '';
    const parsed = (0, parse_invoice_js_1.parseInvoiceText)(text);
    response.json({
        parsed,
        humanSummary: `${parsed.kind} detectado para ${parsed.provider} por ${parsed.amount}`
    });
});
app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
