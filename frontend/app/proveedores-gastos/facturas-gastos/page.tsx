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
    { key: 'issuer', label: 'Emisor', width: '18%' },
    { key: 'invoiceNumber', label: 'Folio', width: '12%' },
    { key: 'date', label: 'Fecha', width: '12%' },
    { key: 'category', label: 'Categoría', width: '18%' },
    { key: 'subtotal', label: 'Subtotal', render: (v: number) => money(v), width: '12%' },
    { key: 'iva', label: 'IVA', render: (v: number) => money(v), width: '12%' },
    { key: 'amount', label: 'Total', render: (v: number) => money(v), width: '16%' }
  ];

  async function handleDelete(item: ExpenseInvoice) {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    try {
      await fetchFromApi(`/api/invoices/${item.id}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      alert('Error al eliminar el gasto');
    }
  }

  function handleEdit(item: ExpenseInvoice) {
    setEditingRow({ ...item });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRow) return;
    try {
      const updated = await fetchFromApi(`/api/invoices/${editingRow.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editingRow,
          type: 'EXPENSE'
        })
      });
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
      setEditingRow(null);
    } catch (error) {
      alert('Error al guardar los cambios');
    }
  }

  async function handleConfirmNew(parsed: any) {
    try {
      const newInvoice = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...parsed,
          type: 'EXPENSE',
          issuer: parsed.issuer,
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
          onEdit={handleEdit}
          onDelete={handleDelete}
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

      {/* ── Modal: Editar ── */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title="Editar Compra"
        description="Modifica los datos de la factura de compra."
        size="md"
      >
        {editingRow && (
          <form className="stack" onSubmit={handleSaveEdit} style={{ marginTop: '20px' }}>
            <label className="form__row">
              <span className="form__label">Emisor</span>
              <input required className="form__input" value={editingRow.issuer || ''} onChange={e => setEditingRow({...editingRow, issuer: e.target.value})} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Folio</span>
                <input required className="form__input" value={editingRow.invoiceNumber || ''} onChange={e => setEditingRow({...editingRow, invoiceNumber: e.target.value})} />
              </label>
              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input required className="form__input" type="datetime-local" value={editingRow.date} onChange={e => setEditingRow({...editingRow, date: e.target.value})} />
              </label>
            </div>
            
            <label className="form__row">
              <span className="form__label">Categoría de Gasto</span>
              <select className="form__select" value={editingRow.category} onChange={e => setEditingRow({...editingRow, category: e.target.value})}>
                {expenseTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input required type="number" step="0.01" className="form__input" value={editingRow.subtotal || 0} onChange={e => setEditingRow({...editingRow, subtotal: parseFloat(e.target.value)})} />
              </label>
              <label className="form__row">
                <span className="form__label">IVA</span>
                <input required type="number" step="0.01" className="form__input" value={editingRow.iva || 0} onChange={e => setEditingRow({...editingRow, iva: parseFloat(e.target.value)})} />
              </label>
              <label className="form__row">
                <span className="form__label">Total</span>
                <input required type="number" step="0.01" className="form__input" value={editingRow.amount || 0} onChange={e => setEditingRow({...editingRow, amount: parseFloat(e.target.value)})} />
              </label>
            </div>
            <div className="form__actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button type="button" className="button button--secondary" onClick={() => setEditingRow(null)}>Cancelar</button>
              <button type="submit" className="button button--primary">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
