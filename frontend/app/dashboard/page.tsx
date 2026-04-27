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
  const [monthlyGoal, setMonthlyGoal] = useState<number>(60000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(60000);

  useEffect(() => {
    const savedGoal = localStorage.getItem('monthly_sales_goal');
    if (savedGoal) {
      setMonthlyGoal(Number(savedGoal));
      setTempGoal(Number(savedGoal));
    }
  }, []);

  const handleSaveGoal = () => {
    setMonthlyGoal(tempGoal);
    localStorage.setItem('monthly_sales_goal', tempGoal.toString());
    setIsEditingGoal(false);
  };

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
  
  // monthlyGoal ahora se maneja por estado
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
                        <span>{expense.issuer}</span>
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
                {isEditingGoal ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      value={tempGoal} 
                      onChange={(e) => setTempGoal(Number(e.target.value))}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', width: '120px', color: '#333' }}
                    />
                    <button onClick={handleSaveGoal} style={{ cursor: 'pointer', background: '#27ae60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>Guardar</button>
                    <button onClick={() => setIsEditingGoal(false)} style={{ cursor: 'pointer', background: '#7f8c8d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span 
                      className="chip" 
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }} 
                      onClick={() => { setTempGoal(monthlyGoal); setIsEditingGoal(true); }}
                      title="Haz clic para editar la meta"
                    >
                      Meta: {money(monthlyGoal)} ✏️
                    </span>
                    <span className="chip">Avance: {salesProgress}%</span>
                    <span className="chip">Operaciones: {sales.length}</span>
                  </>
                )}
              </div>

              <div className="metric__bar">
                <span style={{ width: `${salesProgress}%` }} />
              </div>
            </div>
          </div>
        </article>
        {/* Gráfica de Evolución Mensual */}
        <article className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card__header">
            <div>
              <h3 className="card__title">Evolución Mensual (Ventas vs Gastos)</h3>
              <p className="card__label">Comparativa de flujo en los últimos meses.</p>
            </div>
            <div className="chip-row">
              <span className="chip" style={{ background: '#27ae60', color: 'white' }}>● Ventas</span>
              <span className="chip" style={{ background: '#c0392b', color: 'white' }}>● Gastos</span>
            </div>
          </div>
          <div className="card__body">
            {(() => {
              // Calcular los últimos 6 meses reales en base a las facturas
              const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();

              const months: string[] = [];
              const salesData: number[] = [0, 0, 0, 0, 0, 0];
              const expensesData: number[] = [0, 0, 0, 0, 0, 0];

              for (let i = 5; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - i, 1);
                months.push(monthsNames[d.getMonth()]);
              }

              // Agrupar ventas reales
              const salesList = accounting?.sales || [];
              salesList.forEach((s: any) => {
                if (!s.date) return;
                const sDate = new Date(s.date.slice(0, 10));
                for (let i = 5; i >= 0; i--) {
                  const d = new Date(currentYear, currentMonth - i, 1);
                  if (sDate.getFullYear() === d.getFullYear() && sDate.getMonth() === d.getMonth()) {
                    salesData[5 - i] += s.amount || 0;
                  }
                }
              });

              // Agrupar gastos reales
              const expensesList = accounting?.expenses || [];
              expensesList.forEach((e: any) => {
                if (!e.date) return;
                const eDate = new Date(e.date.slice(0, 10));
                for (let i = 5; i >= 0; i--) {
                  const d = new Date(currentYear, currentMonth - i, 1);
                  if (eDate.getFullYear() === d.getFullYear() && eDate.getMonth() === d.getMonth()) {
                    expensesData[5 - i] += e.amount || 0;
                  }
                }
              });

              const maxVal = Math.max(...salesData, ...expensesData, 10000) * 1.2;

              return (
                <svg width="100%" height="260" style={{ overflow: 'visible', padding: '20px 10px 40px 10px' }}>
                  {/* Líneas de cuadrícula horizontales */}
                  {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const val = Math.round(maxVal * (1 - p));
                    const y = idx * 50;
                    return (
                      <g key={idx}>
                        <line x1="40" y1={y} x2="100%" y2={y} stroke="#eee" strokeWidth="1" strokeDasharray="5,5" />
                        <text x="0" y={y + 5} fontSize="11" fill="#888" fontFamily="sans-serif">
                          {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Barras */}
                  {months.map((m, idx) => {
                    const xBase = 60 + idx * 80;
                    const barWidth = 24;

                    const salesH = (salesData[idx] / maxVal) * 200;
                    const expensesH = (expensesData[idx] / maxVal) * 200;

                    const salesY = 200 - salesH;
                    const expensesY = 200 - expensesH;

                    return (
                      <g key={m}>
                        {/* Barra Ventas */}
                        <rect
                          x={xBase}
                          y={salesY}
                          width={barWidth}
                          height={salesH}
                          fill="url(#salesGrad)"
                          rx="4"
                          style={{ cursor: 'pointer' }}
                        >
                          <title>{`Ventas ${m}: ${money(salesData[idx])}`}</title>
                        </rect>
                        {salesData[idx] > 0 && (
                          <text x={xBase + barWidth/2} y={salesY - 5} fontSize="9" fontWeight="700" fill="#27ae60" textAnchor="middle" fontFamily="sans-serif">
                            {salesData[idx] >= 1000 ? `${(salesData[idx]/1000).toFixed(1)}k` : salesData[idx]}
                          </text>
                        )}

                        {/* Barra Gastos */}
                        <rect
                          x={xBase + barWidth + 4}
                          y={expensesY}
                          width={barWidth}
                          height={expensesH}
                          fill="url(#expensesGrad)"
                          rx="4"
                          style={{ cursor: 'pointer' }}
                        >
                          <title>{`Gastos ${m}: ${money(expensesData[idx])}`}</title>
                        </rect>
                        {expensesData[idx] > 0 && (
                          <text x={xBase + barWidth + 4 + barWidth/2} y={expensesY - 5} fontSize="9" fontWeight="700" fill="#c0392b" textAnchor="middle" fontFamily="sans-serif">
                            {expensesData[idx] >= 1000 ? `${(expensesData[idx]/1000).toFixed(1)}k` : expensesData[idx]}
                          </text>
                        )}

                        {/* Texto del mes */}
                        <text
                          x={xBase + barWidth - 2}
                          y="225"
                          fontSize="12"
                          fontWeight="700"
                          fill="#555"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          {m}
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2ecc71" />
                      <stop offset="100%" stopColor="#27ae60" />
                    </linearGradient>
                    <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e74c3c" />
                      <stop offset="100%" stopColor="#c0392b" />
                    </linearGradient>
                  </defs>
                </svg>
              );
            })()}
          </div>
        </article>


      </section>
    </WorkspaceShell>
  );
}
