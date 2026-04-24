'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { useBalance } from '@/context/balance-context';
import { getDashboardData, getAccountingData } from '@/lib/api';

export default function DashboardPage() {
  const { bankBalance, setBankBalance } = useBalance();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [accounting, setAccounting] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dash, acc] = await Promise.all([
          getDashboardData(),
          getAccountingData('month')
        ]);
        
        setData(dash);
        setAccounting(acc);
        
        // Sincronizar el saldo global con el del backend si es necesario
        if (dash.metrics?.bankBalance) {
          setBankBalance(dash.metrics.bankBalance);
        }
      } catch (error) {
        console.error('Error cargando datos del backend:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setBankBalance]);

  if (loading) {
    return (
      <WorkspaceShell active="/dashboard" eyebrow="Cargando..." title="Conectando con el servidor" subtitle="Estamos recuperando la información financiera en tiempo real desde Railway.">
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '300px' }}>
          <div className="loader">Cargando datos...</div>
        </div>
      </WorkspaceShell>
    );
  }

  // Si falló la carga pero tenemos datos locales como fallback (opcional)
  const monthlySales = accounting?.summary?.salesTotal || 0;
  const monthlyExpenses = accounting?.summary?.expenseTotal || 0;
  const netUtility = accounting?.summary?.net || 0;
  const margin = accounting?.summary?.margin || 0;
  
  const monthlyGoal = 60000;
  const salesProgress = Math.min(100, Math.round((monthlySales / monthlyGoal) * 100));
  
  const sales = accounting?.sales || [];
  const expenses = accounting?.expenses || [];

  return (
    <WorkspaceShell
      active="/dashboard"
      eyebrow="Pantalla principal"
      title="Visor central del negocio"
      subtitle="Aquí se ve el Estado de Resultados real, la caja en Banorte y el termómetro de ventas sincronizado con Railway."
    >
      <section className="dashboard__grid">
        <article className="card dashboard__pdfPanel">
          <div className="card__header">
            <div>
              <h3 className="card__title">Estado de Resultados (Real)</h3>
              <p className="card__label">Datos frescos obtenidos desde la API de Railway.</p>
            </div>
            <span className="badge">Sincronizado</span>
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
                    <strong>{money(netUtility)}</strong>
                  </div>
                  <div>
                    <span className="card__label">Margen</span>
                    <strong>{margin.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="dashboard__pdfSection">
                  <h5>Ingresos principales</h5>
                  <div className="dashboard__pdfRows">
                    {sales.slice(0, 4).map((sale: any) => (
                      <div key={sale.id} className="dashboard__pdfRow">
                        <span>{sale.customer}</span>
                        <strong>{money(sale.amount)}</strong>
                      </div>
                    ))}
                    {sales.length === 0 && <p className="footer-note">Sin ventas este mes.</p>}
                  </div>
                </div>

                <div className="dashboard__pdfSection">
                  <h5>Gastos principales</h5>
                  <div className="dashboard__pdfRows">
                    {expenses.slice(0, 4).map((expense: any) => (
                      <div key={expense.id} className="dashboard__pdfRow">
                        <span>{expense.provider}</span>
                        <strong>{money(expense.amount)}</strong>
                      </div>
                    ))}
                    {expenses.length === 0 && <p className="footer-note">Sin gastos este mes.</p>}
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
              <p className="card__label">Saldo real en Banorte (vía API).</p>
            </div>
            <span className="badge badge--success">En línea</span>
          </div>

          <div className="card__body stack">
            <div>
              <p className="dashboard__bigLabel">Saldo disponible</p>
              <div className="dashboard__bigAmount">{money(bankBalance)}</div>
              <p className="footer-note">Estado de cuenta actualizado según el último reporte del backend.</p>
            </div>

            <div className="dashboard__bankMeter" aria-hidden="true">
              <div className="dashboard__bankMeterFill" style={{ width: `${Math.min(100, Math.round((bankBalance / 250000) * 100))}%` }} />
            </div>

            <div className="chip-row">
              <span className="chip">Banco: Banorte</span>
              <span className="chip">Estado: Sincronizado</span>
            </div>
          </div>
        </article>

        <article className="card dashboard__thermoPanel">
          <div className="card__header">
            <div>
              <h3 className="card__title">Termómetro de Ventas</h3>
              <p className="card__label">Progreso real frente a meta mensual.</p>
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
                <p className="footer-note">Sincronizado con base de datos en Railway.</p>
              </div>

              <div className="chip-row">
                <span className="chip">Meta: {money(monthlyGoal)}</span>
                <span className="chip">Avance: {salesProgress}%</span>
                <span className="chip">Operaciones: {sales.length}</span>
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
