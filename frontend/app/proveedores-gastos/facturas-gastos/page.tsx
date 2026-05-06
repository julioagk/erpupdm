'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { money, type ExpenseInvoice } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';
import { useBalance } from '@/context/balance-context';

const expenseTypeOptions = [
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

export default function ExpenseInvoicesPage() {
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'manual'>('file');
  const [affectBank, setAffectBank] = useState(true);
  const [bankAccount, setBankAccount] = useState<'banorte' | 'bbva'>('banorte');
  const [editingRow, setEditingRow] = useState<ExpenseInvoice | null>(null);
  const { banorteAlias, bbvaAlias } = useBalance();
  
  const [manualExpense, setManualExpense] = useState({ issuer: '', invoiceNumber: '', date: '', category: 'Servicios y Materiales Indirectos', subtotal: 0, iva: 0, amount: 0 });

  async function handleSaveManualExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newInvoice = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          issuer: manualExpense.issuer,
          invoiceNumber: manualExpense.invoiceNumber,
          date: manualExpense.date ? new Date(manualExpense.date).toISOString() : new Date().toISOString(),
          amount: manualExpense.amount,
          subtotal: manualExpense.subtotal,
          iva: manualExpense.iva,
          category: manualExpense.category,
          source: 'Registro Manual',
          status: 'confirmado',
          affectBank,
          bankAccount
        })
      });
      
      setInvoices(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
      setAddMode('file');
      setAffectBank(true);
      setBankAccount('banorte');
      setManualExpense({ issuer: '', invoiceNumber: '', date: '', category: 'Servicios y Materiales Indirectos', subtotal: 0, iva: 0, amount: 0 });
    } catch (error) {
      alert('Error al guardar la compra en el servidor');
    }
  }

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
        body: JSON.stringify({ ...editingRow, type: 'EXPENSE' })
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
          source: 'XML / PDF',
          affectBank,
          bankAccount
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

  // ── Selector de cuenta reutilizable ──
  const AccountSelector = ({ namePrefix }: { namePrefix: string }) => (
    <div style={{ padding: '12px 14px', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>💳 ¿De qué cuenta sale el dinero?</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '8px 14px', borderRadius: '8px', border: `2px solid ${bankAccount === 'banorte' ? '#0d9488' : '#e2e8f0'}`, background: bankAccount === 'banorte' ? 'rgba(13,148,136,0.06)' : '#fff', transition: 'all 0.2s' }}>
          <input type="radio" name={`${namePrefix}-bankAccount`} value="banorte" checked={bankAccount === 'banorte'} onChange={() => setBankAccount('banorte')} style={{ accentColor: '#0d9488' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bankAccount === 'banorte' ? '#0d9488' : '#334155' }}>🏦 {banorteAlias}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '8px 14px', borderRadius: '8px', border: `2px solid ${bankAccount === 'bbva' ? '#1d4ed8' : '#e2e8f0'}`, background: bankAccount === 'bbva' ? 'rgba(29,78,216,0.06)' : '#fff', transition: 'all 0.2s' }}>
          <input type="radio" name={`${namePrefix}-bankAccount`} value="bbva" checked={bankAccount === 'bbva'} onChange={() => setBankAccount('bbva')} style={{ accentColor: '#1d4ed8' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bankAccount === 'bbva' ? '#1d4ed8' : '#334155' }}>🏛️ {bbvaAlias}</span>
        </label>
      </div>
    </div>
  );

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
        onClose={() => { setAddModalOpen(false); setAddMode('file'); }}
        title="Nueva compra"
        description="Registra una nueva compra en el sistema."
        size="lg"
      >
        {/* Checkbox afectar banco + selector de cuenta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={affectBank} 
              onChange={(e) => setAffectBank(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}>
               🏦 Afectar cuenta de Banco (Registrar movimiento)
            </span>
          </label>
          {affectBank && <AccountSelector namePrefix="compra" />}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
          <button 
            type="button" 
            onClick={() => setAddMode('file')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'file' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px' }}
          >
            📁 Subir Archivo (XML/PDF)
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
            title="Agregar compra"
            description="Sube XML o PDF para registrar emisor, folio, subtotal, IVA, total y tipo de gasto."
            actionLabel="Compra"
            accent="rgba(139, 195, 74, 0.18)"
            onParsed={handleConfirmNew}
          />
        ) : (
          <form className="stack" onSubmit={handleSaveManualExpense} style={{ marginTop: '20px' }}>
            <label className="form__row">
              <span className="form__label">Emisor / Proveedor</span>
              <input required className="form__input" placeholder="Nombre de la empresa" value={manualExpense.issuer} onChange={e => setManualExpense({...manualExpense, issuer: e.target.value})} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Folio</span>
                <input className="form__input" placeholder="A-1234" value={manualExpense.invoiceNumber} onChange={e => setManualExpense({...manualExpense, invoiceNumber: e.target.value})} />
              </label>
              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input required className="form__input" type="datetime-local" value={manualExpense.date} onChange={e => setManualExpense({...manualExpense, date: e.target.value})} />
              </label>
            </div>
            
            <label className="form__row">
              <span className="form__label">Categoría de Gasto</span>
              <select className="form__select" value={manualExpense.category} onChange={e => setManualExpense({...manualExpense, category: e.target.value})}>
                {expenseTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input required type="number" step="0.01" className="form__input" value={manualExpense.subtotal || ''} onChange={e => {
                  const sub = parseFloat(e.target.value) || 0;
                  const iva = parseFloat((sub * 0.16).toFixed(2));
                  setManualExpense({...manualExpense, subtotal: sub, iva: iva, amount: parseFloat((sub + iva).toFixed(2))});
                }} />
              </label>
              <label className="form__row">
                <span className="form__label">IVA (16%)</span>
                <input required type="number" step="0.01" className="form__input" value={manualExpense.iva || ''} onChange={e => setManualExpense({...manualExpense, iva: parseFloat(e.target.value) || 0, amount: parseFloat((manualExpense.subtotal + (parseFloat(e.target.value) || 0)).toFixed(2))})} />
              </label>
              <label className="form__row">
                <span className="form__label">Total</span>
                <input required type="number" step="0.01" className="form__input" value={manualExpense.amount || ''} onChange={e => setManualExpense({...manualExpense, amount: parseFloat(e.target.value) || 0})} />
              </label>
            </div>
            <div className="form__actions" style={{ marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button type="button" className="button button--secondary" onClick={() => { setAddModalOpen(false); setAddMode('file'); }}>Cancelar</button>
              <button type="submit" className="button button--primary">Registrar Compra</button>
            </div>
          </form>
        )}
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
