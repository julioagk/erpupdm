'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { money, salesInvoices as initialData, type SalesInvoice } from '@/lib/data';

export default function ListadoVentasPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>(initialData);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<SalesInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesInvoice | null>(null);

  /* ── Eliminar ── */
  function handleDelete() {
    if (!deleteTarget) return;
    setInvoices(prev => prev.filter(i => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  /* ── Guardar edición ── */
  function handleSaveEdit() {
    if (!editingRow) return;
    setInvoices(prev => prev.map(i => i.id === editingRow.id ? editingRow : i));
    setEditingRow(null);
  }

  return (
    <WorkspaceShell
      active="/ventas/listado"
      eyebrow="Ventas"
      title="Registro de ventas"
      subtitle="Aquí registramos lo que vendemos. Sube XML o PDF para autollenar receptor, folio, fecha, método de pago, subtotal, IVA y total."
    >
      <section className="stack">
        <ListTable
          title="Facturas de venta"
          description={`${invoices.length} facturas registradas.`}
          columns={[
            { key: 'customer', label: 'Receptor', width: '20%' },
            { key: 'invoiceNumber', label: 'Factura', width: '12%' },
            { key: 'date', label: 'Fecha', width: '12%' },
            { key: 'paymentMethod', label: 'Método de pago', width: '20%' },
            { key: 'subtotal', label: 'Subtotal', render: (v: number) => money(v ?? 0), width: '12%' },
            { key: 'iva', label: 'IVA', render: (v: number) => money(v ?? 0), width: '10%' },
            { key: 'amount', label: 'Total', render: (v: number) => money(v), width: '14%' }
          ]}
          data={invoices}
          searchPlaceholder="Buscar por cliente, folio o descripcion..."
          addButtonLabel="+ Agregar factura"
          onAddNew={() => setAddModalOpen(true)}
          onEdit={(row) => setEditingRow({ ...row })}
          onDelete={(row) => setDeleteTarget(row)}
          onExport={() => alert('Exportar facturas de ventas a CSV')}
        />
      </section>

      {/* ── Modal: Agregar ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Nueva factura de venta"
        description="Completa el registro sin salir del listado de ventas."
        size="lg"
      >
        <InvoiceUploader
          title="Agregar factura de venta"
          description="Sube una factura de venta ya emitida para registrar receptor, factura, fecha, método de pago, subtotal, IVA y total."
          actionLabel="Venta"
          accent="rgba(31, 122, 79, 0.16)"
          fieldLabel="Contenido de la factura"
          fieldPlaceholder="Pega el contenido de la factura o el texto extraído del documento"
          uploadHint="Sube la factura emitida o pega su contenido para autollenar todos los campos."
          fileNote="Factura cargada correctamente."
          unsupportedFileNote="Si es imagen o PDF escaneado, conecta lectura automática en backend."
          parseButtonLabel="Autollenar campos"
          clearButtonLabel="Limpiar contenido"
          parsedLabel="Datos detectados. Revisa y corrige antes de confirmar."
          showCategorySelector={false}
          onParsed={(parsed) => {
            const newInvoice: SalesInvoice = {
              id: `s-${Date.now()}`,
              date: parsed.date,
              amount: parsed.total,
              subtotal: parsed.subtotal,
              iva: parsed.iva,
              category: 'Ventas Nacionales',
              source: 'XML / Manual',
              customer: parsed.receiver,
              invoiceNumber: parsed.folio,
              description: '',
              paymentMethod: parsed.paymentMethod,
              status: 'confirmado'
            };
            setInvoices(prev => [newInvoice, ...prev]);
            setAddModalOpen(false);
          }}
        />
      </Modal>

      {/* ── Modal: Editar ── */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title="Editar factura de venta"
        description="Modifica los datos de la factura seleccionada."
        size="lg"
      >
        {editingRow && (
          <div className="stack">
            <div className="uploader-review__grid">
              <label className="form__row">
                <span className="form__label">Receptor / Cliente</span>
                <input className="form__input" value={editingRow.customer}
                  onChange={e => setEditingRow({ ...editingRow, customer: e.target.value })} />
              </label>
              <label className="form__row">
                <span className="form__label">Folio / No. Factura</span>
                <input className="form__input" value={editingRow.invoiceNumber}
                  onChange={e => setEditingRow({ ...editingRow, invoiceNumber: e.target.value })} />
              </label>
              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input className="form__input" type="date" value={editingRow.date}
                  onChange={e => setEditingRow({ ...editingRow, date: e.target.value })} />
              </label>
              <label className="form__row">
                <span className="form__label">Método de Pago</span>
                <input className="form__input" value={editingRow.paymentMethod}
                  onChange={e => setEditingRow({ ...editingRow, paymentMethod: e.target.value })} />
              </label>
              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input className="form__input" type="number" step="0.01" value={editingRow.subtotal ?? 0}
                  onChange={e => setEditingRow({ ...editingRow, subtotal: parseFloat(e.target.value) || 0 })} />
              </label>
              <label className="form__row">
                <span className="form__label">IVA</span>
                <input className="form__input" type="number" step="0.01" value={editingRow.iva ?? 0}
                  onChange={e => setEditingRow({ ...editingRow, iva: parseFloat(e.target.value) || 0 })} />
              </label>
              <label className="form__row">
                <span className="form__label">Total</span>
                <input className="form__input" type="number" step="0.01" value={editingRow.amount}
                  onChange={e => setEditingRow({ ...editingRow, amount: parseFloat(e.target.value) || 0 })} />
              </label>
            </div>
            <div className="form__actions">
              <button className="button button--primary" type="button" onClick={handleSaveEdit}>
                💾 Guardar cambios
              </button>
              <button className="button button--secondary" type="button" onClick={() => setEditingRow(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Confirmar eliminar ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar factura"
        description="Esta acción no se puede deshacer."
        size="sm"
      >
        {deleteTarget && (
          <div className="stack">
            <p style={{ fontSize: '0.95rem' }}>
              ¿Estás seguro de que quieres eliminar la factura <strong>{deleteTarget.invoiceNumber}</strong> de <strong>{deleteTarget.customer}</strong>?
            </p>
            <div className="form__actions">
              <button className="button button--primary" type="button"
                style={{ background: '#c0392b', borderColor: '#c0392b' }}
                onClick={handleDelete}>
                🗑️ Sí, eliminar
              </button>
              <button className="button button--secondary" type="button" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

    </WorkspaceShell>
  );
}
