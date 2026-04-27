'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi, getAiInsight } from '@/lib/api';

export default function EstadoResultadosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [showAi, setShowAi] = useState(false);

  const expenseCategories = [
    'Mensajería',
    'Gastos de Administración',
    'Honorarios Administrativos',
    'Arrendamiento de Inmuebles',
    'Viáticos y Gastos de Viaje',
    'Gastos de Oficina',
    'Combustibles y Lubricantes',
    'Otros Impuestos y Derechos',
    'Suscripciones y Cuotas',
    'Comisiones Bancarias',
    'Partidas No Deducibles'
  ];

  useEffect(() => {
    async function loadAccounting() {
      setLoading(true);
      try {
        const [result, ai] = await Promise.all([
          fetchFromApi('/api/accounting?range=all'),
          getAiInsight('month')
        ]);
        setData(result);
        setAiInsight(ai);
      } catch (error) {
        console.error('Error cargando contabilidad:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAccounting();
  }, []);

  if (loading || !data) {
    return (
      <WorkspaceShell active="/contabilidad/estado-resultados" eyebrow="Contabilidad" title="Generando reporte..." subtitle="Calculando estados financieros reales...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Procesando cifras reales desde Railway...</div>
      </WorkspaceShell>
    );
  }

  // Lógica de Filtrado por Rango (Máxima robustez: comparando strings YYYY-MM-DD locales)
  const now = new Date();
  const nY = now.getFullYear();
  const nM = String(now.getMonth() + 1).padStart(2, '0');
  const nD = String(now.getDate()).padStart(2, '0');
  const todayYMD = `${nY}-${nM}-${nD}`;

  const filterByRange = (dateStr: string) => {
    if (!dateStr) return false;
    
    // Extraer solo la parte de la fecha YYYY-MM-DD
    const itemYMD = dateStr.slice(0, 10);
    const [iY, iM, iD] = itemYMD.split('-').map(Number);

    if (range === 'all') return true;
    if (range === 'day') return itemYMD === todayYMD;
    if (range === 'year') return iY === nY;
    if (range === 'month') return iY === nY && String(iM).padStart(2, '0') === nM;
    if (range === 'week') {
      const itemDate = new Date(iY, iM - 1, iD).getTime();
      const todayDate = new Date(nY, now.getMonth(), now.getDate()).getTime();
      const diff = todayDate - itemDate;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return diff >= 0 && diff <= sevenDaysMs;
    }
    return true;
  };

  const allInvoices = data?.items || [];
  
  // Para filtros de periodo usamos createdAt (fecha de registro en el sistema)
  const periodoSales = allInvoices.filter((i: any) => i.type === 'SALE' && filterByRange(i.createdAt || i.date));
  const periodoExpenses = allInvoices.filter((i: any) => i.type === 'EXPENSE' && filterByRange(i.createdAt || i.date));
  
  // Para acumulado anual usamos createdAt también
  const acumuladoSales = allInvoices.filter((i: any) => {
    const d = i.createdAt || i.date;
    return i.type === 'SALE' && d && d.slice(0, 4) === String(now.getFullYear());
  });
  const acumuladoExpenses = allInvoices.filter((i: any) => {
    const d = i.createdAt || i.date;
    return i.type === 'EXPENSE' && d && d.slice(0, 4) === String(now.getFullYear());
  });

  const totalPeriodoIngresos = periodoSales.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalAcumuladoIngresos = acumuladoSales.reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const getCategoryTotal = (expenses: any[], cat: string) => expenses.filter(e => e.category === cat).reduce((acc, cur) => acc + cur.amount, 0);

  const totalPeriodoEgresos = periodoExpenses.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalAcumuladoEgresos = acumuladoExpenses.reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const pct = (val: number, total: number) => total > 0 ? ((val / total) * 100).toFixed(2) : '0.00';
  const fmt = (val: number) => val === 0 ? '-' : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rangeLabels = { day: 'Hoy', week: 'Última Semana', month: 'Este Mes', year: 'Este Año', all: 'Histórico' };

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Dashboard Financiero"
      subtitle="Control total de ingresos, egresos y liquidez bancaria."
    >
      {/* 1. Filtros de Tiempo */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {(['day', 'week', 'month', 'year', 'all'] as const).map(r => (
          <button 
            key={r}
            className={`chip ${range === r ? 'chip--active' : ''}`}
            onClick={() => setRange(r)}
            style={{ padding: '10px 20px', cursor: 'pointer', border: range === r ? '2px solid var(--primary)' : '1px solid var(--line)', borderRadius: '999px', background: range === r ? 'var(--accent-soft)' : '#fff' }}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>
      
      {/* El análisis IA se reubicó en la sección inferior con botón de despliegue */}

      {/* 3. Cuadros de Resumen (Tarjetas) */}
      <section className="dashboard__grid" style={{ marginBottom: '40px' }}>
        <article className="card" style={{ gridColumn: 'span 4', borderLeft: '5px solid #27ae60' }}>
          <div className="card__header"><h3 className="card__title">Total Ingresos</h3></div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#27ae60' }}>{fmt(totalPeriodoIngresos)}</div>
            <p className="card__label">{rangeLabels[range]}</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 4', borderLeft: '5px solid #c0392b' }}>
          <div className="card__header"><h3 className="card__title">Total Egresos</h3></div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#c0392b' }}>{fmt(totalPeriodoEgresos)}</div>
            <p className="card__label">{rangeLabels[range]}</p>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 4', borderLeft: '5px solid var(--primary)' }}>
          <div className="card__header"><h3 className="card__title">Saldo en Banco</h3></div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: 'var(--primary)' }}>{fmt(data.bankBalance)}</div>
            <p className="card__label">Liquidez Real (Banorte)</p>
          </div>
        </article>
      </section>

      {/* 4. Estado de Resultados (Tabla Formal) */}
      <div id="updm-report" className="card" style={{ background: 'white', color: 'black', padding: '60px', fontFamily: 'serif', maxWidth: '1200px', margin: '0 auto 40px auto', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', letterSpacing: '3px' }}>UPDM</h1>
          <h2 style={{ fontSize: '16px', fontWeight: 'normal', margin: '5px 0' }}>Estado de Resultados ({rangeLabels[range]})</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th style={{ textAlign: 'left', padding: '15px 0' }}>Descripción</th>
              <th style={{ textAlign: 'right', width: '18%' }}>Periodo</th>
              <th style={{ textAlign: 'right', width: '10%' }}>%</th>
              <th style={{ textAlign: 'right', width: '18%' }}>Acumulado</th>
              <th style={{ textAlign: 'right', width: '10%' }}>%</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{ padding: '20px 0 5px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px' }}>Ingresos</td></tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>Ventas Nacionales</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
            </tr>
            <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
              <td style={{ fontStyle: 'italic', padding: '10px 0' }}>Total Ingresos</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
            </tr>

            <tr><td colSpan={5} style={{ padding: '25px 0 5px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '14px' }}>Egresos</td></tr>
            
            {/* Costo de Ventas */}
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>COSTO DE VENTAS</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>
            <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ddd' }}>
              <td style={{ paddingLeft: '20px' }}>TOTAL COSTO DE VENTAS</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            {/* Gastos de Venta y Administración */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '20px' }}>GASTOS DE VENTA Y ADMINISTRACION</td></tr>
            {expenseCategories.map(cat => {
              const perTotal = getCategoryTotal(periodoExpenses, cat);
              const acuTotal = getCategoryTotal(acumuladoExpenses, cat);
              return (
                <tr key={cat}>
                  <td style={{ paddingLeft: '20px', padding: '4px 20px' }}>{cat}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(perTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(perTotal, totalPeriodoIngresos)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(acuTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(acuTotal, totalAcumuladoIngresos)}</td>
                </tr>
              );
            })}
            
            <tr style={{ fontWeight: 'bold', borderTop: '1px solid black' }}>
              <td style={{ paddingLeft: '20px', padding: '10px 0' }}>TOTAL DE GASTOS DE VENTAS Y ADMINISTRACION</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>

            {/* Secciones Adicionales */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '15px' }}>COSTO INTEGRAL DE FINANCIAMIENTO</td></tr>
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '10px' }}>OTROS INGRESOS Y GASTOS</td></tr>
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '10px' }}>ISR Y PTU</td></tr>

            <tr style={{ fontWeight: 'bold', borderTop: '2px solid black', backgroundColor: '#f5f5f5' }}>
              <td style={{ fontStyle: 'italic', padding: '15px 10px' }}>Total Egresos (Gastos + Costos de venta)</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos + 0)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoEgresos + 0, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos + 0)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoEgresos + 0, totalAcumuladoIngresos)}</td>
            </tr>

            <tr style={{ height: '50px' }}></tr>

            <tr style={{ fontWeight: 'bold', borderTop: '3px double black', fontSize: '16px', backgroundColor: '#fff' }}>
              <td style={{ fontStyle: 'italic', padding: '20px 10px' }}>Utilidad (o Pérdida) Final</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos - totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoIngresos - totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos - totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoIngresos - totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
           <button 
             className="button button--secondary" 
             onClick={() => setShowAi(!showAi)}
             style={{ padding: '10px 20px', cursor: 'pointer', background: showAi ? '#e2e8f0' : '#fff' }}
           >
             {showAi ? '🤖 Ocultar Análisis IA' : '🤖 Ver Análisis IA'}
           </button>
           <button className="button button--secondary" onClick={() => window.print()}>🖨️ Imprimir Reporte</button>
        </div>
      </div>

      {/* Panel Análisis IA (Abajo y Escondido) */}
      {showAi && aiInsight && (
        <article className="card" style={{ marginTop: '30px', marginBottom: '30px', borderLeft: '5px solid #2980b9' }}>
          <div className="card__header" style={{ padding: '20px 20px 0' }}>
            <div>
              <h3 className="card__title" style={{ fontSize: '1.4rem' }}>🤖 Análisis Inteligente (IA)</h3>
              <p className="card__label">Diagnóstico de rentabilidad y salud financiera del negocio.</p>
            </div>
            <span className={`badge ${aiInsight.status === 'saludable' ? 'badge--success' : aiInsight.status === 'estable' ? 'badge--warning' : 'badge--warning'}`} style={{ fontSize: '1rem', padding: '10px 20px' }}>
              {aiInsight.status?.toUpperCase()}
            </span>
          </div>
          <div className="card__body" style={{ padding: '20px' }}>
            <div className="stack" style={{ gap: '20px' }}>
              <p style={{ color: '#2c3e50', fontSize: '1.2rem', lineHeight: '1.6', background: '#f5f7fa', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: 0 }}>
                "{aiInsight.message}"
              </p>
              <div>
                <h5 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '0.9rem', color: '#7f8c8d', letterSpacing: '0.1em' }}>Próximas acciones sugeridas:</h5>
                <ul style={{ paddingLeft: '20px', margin: 0, display: 'grid', gap: '10px' }}>
                  {aiInsight.nextActions?.map((action: string, i: number) => (
                    <li key={i} style={{ color: '#34495e', fontSize: '1rem', lineHeight: '1.5' }}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* 5. Desglose Detallado */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', marginBottom: '20px' }}>Desglose Detallado ({rangeLabels[range]})</h3>
        
        <div className="dashboard__grid">
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card__header"><h4 className="card__title">Ingresos (Ventas)</h4></div>
            <div className="card__body">
              <div className="list">
                {periodoSales.map((s: any) => (
                  <div key={s.id} className="list__item">
                    <div className="list__meta">
                      <strong>{s.customer}</strong>
                      <span>{s.date.split('T')[0]} — {s.invoiceNumber}</span>
                    </div>
                    <div style={{ color: '#27ae60', fontWeight: 'bold' }}>+{fmt(s.amount)}</div>
                  </div>
                ))}
                {periodoSales.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No hay movimientos en este rango.</p>}
              </div>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="card__header"><h4 className="card__title">Egresos (Gastos)</h4></div>
            <div className="card__body">
              <div className="list">
                {periodoExpenses.map((e: any) => (
                  <div key={e.id} className="list__item">
                    <div className="list__meta">
                      <strong>{e.issuer}</strong>
                      <span>{e.category} — {e.date.split('T')[0]}</span>
                    </div>
                    <div style={{ color: '#c0392b', fontWeight: 'bold' }}>-{fmt(e.amount)}</div>
                  </div>
                ))}
                {periodoExpenses.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No hay movimientos en este rango.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
