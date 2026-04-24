'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money, type BankMovement } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function BancoPage() {
  const [movements, setMovements] = useState<BankMovement[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBank() {
      try {
        const data = await fetchFromApi('/api/bank');
        setMovements(data.items || []);
        setBalance(data.balance || 0);
      } catch (error) {
        console.error('Error cargando banco:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBank();
  }, []);

  if (loading) {
    return (
      <WorkspaceShell active="/banco" eyebrow="Banco" title="Cargando estado de cuenta..." subtitle="Sincronizando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Consultando saldo en tiempo real...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/banco"
      eyebrow="Finanzas"
      title="Estado de cuenta"
      subtitle="Aquí se ve el saldo real de Banorte y los movimientos conciliados en tu base de datos."
    >
      <section className="dashboard__grid">
        <article className="card dashboard__bankPanel" style={{ gridColumn: 'span 12' }}>
          <div className="card__header">
            <div>
              <h3 className="card__title">Saldo en Banorte</h3>
              <p className="card__label">Saldo disponible calculado de todas tus operaciones.</p>
            </div>
            <span className="badge badge--success">En Línea</span>
          </div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ fontSize: '3rem' }}>{money(balance)}</div>
            <p className="footer-note">Actualizado automáticamente con cada factura registrada.</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card__header">
            <h3 className="card__title">Últimos Movimientos</h3>
          </div>
          <div className="card__body">
            <div className="list">
              {movements.map((m) => (
                <div key={m.id} className="list__item">
                  <div className="list__meta">
                    <strong>{m.concept}</strong>
                    <span>{m.date}</span>
                  </div>
                  <div className="list__amount" style={{ color: m.kind === 'ingreso' ? '#27ae60' : '#c0392b' }}>
                    {m.kind === 'ingreso' ? '+' : '-'}{money(m.amount)}
                  </div>
                </div>
              ))}
              {movements.length === 0 && <p style={{ padding: '20px', color: '#666' }}>No hay movimientos registrados aún.</p>}
            </div>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
