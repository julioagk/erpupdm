"use client";

import { useMemo, useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { buildUpdmReport, buildAIInsight, money } from '@/lib/data';

const ranges = ['day', 'week', 'month', 'year'] as const;
const rangeLabels: Record<string, string> = { day: 'Día', week: 'Semana', month: 'Mes', year: 'Año' };

export default function EstadoResultadosPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>('month');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const report = useMemo(() => buildUpdmReport(range), [range]);
  const insight = useMemo(() => buildAIInsight(range), [range]);

  const costOfSalesRows = report.rows.filter(r => r.group === 'COSTO DE VENTAS');
  const adminExpensesRows = report.rows.filter(r => r.group === 'GASTOS DE VENTA Y ADMINISTRACION');

  const totalCostOfSalesPeriod = costOfSalesRows.reduce((sum, r) => sum + r.period, 0);
  const totalCostOfSalesAccum = costOfSalesRows.reduce((sum, r) => sum + r.accum, 0);
  const totalAdminExpensesPeriod = adminExpensesRows.reduce((sum, r) => sum + r.period, 0);
  const totalAdminExpensesAccum = adminExpensesRows.reduce((sum, r) => sum + r.accum, 0);

  const pct = (val: number, base: number) =>
    base > 0 ? ((val / base) * 100).toFixed(2) : '0.00';

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Estado de resultados"
      subtitle="Visualización automática bajo el formato UPDM (Periodo vs Acumulado). Sin captura manual, basado en Bancos, Ventas y Compras."
    >
      <section className="stack">

        {/* ── IA Insight ────────────────────────────────────────────────── */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--bg-alt)' }}>
          <div className="card__body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <h3 className="card__title" style={{ margin: 0 }}>Análisis de Inteligencia Artificial</h3>
              <span className={`badge ${insight.status === 'saludable' ? 'badge--success' : insight.status === 'critico' ? 'badge--warning' : ''}`}>
                {insight.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 12px' }}>
              {insight.message}
            </p>
            <div className="chip-row">
              {insight.nextActions.map((action, i) => (
                <span key={i} className="chip" style={{ fontSize: '0.8rem', background: '#fff' }}>{action}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabla UPDM ────────────────────────────────────────────────── */}
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
                  {rangeLabels[item]}
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
                {/* INGRESOS */}
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

                {/* EGRESOS */}
                <tr className="table__section-header">
                  <td colSpan={5} style={{ paddingTop: '24px' }}><strong>Egresos</strong></td>
                </tr>

                {/* COSTO DE VENTAS */}
                <tr>
                  <td colSpan={5} style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', paddingTop: '10px' }}>
                    Costo de Ventas
                  </td>
                </tr>
                {costOfSalesRows.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.period)}</td>
                    <td style={{ textAlign: 'right' }}>{pct(row.period, report.period.sales)}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.accum)}</td>
                    <td style={{ textAlign: 'right' }}>{pct(row.accum, report.accum.sales)}</td>
                  </tr>
                ))}
                <tr style={{ color: 'var(--primary-strong)', fontWeight: '600' }}>
                  <td>Total Costo de Ventas</td>
                  <td style={{ textAlign: 'right' }}>{money(totalCostOfSalesPeriod)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(totalCostOfSalesPeriod, report.period.sales)}</td>
                  <td style={{ textAlign: 'right' }}>{money(totalCostOfSalesAccum)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(totalCostOfSalesAccum, report.accum.sales)}</td>
                </tr>

                {/* GASTOS ADM */}
                <tr>
                  <td colSpan={5} style={{ fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', paddingTop: '10px' }}>
                    Gastos de Venta y Administración
                  </td>
                </tr>
                {adminExpensesRows.map(row => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.period)}</td>
                    <td style={{ textAlign: 'right' }}>{pct(row.period, report.period.sales)}</td>
                    <td style={{ textAlign: 'right' }}>{money(row.accum)}</td>
                    <td style={{ textAlign: 'right' }}>{pct(row.accum, report.accum.sales)}</td>
                  </tr>
                ))}
                <tr style={{ color: 'var(--primary-strong)', fontWeight: '600' }}>
                  <td>Total Gastos de Venta y Administración</td>
                  <td style={{ textAlign: 'right' }}>{money(totalAdminExpensesPeriod)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(totalAdminExpensesPeriod, report.period.sales)}</td>
                  <td style={{ textAlign: 'right' }}>{money(totalAdminExpensesAccum)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(totalAdminExpensesAccum, report.accum.sales)}</td>
                </tr>

                {/* UTILIDAD */}
                <tr style={{ borderTop: '2px solid var(--text)' }}>
                  <td><strong>Utilidad (o Pérdida)</strong></td>
                  <td style={{ textAlign: 'right' }}><strong style={{ color: report.period.utility >= 0 ? 'var(--primary-strong)' : '#c0392b' }}>{money(report.period.utility)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{pct(report.period.utility, report.period.sales)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong style={{ color: report.accum.utility >= 0 ? 'var(--primary-strong)' : '#c0392b' }}>{money(report.accum.utility)}</strong></td>
                  <td style={{ textAlign: 'right' }}><strong>{pct(report.accum.utility, report.accum.sales)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Desglose individual ───────────────────────────────────────── */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Desglose individual</h3>
              <p className="card__label">Cada ingreso y gasto registrado en el periodo seleccionado.</p>
            </div>
            <button
              type="button"
              className="chip chip--active"
              onClick={() => setShowBreakdown(b => !b)}
            >
              {showBreakdown ? 'Ocultar' : 'Ver desglose'}
            </button>
          </div>

          {showBreakdown && (
            <div className="card__body stack">
              {/* Ingresos individuales */}
              <div>
                <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--primary-strong)' }}>
                  📈 Ingresos ({report.periodSales.length} facturas)
                </p>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Cliente / Receptor</th>
                      <th>Folio</th>
                      <th>Fecha</th>
                      <th>Método de Pago</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'right' }}>IVA</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.periodSales.length === 0 ? (
                      <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center' }}>Sin ventas en este periodo</td></tr>
                    ) : (
                      report.periodSales.map(sale => (
                        <tr key={sale.id}>
                          <td>{sale.customer}</td>
                          <td>{sale.invoiceNumber}</td>
                          <td>{sale.date}</td>
                          <td>{sale.paymentMethod}</td>
                          <td style={{ textAlign: 'right' }}>{money(sale.subtotal ?? 0)}</td>
                          <td style={{ textAlign: 'right' }}>{money(sale.iva ?? 0)}</td>
                          <td style={{ textAlign: 'right' }}><strong>{money(sale.amount)}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Gastos individuales */}
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px', color: '#c0392b' }}>
                  📉 Gastos y Compras ({report.periodExpenses.length} facturas)
                </p>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Proveedor / Emisor</th>
                      <th>Folio</th>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'right' }}>IVA</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.periodExpenses.length === 0 ? (
                      <tr><td colSpan={7} style={{ color: 'var(--muted)', textAlign: 'center' }}>Sin gastos en este periodo</td></tr>
                    ) : (
                      report.periodExpenses.map(exp => (
                        <tr key={exp.id}>
                          <td>{exp.provider}</td>
                          <td>{exp.invoiceNumber}</td>
                          <td>{exp.date}</td>
                          <td><span className="badge">{exp.category}</span></td>
                          <td style={{ textAlign: 'right' }}>{money(exp.subtotal ?? 0)}</td>
                          <td style={{ textAlign: 'right' }}>{money(exp.iva ?? 0)}</td>
                          <td style={{ textAlign: 'right' }}><strong>{money(exp.amount)}</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </section>

      <style jsx>{`
        .table--updm td, .table--updm th {
          padding: 6px 10px;
          font-size: 0.88rem;
        }
        .table__section-header td {
          font-size: 1rem;
          padding-top: 16px;
          padding-bottom: 6px;
        }
      `}</style>
    </WorkspaceShell>
  );
}
