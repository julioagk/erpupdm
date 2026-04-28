'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { money, type ExpenseInvoice } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

const expenseTypeOptions = [
  'SUELDOS',
  'VUELOS',
  'EQUIPAJE',
  'UBER',
  'HOSPEDAJE',
  'RENTA DE CARRO',
  'GASOLINA',
  'CASETAS',
  'VIATICOS',
  'ENVIO DE HERRAMIENTA',
  'EXTRAS',
  'ENVIO DE LIQUIDO',
  'COMPRA DE HERRAMIENTA',
  'EXTRA POLLO'
];

export default function OperationalExpensesPage() {
  const [invoices, setInvoices] = useState<ExpenseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'manual' | 'csv'>('file');
  const [affectBank, setAffectBank] = useState(true);
  const [editingRow, setEditingRow] = useState<ExpenseInvoice | null>(null);
  
  const [manualExpense, setManualExpense] = useState({ issuer: '', invoiceNumber: '', date: '', category: 'SUELDOS', subtotal: 0, iva: 0, amount: 0 });

  useEffect(() => {
    async function loadExpenses() {
      try {
        const data = await fetchFromApi('/api/expenses');
        const filtered = (data.items || []).filter((i: any) => expenseTypeOptions.includes(i.category));
        setInvoices(filtered);
      } catch (error) {
        console.error('Error cargando gastos operacionales:', error);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  const expenseColumns = [
    { key: 'category', label: 'Concepto', width: '40%' },
    { key: 'invoiceNumber', label: 'Folio', width: '30%' },
    { key: 'amount', label: 'Monto', render: (v: number) => money(v), width: '30%' }
  ];

  async function handleDelete(item: ExpenseInvoice) {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto operacional?')) return;
    try {
      await fetchFromApi(`/api/invoices/${item.id}`, { method: 'DELETE' });
      setInvoices(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      alert('Error al eliminar la factura');
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
      setInvoices(prev => prev.map(i => i.id === updated.id ? { ...updated, issuer: updated.providerName } : i));
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
          category: parsed.expenseType || 'SUELDOS',
          source: 'XML / PDF',
          affectBank
        })
      });
      
      setInvoices(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
    } catch (error) {
      alert('Error al guardar la factura en el servidor');
    }
  }

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
          affectBank
        })
      });
      
      setInvoices(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
      setAddMode('file');
      setAffectBank(true);
      setManualExpense({ issuer: '', invoiceNumber: '', date: '', category: 'SUELDOS', subtotal: 0, iva: 0, amount: 0 });
    } catch (error) {
      alert('Error al guardar la compra en el servidor');
    }
  }
  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedData: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 2) {
          const rawConcept = parts[0].trim();
          const rawAmount = parseFloat(parts[1].trim());
          const rawFolio = parts[2] ? parts[2].trim() : `CSV-${Date.now().toString().slice(-4)}${i}`;

          const conceptUpper = rawConcept.toUpperCase();
          const matchedConcept = expenseTypeOptions.find(opt => opt === conceptUpper || opt.startsWith(conceptUpper));

          if (matchedConcept && !isNaN(rawAmount)) {
            parsedData.push({
              category: matchedConcept,
              amount: rawAmount,
              invoiceNumber: rawFolio
            });
          }
        }
      }

      if (parsedData.length === 0) {
        alert('No se encontraron registros válidos en el CSV. Formato esperado: Concepto, Monto');
        return;
      }

      if (!confirm(`¿Deseas registrar ${parsedData.length} gastos masivamente?`)) return;

      try {
        const newInvoices: any[] = [];
        for (const item of parsedData) {
          const res = await fetchFromApi('/api/invoices', {
            method: 'POST',
            body: JSON.stringify({
              type: 'EXPENSE',
              category: item.category,
              amount: item.amount,
              invoiceNumber: item.invoiceNumber,
              issuer: 'Importación CSV',
              date: new Date().toISOString(),
              source: 'Importación CSV',
              affectBank
            })
          });
          newInvoices.push(res);
        }
        setInvoices(prev => [...newInvoices, ...prev]);
        alert(`¡Exitoso! Se importaron ${newInvoices.length} registros operacionales.`);
        setAddModalOpen(false);
        setAddMode('file');
      } catch (error) {
        alert('Hubo un error al procesar algunos registros masivos.');
      }
    };

    reader.readAsText(file);
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
      <WorkspaceShell active="/gastos-operacion" eyebrow="Gastos" title="Cargando gastos operacionales..." subtitle="Sincronizando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la base de datos...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/gastos-operacion"
      eyebrow="Gastos de Operación"
      title="Gestión de gastos operativos"
      subtitle="Control integral de costos fijos, luz, agua, nómina y administración."
    >
      <section className="stack">
        <ListTable
          title="Egresos Operacionales"
          description={`${invoices.length} facturas operativas registradas.`}
          columns={expenseColumns}
          data={invoices}
          searchPlaceholder="Buscar gasto operativo..."
          addButtonLabel="+ Registrar Gasto"
          onAddNew={() => setAddModalOpen(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewPdf={handleViewPdf}
          onExport={() => alert('Exportar gastos a CSV')}
        />
      </section>

      {/* ── Modal: Agregar ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setAddModalOpen(false); setAddMode('file'); }}
        title="Nuevo gasto de operación"
        description="Registra un egreso fijo en el sistema."
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
            📁 Subir XML/PDF
          </button>
          <button 
            type="button" 
            onClick={() => setAddMode('manual')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'manual' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px' }}
          >
            ✍️ Registro Manual
          </button>
          <button 
            type="button" 
            onClick={() => setAddMode('csv')}
            style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'csv' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px' }}
          >
            📊 Importar CSV
          </button>
        </div>

        {addMode === 'file' && (
          <InvoiceUploader
            title="Agregar gasto operacional"
            description="Sube XML o PDF para registrar emisor, folio, subtotal, IVA, total y tipo de gasto."
            actionLabel="Compra"
            accent="rgba(139, 195, 74, 0.18)"
            onParsed={handleConfirmNew}
          />
        )}

        {addMode === 'manual' && (
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
              <button type="submit" className="button button--primary">Registrar Gasto</button>
            </div>
          </form>
        )}

        {addMode === 'csv' && (
          <div style={{ padding: '30px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
            <p style={{ marginBottom: '20px', color: '#475569', fontWeight: 500, fontSize: '1rem' }}>
              Sube un archivo <strong>.csv</strong> masivo. <br />
              La estructura obligatoria debe ser: <br />
              <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '1.1rem', display: 'inline-block', marginTop: '5px' }}>Concepto, Monto, Folio</code> <br />
              <small style={{ color: '#64748b' }}>(Ejemplo: UBER, 350.50, A-123)</small>
            </p>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleCsvUpload} 
              style={{ display: 'none' }} 
              id="csv-file-input" 
            />
            <label 
              htmlFor="csv-file-input" 
              style={{ padding: '12px 30px', background: 'var(--primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-block' }}
            >
              📊 Seleccionar archivo CSV
            </label>
          </div>
        )}
      </Modal>

      {/* ── Modal: Editar ── */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title="Editar Gasto Operacional"
        description="Modifica los datos de la factura de gasto."
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
              <select className="form__select" value={editingRow.category || 'Gastos de Administración'} onChange={e => setEditingRow({...editingRow, category: e.target.value})}>
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
