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
      <WorkspaceShell active="/contabilidad/estado-resultados" eyebrow="Contabilidad" title="Generando reporte..." subtitle="Calculando estados financieros desde Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Procesando cifras reales...</div>
      </WorkspaceShell>
    );
  }

  const summary = data?.summary || { salesTotal: 0, expenseTotal: 0, net: 0, margin: 0 };
  const sales = data?.sales || [];
  const expenses = data?.expenses || [];

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Reportes Financieros"
      title="Estado de Resultados"
      subtitle="Resumen detallado de ingresos y egresos del periodo actual sincronizado con PostgreSQL."
    >
      <section className="stack">
        <div className="card dashboard__pdfFrame" style={{ maxWidth: '900px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
          <div className="dashboard__pdfPage" id="print-area">
            <div className="dashboard__pdfHeader">
              <div>
                <p className="dashboard__pdfEyebrow">Reporte Ejecutivo</p>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Estado de Resultados</h2>
                <p style={{ color: '#666' }}>Periodo: Mes Actual (Sincronizado con Railway)</p>
              </div>
              <div className="dashboard__pdfStamp">
                <strong>CERTIFICADO</strong>
                <span>ERP UPDM v1.0</span>
              </div>
            </div>

            <div className="dashboard__pdfSummary" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', background: '#f8faf8', padding: '30px', borderRadius: '20px', margin: '30px 0' }}>
              <div>
                <span className="card__label">Ingresos Totales</span>
                <strong style={{ fontSize: '1.5rem', display: 'block', color: '#27ae60' }}>{money(summary.salesTotal)}</strong>
              </div>
              <div>
                <span className="card__label">Egresos Totales</span>
                <strong style={{ fontSize: '1.5rem', display: 'block', color: '#c0392b' }}>{money(summary.expenseTotal)}</strong>
              </div>
              <div>
                <span className="card__label">Utilidad Neta</span>
                <strong style={{ fontSize: '1.5rem', display: 'block', color: '#2c3e50' }}>{money(summary.net)}</strong>
              </div>
              <div>
                <span className="card__label">Margen Operativo</span>
                <strong style={{ fontSize: '1.5rem', display: 'block' }}>{summary.margin.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="dashboard__pdfSection">
              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Detalle de Ingresos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px' }}>Folio</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale: any) => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{sale.customer}</td>
                      <td style={{ padding: '12px', color: '#888' }}>{sale.invoiceNumber}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{money(sale.amount)}</td>
                    </tr>
                  ))}
                  {sales.length === 0 && <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No hay ventas registradas.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="dashboard__pdfSection" style={{ marginTop: '40px' }}>
              <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Detalle de Egresos</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>Proveedor</th>
                    <th style={{ padding: '12px' }}>Categoría</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{exp.provider}</td>
                      <td style={{ padding: '12px' }}><span className="chip">{exp.category}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#c0392b' }}>{money(exp.amount)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No hay gastos registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button className="button button--primary" onClick={() => window.print()}>
            🖨️ Descargar Reporte PDF
          </button>
        </div>
      </section>
    </WorkspaceShell>
  );
}
