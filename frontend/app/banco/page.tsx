'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { useBalance } from '@/context/balance-context';
import { money, type BankMovement } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

type AccountFilter = 'all' | 'banorte' | 'bbva';

export default function BancoPage() {
  const [movements, setMovements] = useState<BankMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AccountFilter>('all');

  // Balances y alias del contexto
  const { bankBalance, bbvaBalance, banorteAlias, bbvaAlias, setBankBalance, setBbvaBalance, setAliases, refreshBalance } = useBalance();

  // Estado para edición de saldos
  const [editingBanorte, setEditingBanorte] = useState(false);
  const [editingBbva, setEditingBbva] = useState(false);
  const [tempBanorte, setTempBanorte] = useState('');
  const [tempBbva, setTempBbva] = useState('');

  // Estado para edición de alias
  const [editingAliases, setEditingAliases] = useState(false);
  const [tempBanorteAlias, setTempBanorteAlias] = useState('');
  const [tempBbvaAlias, setTempBbvaAlias] = useState('');
  const [savingAliases, setSavingAliases] = useState(false);

  useEffect(() => {
    async function loadBank() {
      try {
        const data = await fetchFromApi('/api/bank');
        setMovements(data.items || []);
      } catch (error) {
        console.error('Error cargando banco:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBank();
  }, []);

  // Filtrado de movimientos
  const filteredMovements = movements.filter(m => {
    if (filter === 'all') return true;
    return (m as any).bankAccount === filter || (!( m as any).bankAccount && filter === 'banorte');
  });

  // Saldo total combinado
  const totalBalance = bankBalance + bbvaBalance;

  // Handlers edición saldo Banorte
  function startEditBanorte() {
    setTempBanorte(String(bankBalance));
    setEditingBanorte(true);
  }
  async function saveBanorte() {
    const val = parseFloat(tempBanorte);
    if (!isNaN(val)) await setBankBalance(val);
    setEditingBanorte(false);
    await refreshBalance();
  }

  // Handlers edición saldo BBVA
  function startEditBbva() {
    setTempBbva(String(bbvaBalance));
    setEditingBbva(true);
  }
  async function saveBbva() {
    const val = parseFloat(tempBbva);
    if (!isNaN(val)) await setBbvaBalance(val);
    setEditingBbva(false);
    await refreshBalance();
  }

  // Handlers edición alias
  function startEditAliases() {
    setTempBanorteAlias(banorteAlias);
    setTempBbvaAlias(bbvaAlias);
    setEditingAliases(true);
  }
  async function saveAliases() {
    if (!tempBanorteAlias.trim() || !tempBbvaAlias.trim()) return;
    setSavingAliases(true);
    await setAliases(tempBanorteAlias.trim(), tempBbvaAlias.trim());
    setSavingAliases(false);
    setEditingAliases(false);
  }

  if (loading) {
    return (
      <WorkspaceShell active="/banco" eyebrow="Banco" title="Cargando estado de cuenta..." subtitle="Sincronizando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Consultando saldo en tiempo real...</div>
      </WorkspaceShell>
    );
  }

  const cardBaseStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '20px',
    padding: '28px 32px',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)'
  };

  const glowStyle: React.CSSProperties = {
    position: 'absolute',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.25,
    top: '-60px',
    right: '-40px',
    pointerEvents: 'none'
  };

  return (
    <WorkspaceShell
      active="/banco"
      eyebrow="Finanzas"
      title="Estado de cuenta"
      subtitle="Gestiona y monitorea los saldos de tus cuentas bancarias en tiempo real."
    >
      <section className="dashboard__grid">

        {/* ── Saldo Total ── */}
        <article style={{ ...cardBaseStyle, gridColumn: 'span 12', background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)' }}>
          <div style={{ ...glowStyle, background: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                💰 Saldo Total Combinado
              </p>
              <div style={{ fontSize: '3.2rem', fontWeight: 800, marginTop: '8px', letterSpacing: '-1px' }}>
                {money(totalBalance)}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                {banorteAlias} + {bbvaAlias}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.78rem', fontWeight: 700 }}>
                ● En Línea
              </span>
              {!editingAliases ? (
                <button
                  onClick={startEditAliases}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✏️ Editar nombres
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.08)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>Nombre Cuenta 1</label>
                      <input
                        value={tempBanorteAlias}
                        onChange={e => setTempBanorteAlias(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '4px' }}>Nombre Cuenta 2</label>
                      <input
                        value={tempBbvaAlias}
                        onChange={e => setTempBbvaAlias(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingAliases(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', padding: '5px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={saveAliases} disabled={savingAliases} style={{ background: '#2563eb', border: 'none', borderRadius: '6px', color: 'white', padding: '5px 14px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                      {savingAliases ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* ── Tarjeta Banorte ── */}
        <article style={{ ...cardBaseStyle, gridColumn: 'span 6', background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)' }}>
          <div style={{ ...glowStyle, background: '#14b8a6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🏦</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cuenta Principal</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{banorteAlias}</p>
              </div>
            </div>
            {!editingBanorte && (
              <button onClick={startEditBanorte} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}>
                ✏️ Editar saldo
              </button>
            )}
          </div>

          {editingBanorte ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>$</span>
              <input
                type="number"
                step="0.01"
                value={tempBanorte}
                onChange={e => setTempBanorte(e.target.value)}
                autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '1.4rem', fontWeight: 700 }}
              />
              <button onClick={saveBanorte} style={{ background: '#0d9488', border: 'none', borderRadius: '8px', color: 'white', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditingBanorte(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px', marginTop: '4px' }}>{money(bankBalance)}</div>
          )}
          <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {movements.filter(m => !(m as any).bankAccount || (m as any).bankAccount === 'banorte').length} movimientos registrados
          </p>
        </article>

        {/* ── Tarjeta BBVA ── */}
        <article style={{ ...cardBaseStyle, gridColumn: 'span 6', background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' }}>
          <div style={{ ...glowStyle, background: '#3b82f6' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🏛️</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cuenta Secundaria</p>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{bbvaAlias}</p>
              </div>
            </div>
            {!editingBbva && (
              <button onClick={startEditBbva} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}>
                ✏️ Editar saldo
              </button>
            )}
          </div>

          {editingBbva ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>$</span>
              <input
                type="number"
                step="0.01"
                value={tempBbva}
                onChange={e => setTempBbva(e.target.value)}
                autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '1.4rem', fontWeight: 700 }}
              />
              <button onClick={saveBbva} style={{ background: '#1d4ed8', border: 'none', borderRadius: '8px', color: 'white', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }}>✓</button>
              <button onClick={() => setEditingBbva(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', padding: '10px 14px', fontSize: '0.85rem', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <div style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.5px', marginTop: '4px' }}>{money(bbvaBalance)}</div>
          )}
          <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
            {movements.filter(m => (m as any).bankAccount === 'bbva').length} movimientos registrados
          </p>
        </article>

        {/* ── Movimientos ── */}
        <article className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card__header">
            <div>
              <h3 className="card__title">Últimos Movimientos</h3>
              <p className="card__label">Historial de ingresos y egresos conciliados.</p>
            </div>
            {/* Filtro de cuenta */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['all', 'banorte', 'bbva'] as AccountFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--line)',
                    background: filter === f ? 'var(--primary)' : 'transparent',
                    color: filter === f ? '#fff' : 'inherit',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {f === 'all' ? 'Todas' : f === 'banorte' ? banorteAlias : bbvaAlias}
                </button>
              ))}
            </div>
          </div>
          <div className="card__body">
            <div className="list">
              {filteredMovements.map((m) => {
                const account = (m as any).bankAccount || 'banorte';
                return (
                  <div key={m.id} className="list__item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                        background: m.kind === 'ingreso' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
                      }}>
                        {m.kind === 'ingreso' ? '↑' : '↓'}
                      </div>
                      <div className="list__meta">
                        <strong>{m.concept}</strong>
                        <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {m.date}
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 700,
                            background: account === 'bbva' ? 'rgba(59,130,246,0.12)' : 'rgba(20,184,166,0.12)',
                            color: account === 'bbva' ? '#3b82f6' : '#0d9488'
                          }}>
                            {account === 'bbva' ? bbvaAlias : banorteAlias}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="list__amount" style={{ color: m.kind === 'ingreso' ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {m.kind === 'ingreso' ? '+' : '-'}{money(m.amount)}
                    </div>
                  </div>
                );
              })}
              {filteredMovements.length === 0 && (
                <p style={{ padding: '30px', color: '#64748b', textAlign: 'center' }}>
                  No hay movimientos {filter !== 'all' ? `en ${filter === 'bbva' ? bbvaAlias : banorteAlias}` : ''} registrados aún.
                </p>
              )}
            </div>
          </div>
        </article>

      </section>
    </WorkspaceShell>
  );
}
