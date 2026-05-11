'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { Modal } from '@/components/modal';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';
import { useBalance } from '@/context/balance-context';

type PendingExpense = {
  id: string;
  date: string;
  amount: number;
  subtotal: number;
  iva: number;
  issuer: string;
  invoiceNumber: string;
  paymentMethod: string;
  status: string;
  dueDate?: string | null;
  category: string;
  source: string;
};

function getDaysUntilDue(dueDate: string | null | undefined): number | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DueDateBadge({ dueDate }: { dueDate?: string | null }) {
  const days = getDaysUntilDue(dueDate);
  if (days === null) return null;
  let color = '#16a34a', bg = 'rgba(22,163,74,0.1)', emoji = '🟢', label = `${days}d`;
  if (days < 0) { color = '#dc2626'; bg = 'rgba(220,38,38,0.1)'; emoji = '🔴'; label = `Vencida hace ${Math.abs(days)}d`; }
  else if (days === 0) { color = '#dc2626'; bg = 'rgba(220,38,38,0.12)'; emoji = '🚨'; label = 'Vence HOY'; }
  else if (days <= 3) { color = '#ea580c'; bg = 'rgba(234,88,12,0.1)'; emoji = '🔶'; label = `${days}d restantes`; }
  else if (days <= 7) { color = '#ca8a04'; bg = 'rgba(202,138,4,0.1)'; emoji = '⚠️'; label = `${days}d restantes`; }
  else { label = `${days}d restantes`; }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: bg, color, border: `1px solid ${color}30` }}>
      {emoji} {label}
    </span>
  );
}

