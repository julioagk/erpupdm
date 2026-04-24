'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

const CATEGORIES = [
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

  // Agrupar gastos por categoría para el reporte contable
  const groupedExpenses = CATEGORIES.reduce((acc: any, cat: string) => {
    acc[cat] = expenses
      .filter((e: any) => e.category === cat)
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    return acc;
  }, {});

  const salesTotal = summary.salesTotal || 0;
  const expenseTotal = summary.expenseTotal || 0;

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Estado de Resultados"
      subtitle="Reporte financiero profesional sincronizado con PostgreSQL."
    >
      {/* ── INTERFAZ DE PANTALLA (DASHBOARD) ── */}
      <section className="dashboard__grid no-print">
        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header"><h3 className="card__title">Ventas Totales</h3></div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#27ae60' }}>{money(salesTotal)}</div>
          </div>
        </article>
        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header"><h3 className="card__title">Gastos Totales</h3></div>
          <div className="card__body">
            <div className="dashboard__bigAmount" style={{ color: '#c0392b' }}>{money(expenseTotal)}</div>
          </div>
        </article>
        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header"><h3 className="card__title">Utilidad Neta</h3></div>
          <div className="card__body"><div className="dashboard__bigAmount">{money(summary.net)}</div></div>
        </article>
        <article className="card" style={{ gridColumn: 'span 3' }}>
          <div className="card__header">
            <h3 className="card__title">Acciones</h3>
          </div>
          <div className="card__body">
            <button className="button button--primary" onClick={() => window.print()} style={{ width: '100%' }}>
              🖨️ Descargar Reporte Contable
            </button>
          </div>
        </article>

        <article className="card" style={{ gridColumn: 'span 12' }}>
          <div className="card__header"><h3 className="card__title">Vista Previa del Reporte Contable</h3></div>
          <div className="card__body" style={{ background: '#f5f5f5', padding: '40px', display: 'flex', justifyContent: 'center' }}>
             {/* El reporte real que se imprimirá */}
             <div className="accounting-report">
                <div className="report-header">
                  <h2>Estado de Resultados</h2>
                  <div className="report-meta">
                    <span><strong>Periodo:</strong> Mes Actual</span>
                    <span><strong>Empresa:</strong> UPDM S.A. DE C.V.</span>
                  </div>
                </div>

                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th className="text-right">Periodo</th>
                      <th className="text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="row-group"><td>Ingresos</td><td></td><td></td></tr>
                    <tr><td>Ventas Nacionales</td><td className="text-right">{money(salesTotal)}</td><td className="text-right">100.00</td></tr>
                    <tr className="row-total"><td>Total INGRESOS</td><td className="text-right">{money(salesTotal)}</td><td className="text-right">100.00</td></tr>

                    <tr className="row-group"><td>Egresos</td><td></td><td></td></tr>
                    <tr className="row-subgroup"><td>GASTOS DE VENTA Y ADMINISTRACION</td><td></td><td></td></tr>
                    
                    {CATEGORIES.map(cat => (
                      <tr key={cat}>
                        <td>{cat}</td>
                        <td className="text-right">{money(groupedExpenses[cat])}</td>
                        <td className="text-right">
                          {salesTotal > 0 ? ((groupedExpenses[cat] / salesTotal) * 100).toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))}

                    <tr className="row-total">
                      <td>Total GASTOS</td>
                      <td className="text-right">{money(expenseTotal)}</td>
                      <td className="text-right">
                        {salesTotal > 0 ? ((expenseTotal / salesTotal) * 100).toFixed(2) : '0.00'}
                      </td>
                    </tr>

                    <tr className="row-final" style={{ marginTop: '20px', borderTop: '2px solid #000' }}>
                      <td><strong>Utilidad Neta</strong></td>
                      <td className="text-right"><strong>{money(summary.net)}</strong></td>
                      <td className="text-right"><strong>{summary.margin.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
        </article>
      </section>

      <style jsx global>{`
        .accounting-report {
          background: white;
          width: 800px;
          padding: 60px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          font-family: 'Courier New', Courier, monospace;
          color: #000;
        }
        .report-header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 1px solid #000;
          padding-bottom: 20px;
        }
        .report-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .report-table th {
          border-bottom: 1px solid #000;
          padding: 8px;
        }
        .report-table td {
          padding: 6px 8px;
        }
        .text-right { text-align: right; }
        .row-group { font-weight: bold; font-style: italic; background: #f9f9f9; }
        .row-subgroup { font-weight: bold; padding-left: 15px; }
        .row-total { border-top: 1px solid #000; font-weight: bold; }
        
        @media print {
          .no-print, .shell__sidebar, .page__hero { display: none !important; }
          .shell__main { padding: 0 !important; margin: 0 !important; }
          .accounting-report { 
            box-shadow: none; 
            width: 100%; 
            padding: 0;
            margin: 0;
          }
          body { background: white !important; }
        }
      `}</style>
    </WorkspaceShell>
  );
}
