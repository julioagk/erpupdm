'use client';

import { WorkspaceShell } from '@/components/workspace-shell';
import { dashboardSeed, expenseInvoices, money, salesInvoices, sumAmounts } from '@/lib/data';
import { useBalance } from '@/context/balance-context';

export default function BancoPage() {
  const { bankBalance } = useBalance();

  // ── Todo lo que se sube ya está confirmado (sin estados) ──────────────────
  const totalSales    = sumAmounts(salesInvoices);   // Suma total de VENTAS registradas
  const totalExpenses = sumAmounts(expenseInvoices); // Suma total de COMPRAS registradas

  // ── Balance ───────────────────────────────────────────────────────────────
  const totalAssets      = bankBalance + totalSales;   // Banco + lo que se ha vendido
  const totalLiabilities = totalExpenses;              // Todo lo que se ha comprado/gastado
  const capitalTotal     = totalAssets - totalLiabilities;

  return (
    <WorkspaceShell
      active="/banco"
      eyebrow="Banco"
      title="Estado actual de la empresa"
      subtitle="Calculado automáticamente desde las listas de Ventas y Compras. Todo lo registrado ya está confirmado."
    >
      <section className="stack">

        {/* ── Resumen superior ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Resumen financiero</h3>
              <p className="card__label">Datos extraídos directamente del sistema.</p>
            </div>
            <span className="badge">Banco principal</span>
          </div>
          <div className="card__body">
            <div className="bank__summaryGrid">
              <article className="bank__summaryCard">
                <p className="bank__summaryLabel">Activo (Valor)</p>
                <strong>{money(totalAssets)}</strong>
                <span>Banco + Ventas registradas</span>
              </article>
              <article className="bank__summaryCard">
                <p className="bank__summaryLabel">Pasivo (Compromisos)</p>
                <strong>{money(totalLiabilities)}</strong>
                <span>Total de compras y gastos</span>
              </article>
              <article className="bank__summaryCard">
                <p className="bank__summaryLabel">Capital (Riqueza Real)</p>
                <strong>{money(capitalTotal)}</strong>
                <span>Activo − Pasivo</span>
              </article>
            </div>
            <div className="chip-row" style={{ marginTop: '16px' }}>
              <span className="chip">Ventas registradas: {salesInvoices.length}</span>
              <span className="chip">Compras registradas: {expenseInvoices.length}</span>
              <span className="chip">Saldo Banorte: {money(bankBalance)}</span>
            </div>
          </div>
        </div>

        {/* ── Desglose ─────────────────────────────────────────────────── */}
        <section className="bank__breakdownGrid">

          {/* ACTIVO */}
          <article className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Activo (Valor)</h3>
                <p className="card__label">Lo que la empresa tiene.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="bank__lineItem">
                <div>
                  <strong>Dinero en banco</strong>
                  <p>Saldo actual en Banorte</p>
                </div>
                <strong>{money(bankBalance)}</strong>
              </div>
              <div className="bank__lineItem">
                <div>
                  <strong>Total ventas ({salesInvoices.length} facturas)</strong>
                  <p>Suma de todas las ventas registradas en el sistema</p>
                </div>
                <strong>{money(totalSales)}</strong>
              </div>
              <div className="bank__lineItem bank__lineItem--total">
                <div><strong>Total Activo</strong></div>
                <strong>{money(totalAssets)}</strong>
              </div>
            </div>
          </article>

          {/* PASIVO */}
          <article className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Pasivo (Compromisos)</h3>
                <p className="card__label">Lo que la empresa ha gastado/comprometido.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="bank__lineItem">
                <div>
                  <strong>Total compras y gastos ({expenseInvoices.length} facturas)</strong>
                  <p>Suma de todas las compras y gastos registrados</p>
                </div>
                <strong>{money(totalExpenses)}</strong>
              </div>
              <div className="bank__lineItem bank__lineItem--total">
                <div><strong>Total Pasivo</strong></div>
                <strong>{money(totalLiabilities)}</strong>
              </div>
            </div>
          </article>

          {/* CAPITAL */}
          <article className="card">
            <div className="card__header">
              <div>
                <h3 className="card__title">Capital (Riqueza Real)</h3>
                <p className="card__label">Lo que le queda al negocio: Activo − Pasivo.</p>
              </div>
            </div>
            <div className="card__body stack">
              <div className="bank__lineItem">
                <div>
                  <strong>Activo total</strong>
                  <p>Banco + Ventas</p>
                </div>
                <strong>{money(totalAssets)}</strong>
              </div>
              <div className="bank__lineItem">
                <div>
                  <strong>Pasivo total</strong>
                  <p>Compras y gastos registrados</p>
                </div>
                <strong>− {money(totalLiabilities)}</strong>
              </div>
              <div className="bank__lineItem bank__lineItem--total">
                <div>
                  <strong>Capital neto</strong>
                  <p>Riqueza real de la empresa</p>
                </div>
                <strong>{money(capitalTotal)}</strong>
              </div>
            </div>
          </article>

        </section>
      </section>
    </WorkspaceShell>
  );
}