function AlertBanner({ items }: { items: PendingExpense[] }) {
  const urgent = items.filter(i => { const d = getDaysUntilDue(i.dueDate); return d !== null && d <= 5; });
  if (urgent.length === 0) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(234,88,12,0.06))', border: '1px solid rgba(220,38,38,0.35)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔔</span>
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: '#b91c1c', fontSize: '0.92rem' }}>
          {urgent.length} factura{urgent.length > 1 ? 's' : ''} con fecha límite de pago próxima
        </p>
        <ul style={{ margin: '6px 0 0', padding: '0 0 0 16px', color: '#991b1b', fontSize: '0.82rem', lineHeight: 1.6 }}>
          {urgent.map(inv => {
            const days = getDaysUntilDue(inv.dueDate)!;
            return (
              <li key={inv.id}>
                <strong>{inv.issuer}</strong> — Folio {inv.invoiceNumber} —&nbsp;
                {days < 0 ? `Vencida hace ${Math.abs(days)}d` : days === 0 ? '¡Vence hoy!' : `Vence en ${days} día${days > 1 ? 's' : ''}`}
                &nbsp;({money(inv.amount)})
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

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

export default function CuentasPorPagarOperacionalPage() {
  const [items, setItems] = useState<PendingExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<PendingExpense | null>(null);
  const [bankAccount, setBankAccount] = useState<'banorte' | 'bbva'>('banorte');
  const [confirming, setConfirming] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'manual'>('file');
  const { banorteAlias, bbvaAlias, refreshBalance } = useBalance();
  const [newExpense, setNewExpense] = useState({ issuer: '', invoiceNumber: '', date: '', paymentMethod: 'PUE', category: 'SUELDOS', subtotal: 0, iva: 0, amount: 0, dueDate: '' });

  const load = useCallback(async () => {
    try {
      const data = await fetchFromApi('/api/payables?source=Cuenta%20por%20Pagar%20Operacional');
      setItems(data.items || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i =>
    (i.issuer || '').toLowerCase().includes(search.toLowerCase()) ||
    (i.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleConfirm() {
    if (!confirmTarget) return;
    setConfirming(true);
    try {
      await fetchFromApi(`/api/invoices/${confirmTarget.id}/confirm-payment`, { method: 'POST', body: JSON.stringify({ bankAccount }) });
      await refreshBalance();
      setItems(prev => prev.filter(i => i.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch { alert('Error al confirmar el pago'); } finally { setConfirming(false); }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          issuer: newExpense.issuer,
          invoiceNumber: newExpense.invoiceNumber,
          date: newExpense.date ? new Date(newExpense.date).toISOString() : new Date().toISOString(),
          amount: newExpense.amount, subtotal: newExpense.subtotal, iva: newExpense.iva,
          paymentMethod: newExpense.paymentMethod === 'PPD' ? 'PPD - Pago en parcialidades o diferido' : 'PUE - Pago en una sola exhibición',
          category: newExpense.category, source: 'Cuenta por Pagar Operacional', status: 'pendiente',
          affectBank: false, dueDate: newExpense.dueDate || null
        })
      });
      setItems(prev => [{ ...created, issuer: created.providerName || created.issuer }, ...prev]);
      setAddModalOpen(false);
      setAddMode('file');
      setNewExpense({ issuer: '', invoiceNumber: '', date: '', paymentMethod: 'PUE', category: 'SUELDOS', subtotal: 0, iva: 0, amount: 0, dueDate: '' });
    } catch { alert('Error al agregar la factura'); }
  }

  async function handleParsedFile(parsed: any) {
    try {
      const created = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          type: 'EXPENSE',
          issuer: parsed.issuer,
          invoiceNumber: parsed.folio,
          date: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
          amount: parsed.total,
          subtotal: parsed.subtotal,
          iva: parsed.iva,
          paymentMethod: parsed.paymentMethod || 'PUE - Pago en una sola exhibición',
          category: parsed.expenseType || 'SUELDOS',
          source: 'XML / PDF - Gasto Operacional',
          status: 'pendiente',
          affectBank: false,
          pdfData: parsed.pdfData || null,
          dueDate: parsed.dueDate || null
        })
      });
      setItems(prev => [{ ...created, issuer: created.providerName || created.issuer }, ...prev]);
      setAddModalOpen(false);
      setAddMode('file');
    } catch { alert('Error al guardar la factura escaneada'); }
  }

  async function handleDelete(item: PendingExpense) {
    if (!confirm(`¿Eliminar la factura de ${item.issuer}?`)) return;
    try {
      await fetchFromApi(`/api/invoices/${item.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch { alert('Error al eliminar'); }
  }

  if (loading) return (
    <WorkspaceShell active="/gastos-operacion/cuentas-por-pagar" eyebrow="Gastos de Operación" title="Cuentas por Pagar" subtitle="Cargando...">
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando...</div>
    </WorkspaceShell>
  );

  const totalPendiente = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <WorkspaceShell active="/gastos-operacion/cuentas-por-pagar" eyebrow="Gastos de Operación" title="Cuentas por Pagar" subtitle="Facturas pendientes de pago. Confirma el pago para registrar el egreso en banco.">
      <section className="stack">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '8px' }}>
          {[
            { label: 'Facturas pendientes', value: filtered.length.toString(), icon: '🧾', accent: '#dc2626' },
            { label: 'Total por pagar', value: money(totalPendiente), icon: '💸', accent: '#7c3aed' },
            { label: 'Con fecha límite', value: filtered.filter(i => i.dueDate).length.toString(), icon: '📅', accent: '#ea580c' }
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--surface)', borderRadius: '16px', padding: '20px 22px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', fontSize: '1.4rem', background: `${card.accent}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{card.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        <AlertBanner items={filtered} />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input className="form__input" placeholder="🔍 Buscar por emisor o folio..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: '380px' }} />
          <button className="button button--primary" onClick={() => setAddModalOpen(true)} style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>+ Agregar Cuenta por Pagar</button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--line)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>{search ? 'Sin resultados.' : 'No hay facturas pendientes de pago.'}</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--line)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-alt, #f8fafc)', borderBottom: '1px solid var(--line)' }}>
                    {['Emisor', 'Folio', 'Fecha', 'Método', 'Vence', 'Categoría', 'Subtotal', 'IVA', 'Total', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const days = getDaysUntilDue(item.dueDate);
                    const isUrgent = days !== null && days <= 3;
                    const isOverdue = days !== null && days < 0;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--line)', background: isOverdue ? 'rgba(220,38,38,0.04)' : isUrgent ? 'rgba(234,88,12,0.03)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{item.issuer || '—'}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b', fontFamily: 'monospace' }}>{item.invoiceNumber || '—'}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.date ? new Date(item.date).toLocaleDateString('es-MX') : '—'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: item.paymentMethod?.includes('PPD') ? 'rgba(124,58,237,0.1)' : 'rgba(13,148,136,0.1)', color: item.paymentMethod?.includes('PPD') ? '#7c3aed' : '#0d9488' }}>
                            {item.paymentMethod?.includes('PPD') ? 'PPD' : 'PUE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {item.dueDate
                            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '0.78rem', color: '#64748b' }}>{new Date(item.dueDate).toLocaleDateString('es-MX')}</span><DueDateBadge dueDate={item.dueDate} /></div>
                            : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category || '—'}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{money(item.subtotal || 0)}</td>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{money(item.iva || 0)}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap' }}>{money(item.amount)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setConfirmTarget(item); setBankAccount('banorte'); }} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>💳 Pagar</button>
                            <button onClick={() => handleDelete(item)} style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #fca5a5', background: 'rgba(220,38,38,0.06)', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }} title="Eliminar">🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal confirmar pago */}
      <Modal isOpen={!!confirmTarget} onClose={() => setConfirmTarget(null)} title="Confirmar pago de factura" description="Selecciona la cuenta de donde sale el pago." size="md">
        {confirmTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '14px', padding: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[['Emisor', confirmTarget.issuer], ['Folio', confirmTarget.invoiceNumber], ['Método', confirmTarget.paymentMethod?.includes('PPD') ? 'PPD' : 'PUE'], ['Total', money(confirmTarget.amount)]].map(([k, v]) => (
                  <div key={k}><p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{k}</p><p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{v}</p></div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700 }}>💳 ¿De qué cuenta sale el dinero?</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {([['banorte', '🏦', banorteAlias, '#0d9488'], ['bbva', '🏛️', bbvaAlias, '#1d4ed8']] as const).map(([val, icon, name, color]) => (
                  <label key={val} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${bankAccount === val ? color : '#e2e8f0'}`, background: bankAccount === val ? `${color}0d` : '#fff', transition: 'all 0.2s' }}>
                    <input type="radio" name="confirm-bank-pay" value={val} checked={bankAccount === val} onChange={() => setBankAccount(val)} style={{ accentColor: color }} />
                    <span style={{ fontWeight: 700, color: bankAccount === val ? color : '#374151', fontSize: '0.9rem' }}>{icon} {name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="button button--secondary" onClick={() => setConfirmTarget(null)}>Cancelar</button>
              <button className="button button--primary" onClick={handleConfirm} disabled={confirming} style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', minWidth: '140px' }}>
                {confirming ? 'Procesando...' : '💳 Confirmar Pago'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal agregar */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setAddMode('file'); }} title="Nueva Cuenta por Pagar" description="No afecta el banco hasta confirmar el pago." size="lg">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
          <button type="button" onClick={() => setAddMode('file')} style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'file' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px', fontWeight: addMode === 'file' ? 700 : 400 }}>📁 Subir XML / PDF</button>
          <button type="button" onClick={() => setAddMode('manual')} style={{ padding: '10px 20px', cursor: 'pointer', background: addMode === 'manual' ? '#e2e8f0' : '#fff', border: '1px solid var(--line)', borderRadius: '20px', fontWeight: addMode === 'manual' ? 700 : 400 }}>✍️ Registro Manual</button>
        </div>

        {addMode === 'file' ? (
          <InvoiceUploader
            title="Escanear factura por pagar"
            description="Sube XML o PDF para autollenar emisor, folio, montos y categoría."
            actionLabel="Por Pagar"
            accent="rgba(220,38,38,0.18)"
            showCategorySelector={true}
            expenseTypeOptions={expenseTypeOptions}
            isSale={false}
            onParsed={handleParsedFile}
          />
        ) : (
        <form className="stack" onSubmit={handleAddExpense} style={{ marginTop: '10px' }}>
          <label className="form__row"><span className="form__label">Emisor / Proveedor</span><input required className="form__input" placeholder="Nombre del proveedor" value={newExpense.issuer} onChange={e => setNewExpense({ ...newExpense, issuer: e.target.value })} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <label className="form__row"><span className="form__label">Folio</span><input className="form__input" placeholder="A-1234" value={newExpense.invoiceNumber} onChange={e => setNewExpense({ ...newExpense, invoiceNumber: e.target.value })} /></label>
            <label className="form__row"><span className="form__label">Fecha</span><input required className="form__input" type="datetime-local" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} /></label>
          </div>
          <label className="form__row">
            <span className="form__label">Método de Pago</span>
            <select className="form__select" value={newExpense.paymentMethod} onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value, dueDate: e.target.value === 'PUE' ? '' : newExpense.dueDate })}>
              <option value="PUE">PUE — Pago en una sola exhibición (dentro del mes)</option>
              <option value="PPD">PPD — Pago en parcialidades o diferido (indefinido)</option>
            </select>
          </label>
          {newExpense.paymentMethod === 'PPD' && (
            <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9' }}>📅 Fecha límite PPD <span style={{ fontWeight: 400, color: '#8b5cf6' }}>(opcional — activa alarma)</span></p>
              <input className="form__input" type="date" value={newExpense.dueDate} onChange={e => setNewExpense({ ...newExpense, dueDate: e.target.value })} style={{ borderColor: 'rgba(124,58,237,0.3)' }} />
            </div>
          )}
          <label className="form__row">
            <span className="form__label">Categoría</span>
            <select className="form__select" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
              {expenseTypeOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <label className="form__row"><span className="form__label">Subtotal</span><input required type="number" step="0.01" className="form__input" value={newExpense.subtotal || ''} onChange={e => { const sub = parseFloat(e.target.value) || 0; const iva = parseFloat((sub * 0.16).toFixed(2)); setNewExpense({ ...newExpense, subtotal: sub, iva, amount: parseFloat((sub + iva).toFixed(2)) }); }} /></label>
            <label className="form__row"><span className="form__label">IVA (16%)</span><input type="number" step="0.01" className="form__input" value={newExpense.iva || ''} onChange={e => setNewExpense({ ...newExpense, iva: parseFloat(e.target.value) || 0, amount: parseFloat((newExpense.subtotal + (parseFloat(e.target.value) || 0)).toFixed(2)) })} /></label>
            <label className="form__row"><span className="form__label">Total</span><input required type="number" step="0.01" className="form__input" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} /></label>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="button button--secondary" onClick={() => { setAddModalOpen(false); setAddMode('file'); }}>Cancelar</button>
            <button type="submit" className="button button--primary">Registrar Cuenta por Pagar</button>
          </div>
        </form>
        )}
      </Modal>
    </WorkspaceShell>
  );
}
