'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { money, type SalesInvoice } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function SalesListPage() {
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'manual'>('file');
  const [affectBank, setAffectBank] = useState(true);
  const [editingRow, setEditingRow] = useState<SalesInvoice | null>(null);

  const [manualSale, setManualSale] = useState({ customer: '', invoiceNumber: '', date: '', paymentMethod: 'PUE - Pago en una sola exhibición', subtotal: 0, iva: 0, amount: 0 });

  async function handleSaveManualSale(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newInvoice = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          type: 'SALE',
          customer: manualSale.customer,
          invoiceNumber: manualSale.invoiceNumber,
          date: manualSale.date ? new Date(manualSale.date).toISOString() : new Date().toISOString(),
          amount: manualSale.amount,
          subtotal: manualSale.subtotal,
          iva: manualSale.iva,
          paymentMethod: manualSale.paymentMethod,
          category: 'Ventas',
          source: 'Registro Manual',
          status: 'confirmado',
          affectBank
        })
      });
      
      setSales(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
      setAddMode('file');
      setAffectBank(true);
      setManualSale({ customer: '', invoiceNumber: '', date: '', paymentMethod: 'PUE - Pago en una sola exhibición', subtotal: 0, iva: 0, amount: 0 });
    } catch (error) {
      alert('Error al guardar la venta en el servidor');
    }
  }

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await fetchFromApi('/api/sales');
        setSales(data.items || []);
      } catch (error) {
        console.error('Error cargando ventas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  const salesColumns = [
    { key: 'customer', label: 'Cliente', width: '20%' },
    { key: 'invoiceNumber', label: 'Folio', width: '12%' },
    { key: 'date', label: 'Fecha', width: '13%' },
    { key: 'paymentMethod', label: 'Método Pago', width: '15%' },
    { key: 'subtotal', label: 'Subtotal', render: (v: number) => money(v), width: '13%' },
    { key: 'iva', label: 'IVA', render: (v: number) => money(v), width: '12%' },
    { key: 'amount', label: 'Total', render: (v: number) => money(v), width: '15%' }
  ];

  async function handleDelete(item: SalesInvoice) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta venta?')) return;
    try {
      await fetchFromApi(`/api/invoices/${item.id}`, { method: 'DELETE' });
      setSales(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      alert('Error al eliminar la factura');
    }
  }

  function handleEdit(item: SalesInvoice) {
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
          type: 'SALE'
        })
      });
      setSales(prev => prev.map(i => i.id === updated.id ? updated : i));
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
          type: 'SALE',
          customer: parsed.receiver, 
          invoiceNumber: parsed.folio,
          amount: parsed.total,
          category: 'Ventas',
          source: 'XML / PDF',
          status: 'confirmado',
          affectBank
        })
      });
      
      setSales(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
    } catch (error) {
      alert('Error al guardar la venta en la base de datos');
    }
  }

  async function handleViewPdf(row: any) {
    try {
      const data = await fetchFromApi(`/api/invoices/${row.id}/pdf`);
      if (data && data.pdfData) {
        // Open PDF in new tab
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${data.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      } else {
        alert('Esta venta no tiene un PDF adjunto guardado.');
      }
    } catch (error) {
      alert('Error al obtener el PDF. Es posible que no se haya guardado.');
    }
  }

  if (loading) {
    return (
      <WorkspaceShell active="/ventas/listado" eyebrow="Ventas" title="Cargando ventas..." subtitle="Sincronizando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la base de datos...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/ventas/listado"
      eyebrow="Ingresos"
      title="Listado de ventas"
      subtitle="Control total de facturas emitidas. Los datos se guardan de forma persistente en PostgreSQL."
    >
      <section className="stack">
        <ListTable
          title="Ventas registradas"
          description={`${sales.length} facturas de venta en el sistema.`}
          columns={salesColumns}
          data={sales}
          searchPlaceholder="Buscar venta por cliente o folio..."
          addButtonLabel="+ Registrar Venta"
          onAddNew={() => setAddModalOpen(true)}
          onViewPdf={handleViewPdf}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setAddModalOpen(false); setAddMode('file'); }}
        title="Registrar Nueva Venta"
        description="Registra una nueva venta en el sistema."
        size="lg"
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={affectBank} 
            onChange={(e) => setAffectBank(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}>
             🏦 Afectar cuenta de Banco (Sumar/Restar saldo y registrar movimiento)
          </span>
        </label>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
          <button 
            type="button" 
            onClick={() => setAddMode('file')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'file' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px' }}
          >
            📁 Subir XML
          </button>
          <button 
            type="button" 
            onClick={() => setAddMode('manual')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'manual' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px' }}
          >
            ✍️ Registro Manual
          </button>
        </div>

        {addMode === 'file' ? (
          <InvoiceUploader
            title="Registrar venta"
            description="Sube XML para autollenar cliente, folio y montos."
            actionLabel="Venta"
            accent="rgba(191, 255, 117, 0.3)"
            showCategorySelector={false}
            isSale={true}
            onParsed={handleConfirmNew}
          />
        ) : (
          <form className="stack" onSubmit={handleSaveManualSale} style={{ marginTop: '20px' }}>
            <label className="form__row">
              <span className="form__label">Cliente</span>
              <input required className="form__input" placeholder="Nombre del cliente" value={manualSale.customer} onChange={e => setManualSale({...manualSale, customer: e.target.value})} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Folio</span>
                <input className="form__input" placeholder="A-1234" value={manualSale.invoiceNumber} onChange={e => setManualSale({...manualSale, invoiceNumber: e.target.value})} />
              </label>
              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input required className="form__input" type="datetime-local" value={manualSale.date} onChange={e => setManualSale({...manualSale, date: e.target.value})} />
              </label>
            </div>
            
            <label className="form__row">
              <span className="form__label">Método de Pago</span>
              <input className="form__input" placeholder="PUE - Pago en una sola exhibición" value={manualSale.paymentMethod} onChange={e => setManualSale({...manualSale, paymentMethod: e.target.value})} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input required type="number" step="0.01" className="form__input" value={manualSale.subtotal || ''} onChange={e => {
                  const sub = parseFloat(e.target.value) || 0;
                  const iva = parseFloat((sub * 0.16).toFixed(2));
                  setManualSale({...manualSale, subtotal: sub, iva: iva, amount: parseFloat((sub + iva).toFixed(2))});
                }} />
              </label>
              <label className="form__row">
                <span className="form__label">IVA (16%)</span>
                <input required type="number" step="0.01" className="form__input" value={manualSale.iva || ''} onChange={e => setManualSale({...manualSale, iva: parseFloat(e.target.value) || 0, amount: parseFloat((manualSale.subtotal + (parseFloat(e.target.value) || 0)).toFixed(2))})} />
              </label>
              <label className="form__row">
                <span className="form__label">Total</span>
                <input required type="number" step="0.01" className="form__input" value={manualSale.amount || ''} onChange={e => setManualSale({...manualSale, amount: parseFloat(e.target.value) || 0})} />
              </label>
            </div>
            <div className="form__actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button type="button" className="button button--secondary" onClick={() => { setAddModalOpen(false); setAddMode('file'); }}>Cancelar</button>
              <button type="submit" className="button button--primary">Registrar Venta</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title="Editar Venta"
        description="Modifica los datos de la factura."
        size="md"
      >
        {editingRow && (
          <form className="stack" onSubmit={handleSaveEdit} style={{ marginTop: '20px' }}>
            <label className="form__row">
              <span className="form__label">Cliente</span>
              <input required className="form__input" value={editingRow.customer || ''} onChange={e => setEditingRow({...editingRow, customer: e.target.value})} />
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
              <span className="form__label">Método de Pago</span>
              <input className="form__input" value={editingRow.paymentMethod || ''} onChange={e => setEditingRow({...editingRow, paymentMethod: e.target.value})} />
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
