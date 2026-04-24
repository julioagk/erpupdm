'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { money, type ExpenseInvoice } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

const expenseTypeOptions = [
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

export default function ExpenseInvoicesPage() {
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExpenseInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseInvoice | null>(null);

  // Cargar datos reales de Railway
  useEffect(() => {
    async function loadExpenses() {
      try {
        const data = await fetchFromApi('/api/expenses');
        setInvoices(data.items || []);
      } catch (error) {
        console.error('Error cargando gastos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  const expenseColumns = [
    { key: 'provider', label: 'Emisor', width: '18%' },
    { key: 'invoiceNumber', label: 'Folio', width: '12%' },
    { key: 'date', label: 'Fecha', width: '12%' },
    { key: 'category', label: 'Categoría', width: '18%' },
    { key: 'subtotal', label: 'Subtotal', render: (v: number) => money(v), width: '12%' },
    { key: 'iva', label: 'IVA', render: (v: number) => money(v), width: '12%' },
    { key: 'amount', label: 'Total', render: (v: number) => money(v), width: '16%' }
  ];

  /* ── Guardar en Railway ── */
  async function handleConfirmNew(parsed: any) {
    try {
      const newInvoice = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...parsed,
          type: 'EXPENSE',
          provider: parsed.issuer,
          invoiceNumber: parsed.folio,
          amount: parsed.total,
          category: parsed.expenseType,
          source: 'XML / PDF'
        })
      });
      
      setInvoices(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
    } catch (error) {
      alert('Error al guardar la factura en el servidor');
    }
  }

  async function handleViewPdf(row: any) {
    try {
      const data = await fetchFromApi(`/api/invoices/${row.id}/pdf`);
      if (data && data.pdfData) {
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${data.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      } else {
        alert('Esta factura no tiene un PDF adjunto guardado.');
      }
    } catch (error) {
      alert('Error al obtener el PDF. Es posible que no se haya guardado.');
    }
  }

  if (loading) {
    return (
      <WorkspaceShell active="/proveedores-gastos/facturas-gastos" eyebrow="Compras" title="Cargando facturas..." subtitle="Conectando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la base de datos...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/proveedores-gastos/facturas-gastos"
      eyebrow="Compras"
      title="Registro de compras"
      subtitle="Aquí registramos todo lo que sale. Sincronizado en tiempo real con tu base de datos PostgreSQL."
    >
      <section className="stack">
        <ListTable
          title="Compras registradas"
          description={`${invoices.length} facturas de compra guardadas en la nube.`}
          columns={expenseColumns}
          data={invoices}
          searchPlaceholder="Buscar compra..."
          addButtonLabel="+ Agregar compra"
          onAddNew={() => setAddModalOpen(true)}
          onEdit={(row) => setEditingRow({ ...row })}
          onDelete={(row) => setDeleteTarget(row)}
          onViewPdf={handleViewPdf}
          onExport={() => alert('Exportar compras a CSV')}
        />
      </section>

      {/* ── Modal: Agregar ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Nueva compra"
        description="Sube tu XML o PDF para guardar la compra en Railway."
        size="lg"
      >
        <InvoiceUploader
          title="Agregar compra"
          description="Sube XML o PDF para registrar emisor, folio, subtotal, IVA, total y tipo de gasto."
          actionLabel="Compra"
          accent="rgba(139, 195, 74, 0.18)"
          onParsed={handleConfirmNew}
        />
      </Modal>

      {/* ── Modal: Editar (Solo visual en este MVP) ── */}
      <Modal isOpen={!!editingRow} onClose={() => setEditingRow(null)} title="Editar compra" size="lg">
        <p style={{ padding: '20px' }}>La edición directa estará disponible en la Fase 2 con Prisma completo.</p>
      </Modal>

      {/* ── Modal: Eliminar ── */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar compra" size="sm">
        <div className="stack">
          <p>¿Estás seguro de eliminar esta factura de la base de datos?</p>
          <button className="button button--primary" style={{ background: '#c0392b' }} onClick={() => setDeleteTarget(null)}>🗑️ Eliminar</button>
        </div>
      </Modal>
    </WorkspaceShell>
  );
}
