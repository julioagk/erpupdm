'use client';

import { WorkspaceShell } from '@/components/workspace-shell';
import {
  bankMovements,
  buildAccountingSummary,
  dashboardSeed,
  filterByRange,
  money,
  salesInvoices,
  sumAmounts
} from '@/lib/data';
import { useBalance } from '@/context/balance-context';

export default function DashboardPage() {
  const { bankBalance } = useBalance();
  const monthSummary = buildAccountingSummary('month');
  const monthlySales = monthSummary.salesTotal;
  const monthlyExpenses = monthSummary.expenseTotal;
  const monthlyGoal = 60000;
  const salesProgress = Math.min(100, Math.round((monthlySales / monthlyGoal) * 100));
  const reconciledMovements = bankMovements.filter((movement) => movement.status === 'conciliado').length;
  const pendingMovements = bankMovements.filter((movement) => movement.status === 'pendiente').length;
  const salesByDay = filterByRange(salesInvoices, 'day');
  const todaySales = sumAmounts(salesByDay);

  return (
    <WorkspaceShell
      active="/dashboard"
      eyebrow="Pantalla principal"
      title="Visor central del negocio"
      subtitle="Aqui se ve el Estado de Resultados, la caja real en Banorte y el termometro de ventas del mes actual."
    >
      <section className="dashboard__grid">
        <article className="card dashboard__pdfPanel">
          <div className="card__header">
            <div>
              <h3 className="card__title">Visualizador de PDF</h3>
              <p className="card__label">Estado de resultados del mes con ingreso, gasto y utilidad neta.</p>
            </div>
            <span className="badge">Estado de resultados</span>
          </div>

          <div className="card__body">
            <div className="dashboard__pdfFrame" aria-label="Visualizador del estado de resultados">
              <div className="dashboard__pdfPage">
                <div className="dashboard__pdfHeader">
                  <div>
                    <p className="dashboard__pdfEyebrow">Documento del mes</p>
                    <h4 className="dashboard__pdfTitle">Estado de Resultados</h4>
                  </div>
                  <div className="dashboard__pdfStamp">
                    <strong>Actualizado</strong>
                    <span>Periodo mensual</span>
                  </div>
                </div>

                <div className="dashboard__pdfSummary">
                  <div>
                    <span className="card__label">Ventas del mes</span>
                    <strong>{money(monthlySales)}</strong>
                  </div>
                  <div>
                    <span className="card__label">Gastos del mes</span>
                    <strong>{money(monthlyExpenses)}</strong>
                  </div>
                  <div>
                    <span className="card__label">Utilidad neta</span>
                    <strong>{money(monthSummary.net)}</strong>
                  </div>
                  <div>
                    <span className="card__label">Margen</span>
                    <strong>{monthSummary.margin.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="dashboard__pdfSection">
                  <h5>Ingresos principales</h5>
                  <div className="dashboard__pdfRows">
                    {monthSummary.sales.map((sale) => (
                      <div key={sale.id} className="dashboard__pdfRow">
                        <span>{sale.customer}</span>
                        <strong>{money(sale.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard__pdfSection">
                  <h5>Gastos principales</h5>
                  <div className="dashboard__pdfRows">
                    {monthSummary.expenses.map((expense) => (
                      <div key={expense.id} className="dashboard__pdfRow">
                        <span>{expense.provider}</span>
                        <strong>{money(expense.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="card dashboard__bankPanel">
          <div className="card__header">
            <div>
              <h3 className="card__title">Caja de Banco</h3>
              <p className="card__label">Saldo real en Banorte.</p>
            </div>
            <span className="badge badge--success">Banorte</span>
          </div>

          <div className="card__body stack">
            <div>
              <p className="dashboard__bigLabel">Saldo disponible</p>
              <div className="dashboard__bigAmount">{money(bankBalance)}</div>
              <p className="footer-note">Estado de cuenta actualizado según el último reporte.</p>
            </div>

            <div className="dashboard__bankMeter" aria-hidden="true">
              <div className="dashboard__bankMeterFill" style={{ width: `${Math.min(100, Math.round((bankBalance / 250000) * 100))}%` }} />
            </div>

            <div className="chip-row">
              <span className="chip">Banco: Banorte</span>
              <span className="chip">Saldo: {money(bankBalance)}</span>
            </div>
          </div>
        </article>

        <article className="card dashboard__thermoPanel">
          <div className="card__header">
            <div>
              <h3 className="card__title">Termómetro de Ventas</h3>
              <p className="card__label">Cuánto llevamos vendido en el mes actual.</p>
            </div>
            <span className="badge">Meta mensual</span>
          </div>

          <div className="card__body dashboard__thermoLayout">
            <div className="dashboard__thermoTrack" aria-hidden="true">
              <div className="dashboard__thermoFill" style={{ height: `${salesProgress}%` }} />
            </div>

            <div className="dashboard__thermoCopy">
              <div>
                <p className="dashboard__bigLabel">Ventas acumuladas</p>
                <div className="dashboard__bigAmount">{money(monthlySales)}</div>
                <p className="footer-note">Hoy llevamos {money(todaySales)} en ventas.</p>
              </div>

              <div className="chip-row">
                <span className="chip">Meta del mes: {money(monthlyGoal)}</span>
                <span className="chip">Avance: {salesProgress}%</span>
                <span className="chip">Ventas registradas: {monthSummary.sales.length}</span>
                <span className="chip">Gastos del mes: {money(monthlyExpenses)}</span>
              </div>

              <div className="metric__bar">
                <span style={{ width: `${salesProgress}%` }} />
              </div>
            </div>
          </div>
        </article>
      </section>
    </WorkspaceShell>
  );
}
