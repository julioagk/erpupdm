"use client";

import { useMemo, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { buildUpdmReport, buildAIInsight, money } from '@/lib/data';

const ranges = ['day', 'week', 'month'] as const;

export default function EstadoResultadosPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>('month');

  const report = useMemo(() => buildUpdmReport(range), [range]);
  const insight = useMemo(() => buildAIInsight(range), [range]);

  const costOfSalesRows = report.rows.filter(r => r.group === 'COSTO DE VENTAS');
  const adminExpensesRows = report.rows.filter(r => r.group === 'GASTOS DE VENTA Y ADMINISTRACION');

  const totalCostOfSalesPeriod = costOfSalesRows.reduce((sum, r) => sum + r.period, 0);
  const totalCostOfSalesAccum = costOfSalesRows.reduce((sum, r) => sum + r.accum, 0);

  const totalAdminExpensesPeriod = adminExpensesRows.reduce((sum, r) => sum + r.period, 0);
  const totalAdminExpensesAccum = adminExpensesRows.reduce((sum, r) => sum + r.accum, 0);

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Estado de resultados"
      subtitle="Visualización automática bajo el formato UPDM (Periodo vs Acumulado). Sin captura manual, basado en Bancos, Ventas y Compras."
    >
      <section className="stack">
        {/* IA Insight Section */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-alt)' }}>
          <div className="card__body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <h3 className="card__title" style={{ margin: 0 }}>Análisis de Inteligencia Artificial</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 12px' }}>
              {insight.message} <strong>Estado: {insight.status.toUpperCase()}</strong>.
            </p>
            <div className="chip-row">
              {insight.nextActions.map((action, i) => (
                <span key={i} className="chip" style={{ fontSize: '0.8rem', background: '#fff' }}>{action}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">UPDM S.A DE C.V</h3>
              <p className="card__label">Reporte del periodo seleccionado vs Acumulado histórico.</p>
            </div>
            <div className="chip-row">
              {ranges.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${range === item ? 'chip--active' : ''}`}
                  onClick={() => setRange(item)}
                >
                  {item === 'day' ? 'Día' : item === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="card__body" style={{ overflowX: 'auto' }}>
            <table className="table table--updm">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Concepto</th>
                  <th style={{ textAlign: 'right' }}>Periodo</th>
                  <th style={{ textAlign: 'right' }}>%</th>
                  <th style={{ textAlign: 'right' }}>Acumulado</th>
                  <th style={{ textAlign: 'right' }}>%</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table__section-header">
                  <td colSpan={5}><strong>Ingresos</strong></td>
                </tr>
                <tr>
                  <td>Ventas Nacionales</td>
                  <td style={{ textAlign: 'right' }}>{money(report.period.sales)}</td>
                  <td style={{ textAlign: 'right' }}>100.00</td>
                  <td style={{ textAlign: 'right' }}>{money(report.accum.sales)}</td>
                  <td style={{ textAlign: 'right' }}>100.00</td>
                </tr>
                <tr style={{ borderTop: '1px solid var(--line)' }}>
                  <td><strong>Total Ingresos</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{money(report.period.sales)}</strong></td>
                  <td style={{ textAlign: 'right' }}>100.00</td>
                  <td style={{ textAlign: 'right' }}><strong>{money(report.accum.sales)}</strong></td>
                  <td style={{ textAlign: 'right' }}>100.00</td>
                </tr>

                <tr className="table__section-header">
                  <td colSpan={5} style={{ paddingTop: '24px' }}><strong>Egresos</strong></td>
                </tr>
                
                {/* COSTO DE VENTAS */}
                <tr>
                  <td colSpan={5} style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', paddingTop: '12px' }}>
                    COSTO DE VENTAS
                  </td>
                </tr>
                {costOfSalesRows.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.period)}</td>
                    <td style={{ textAlign: 'right' }}>{row.periodPct.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.accum)}</td>
                    <td style={{ textAlign: 'right' }}>{row.accumPct.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ color: 'var(--primary-strong)', fontWeight: '600' }}>
                  <td>Total COSTO DE VENTAS</td>
                  <td style={{ textAlign: 'right' }}>{money(totalCostOfSalesPeriod)}</td>
                  <td style={{ textAlign: 'right' }}>{(report.period.sales > 0 ? (totalCostOfSalesPeriod / report.period.sales) * 100 : 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{money(totalCostOfSalesAccum)}</td>
                  <td style={{ textAlign: 'right' }}>{(report.accum.sales > 0 ? (totalCostOfSalesAccum / report.accum.sales) * 100 : 0).toFixed(2)}</td>
                </tr>

                {/* GASTOS ADM */}
                <tr>
                  <td colSpan={5} style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', paddingTop: '12px' }}>
                    GASTOS DE VENTA Y ADMINISTRACION
                  </td>
                </tr>
                {adminExpensesRows.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.period)}</td>
                    <td style={{ textAlign: 'right' }}>{row.periodPct.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.accum)}</td>
                    <td style={{ textAlign: 'right' }}>{row.accumPct.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ color: 'var(--primary-strong)', fontWeight: '600' }}>
                  <td>Total GASTOS DE VENTA Y ADMINISTRACION</td>
                  <td style={{ textAlign: 'right' }}>{money(totalAdminExpensesPeriod)}</td>
                  <td style={{ textAlign: 'right' }}>{(report.period.sales > 0 ? (totalAdminExpensesPeriod / report.period.sales) * 100 : 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{money(totalAdminExpensesAccum)}</td>
                  <td style={{ textAlign: 'right' }}>{(report.accum.sales > 0 ? (totalAdminExpensesAccum / report.accum.sales) * 100 : 0).toFixed(2)}</td>
                </tr>

                <tr style={{ borderTop: '2px solid var(--text)', paddingTop: '12px' }}>
                  <td><strong>Utilidad (o Pérdida)</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{money(report.period.utility)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{(report.period.sales > 0 ? (report.period.utility / report.period.sales) * 100 : 0).toFixed(2)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{money(report.accum.utility)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{(report.accum.sales > 0 ? (report.accum.utility / report.accum.sales) * 100 : 0).toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style jsx>{`
        .table--updm td {
          padding: 6px 10px;
          font-size: 0.9rem;
        }
        .table__section-header td {
          font-size: 1.1rem;
          padding-top: 16px;
          padding-bottom: 8px;
        }
      `}</style>
    </WorkspaceShell>
  );
}
