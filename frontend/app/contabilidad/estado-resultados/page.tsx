'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function EstadoResultadosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccounting() {
      try {
        const result = await fetchFromApi('/api/accounting?range=month');
        setData(result);
      } catch (error) {
        console.error('Error cargando contabilidad:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAccounting();
  }, []);

  if (loading) {
    return (
      <WorkspaceShell active="/contabilidad/estado-resultados" eyebrow="Contabilidad" title="Generando reporte..." subtitle="Calculando estados financieros reales...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Procesando cifras reales desde Railway...</div>
      </WorkspaceShell>
    );
  }

  const summary = data?.summary || { salesTotal: 0, expenseTotal: 0, net: 0, margin: 0 };
  const sales = data?.sales || [];
  const expenses = data?.expenses || [];

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Estado de Resultados"
      subtitle="Visión integral de tus finanzas en tiempo real. Todos los datos provienen de tu base de datos PostgreSQL."
    >
      <section className="dashboard__grid">
        {/* Métricas Principales */}
        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header">
            <h3 className="card__title">Ventas Totales</h3>
            <span className="badge badge--success">Ingresos</span>
          </div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#27ae60' }}>{money(summary.salesTotal)}</div>
            <p className="card__label">{sales.length} facturas emitidas</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header">
            <h3 className="card__title">Gastos Totales</h3>
            <span className="badge" style={{ backgroundColor: '#fdf2f2', color: '#c0392b' }}>Egresos</span>
          </div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#c0392b' }}>{money(summary.expenseTotal)}</div>
            <p className="card__label">{expenses.length} facturas de compra</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header">
            <h3 className="card__title">Utilidad Neta</h3>
            <span className="badge">Resultado</span>
          </div>
          <div className="card__body">
            <div className="dashboard__bigAmount">{money(summary.net)}</div>
            <p className="card__label">Balance del periodo</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header">
            <h3 className="card__title">Margen Bruto</h3>
            <span className="badge">Eficiencia</span>
          </div>
          <div className="card__body">
            <div className="dashboard__bigAmount">{summary.margin.toFixed(1)}%</div>
            <p className="card__label">Porcentaje de utilidad</p>
          </div>
        </article>

        {/* Tablas Detalladas */}
        <article className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card__header">
            <h3 className="card__title">Detalle de Ventas</h3>
            <button className="chip" onClick={() => window.print()} style={{ cursor: 'pointer' }}>🖨️ PDF</button>
          </div>
          <div className="card__body">
            <div className="list">
              {sales.map((sale: any) => (
                <div key={sale.id} className="list__item">
                  <div className="list__meta">
                    <strong>{sale.customer}</strong>
                    <span>{sale.date} — Folio: {sale.invoiceNumber}</span>
                  </div>
                  <div className="list__amount" style={{ color: '#27ae60' }}>+{money(sale.amount)}</div>
                </div>
              ))}
              {sales.length === 0 && <p className="footer-note">No hay ventas registradas en este periodo.</p>}
            </div>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 6' }}>
          <div className="card__header">
            <h3 className="card__title">Detalle de Gastos</h3>
          </div>
          <div className="card__body">
            <div className="list">
              {expenses.map((exp: any) => (
                <div key={exp.id} className="list__item">
                  <div className="list__meta">
                    <strong>{exp.provider}</strong>
                    <span>{exp.category} — {exp.date}</span>
                  </div>
                  <div className="list__amount" style={{ color: '#c0392b' }}>-{money(exp.amount)}</div>
                </div>
              ))}
              {expenses.length === 0 && <p className="footer-note">No hay gastos registrados en este periodo.</p>}
            </div>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
