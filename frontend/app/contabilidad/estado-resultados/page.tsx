'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function EstadoResultadosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');

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
        const result = await fetchFromApi('/api/accounting?range=all');
        setData(result);
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

  // Lógica de Filtrado por Rango (Inmune a zonas horarias)
  const now = new Date();
  const filterByRange = (dateStr: string) => {
    if (!dateStr) return false;
    
    // Extraer YYYY, MM, DD directamente del string (ej: "2026-04-24T...")
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    const itemTime = new Date(y, m - 1, d).getTime(); // Medianoche local del item
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTime = today.getTime();

    if (range === 'all') return true;
    if (range === 'day') return itemTime === todayTime;
    if (range === 'year') return y === now.getFullYear();
    if (range === 'month') return y === now.getFullYear() && (m - 1) === now.getMonth();
    if (range === 'week') {
      const diff = todayTime - itemTime;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      return diff >= 0 && diff <= sevenDaysMs;
    }
    return true;
  };

  const allInvoices = data?.items || [];
  const periodoSales = allInvoices.filter((i: any) => i.type === 'SALE' && filterByRange(i.date));
  const periodoExpenses = allInvoices.filter((i: any) => i.type === 'EXPENSE' && filterByRange(i.date));
  
  const acumuladoSales = allInvoices.filter((i: any) => i.type === 'SALE' && new Date(i.date).getFullYear() === now.getFullYear());
  const acumuladoExpenses = allInvoices.filter((i: any) => i.type === 'EXPENSE' && new Date(i.date).getFullYear() === now.getFullYear());

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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        {(['day', 'week', 'month', 'year', 'all'] as const).map(r => (
          <button 
            key={r}
            className={`chip ${range === r ? 'chip--active' : ''}`}
            onClick={() => setRange(r)}
            style={{ padding: '10px 20px', cursor: 'pointer', border: range === r ? '2px solid var(--primary)' : '1px solid #ddd' }}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* 2. Cuadros de Resumen (Tarjetas) */}
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

      {/* 3. Estado de Resultados (Tabla Formal) */}
      <div className="card" style={{ background: 'white', color: 'black', padding: '60px', fontFamily: 'serif', maxWidth: '1200px', margin: '0 auto 40px auto', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
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
            
            {/* Costo de Ventas Placeholder */}
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>COSTO DE VENTAS</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            {/* Gastos de Administración (Todos, incluso ceros) */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '15px' }}>GASTOS DE VENTA Y ADMINISTRACION</td></tr>
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

            {/* Secciones Adicionales */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '15px' }}>COSTO INTEGRAL DE FINANCIAMIENTO</td></tr>
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '10px' }}>OTROS INGRESOS Y GASTOS</td></tr>
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', paddingTop: '10px' }}>ISR Y PTU</td></tr>

            <tr style={{ fontWeight: 'bold', borderTop: '2px solid black', backgroundColor: '#f5f5f5' }}>
              <td style={{ fontStyle: 'italic', padding: '15px 10px' }}>Total Egresos</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>

            <tr style={{ height: '50px' }}></tr>

            <tr style={{ fontWeight: 'bold', borderTop: '3px double black', fontSize: '16px', backgroundColor: '#fff' }}>
              <td style={{ fontStyle: 'italic', padding: '20px 10px' }}>Utilidad (o Pérdida)</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos - totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoIngresos - totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos - totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoIngresos - totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', textAlign: 'right' }}>
           <button className="button button--secondary" onClick={() => window.print()} style={{ marginRight: '10px' }}>🖨️ Imprimir Reporte</button>
        </div>
      </div>

      {/* 4. Desglose Detallado */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Desglose Detallado ({rangeLabels[range]})</h3>
        
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
                      <strong>{e.provider}</strong>
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
