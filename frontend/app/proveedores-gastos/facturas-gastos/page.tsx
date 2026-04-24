'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { expenseInvoices as initialData, money, type ExpenseInvoice } from '@/lib/data';

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
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>(initialData);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExpenseInvoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseInvoice | null>(null);

  const expenseColumns = [
    { key: 'provider', label: 'Emisor', width: '22%' },
    { key: 'invoiceNumber', label: 'Folio', width: '12%' },
    { key: 'date', label: 'Fecha', width: '12%' },
    { key: 'category', label: 'Categoría', width: '20%' },
    { key: 'amount', label: 'Monto', render: (v: number) => money(v), width: '12%' },
    { key: 'description', label: 'Descripción', width: '22%' }
  ];

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
      active="/proveedores-gastos/facturas-gastos"
      eyebrow="Compras"
      title="Registro de compras"
      subtitle="Aquí registramos todo lo que sale. Sube XML o PDF para autollenar emisor, folio, subtotal, IVA y total."
    >
      <section className="stack">
        <ListTable
          title="Compras registradas"
          description={`${invoices.length} facturas de compra registradas.`}
          columns={expenseColumns}
          data={invoices}
          searchPlaceholder="Buscar compra por emisor, folio o descripcion..."
          addButtonLabel="+ Agregar compra"
          onAddNew={() => setAddModalOpen(true)}
          onEdit={(row) => setEditingRow({ ...row })}
          onDelete={(row) => setDeleteTarget(row)}
          onExport={() => alert('Exportar compras a CSV')}
        />
      </section>

      {/* ── Modal: Agregar ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Nueva compra"
        description="Registra una compra sin salir del listado. El sistema llena los datos al arrastrar XML o PDF."
        size="lg"
      >
        <InvoiceUploader
          title="Agregar compra"
          description="Sube XML o PDF para registrar emisor, folio, subtotal, IVA, total y tipo de gasto."
          actionLabel="Compra"
          accent="rgba(139, 195, 74, 0.18)"
          fieldLabel="Contenido XML / texto extraido"
          fieldPlaceholder="Pega aqui el XML o el texto del PDF de la compra"
          uploadHint="Sube o arrastra XML o PDF para registrar la compra."
          fileNote="Compra cargada correctamente."
          unsupportedFileNote="Si el PDF no trae texto seleccionable, conecta OCR en backend."
          parseButtonLabel="Autollenar campos"
          clearButtonLabel="Limpiar contenido"
          parsedLabel="Datos detectados. Revisa y corrige antes de confirmar."
          onParsed={(parsed) => {
            const newInvoice: ExpenseInvoice = {
              id: `g-${Date.now()}`,
              date: parsed.date,
              amount: parsed.total,
              subtotal: parsed.subtotal,
              iva: parsed.iva,
              category: parsed.expenseType,
              source: 'XML / Manual',
              provider: parsed.issuer,
              invoiceNumber: parsed.folio,
              kind: parsed.expenseType,
              description: ''
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
        title="Editar compra"
        description="Modifica los datos de la factura de compra seleccionada."
        size="lg"
      >
        {editingRow && (
          <div className="stack">
            <div className="uploader-review__grid">
              <label className="form__row">
                <span className="form__label">Emisor / Proveedor</span>
                <input className="form__input" value={editingRow.provider}
                  onChange={e => setEditingRow({ ...editingRow, provider: e.target.value })} />
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
                <span className="form__label">Categoría / Tipo de gasto</span>
                <select className="form__select" value={editingRow.category}
                  onChange={e => setEditingRow({ ...editingRow, category: e.target.value, kind: e.target.value })}>
                  {expenseTypeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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
              <label className="form__row">
                <span className="form__label">Descripción</span>
                <input className="form__input" value={editingRow.description}
                  onChange={e => setEditingRow({ ...editingRow, description: e.target.value })} />
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
        title="Eliminar compra"
        description="Esta acción no se puede deshacer."
        size="sm"
      >
        {deleteTarget && (
          <div className="stack">
            <p style={{ fontSize: '0.95rem' }}>
              ¿Estás seguro de que quieres eliminar la compra <strong>{deleteTarget.invoiceNumber}</strong> de <strong>{deleteTarget.provider}</strong>?
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
