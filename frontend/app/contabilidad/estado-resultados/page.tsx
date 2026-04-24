'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { money } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function EstadoResultadosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      try {
        const result = await fetchFromApi('/api/accounting?range=all'); // Traemos todo para calcular Acumulado
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

  // Filtrar por mes actual para "Periodo"
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const allInvoices = data?.items || [];
  
  const periodoSales = allInvoices.filter((i: any) => i.type === 'SALE' && new Date(i.date).getMonth() === currentMonth && new Date(i.date).getFullYear() === currentYear);
  const periodoExpenses = allInvoices.filter((i: any) => i.type === 'EXPENSE' && new Date(i.date).getMonth() === currentMonth && new Date(i.date).getFullYear() === currentYear);
  
  const acumuladoSales = allInvoices.filter((i: any) => i.type === 'SALE' && new Date(i.date).getFullYear() === currentYear);
  const acumuladoExpenses = allInvoices.filter((i: any) => i.type === 'EXPENSE' && new Date(i.date).getFullYear() === currentYear);

  const totalPeriodoIngresos = periodoSales.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalAcumuladoIngresos = acumuladoSales.reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const getCategoryTotal = (expenses: any[], cat: string) => expenses.filter(e => e.category === cat).reduce((acc, cur) => acc + cur.amount, 0);

  const totalPeriodoEgresos = periodoExpenses.reduce((acc: number, cur: any) => acc + cur.amount, 0);
  const totalAcumuladoEgresos = acumuladoExpenses.reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const pct = (val: number, total: number) => total > 0 ? ((val / total) * 100).toFixed(2) : '0.00';
  const fmt = (val: number) => val === 0 ? '-' : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dateStr = `${new Date(currentYear, currentMonth, 1).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} al ${new Date(currentYear, currentMonth + 1, 0).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <WorkspaceShell
      active="/contabilidad/estado-resultados"
      eyebrow="Contabilidad"
      title="Estado de Resultados"
      subtitle="Reporte financiero formal generado automáticamente."
    >
      <div className="card" style={{ background: 'white', color: 'black', padding: '40px', fontFamily: 'serif', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', letterSpacing: '2px' }}>UPDM S.A DE C.V</h1>
          <h2 style={{ fontSize: '14px', fontWeight: 'normal', margin: '5px 0' }}>Estado de Resultados del {dateStr}</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th style={{ textAlign: 'left', padding: '10px 0' }}></th>
              <th style={{ textAlign: 'right', width: '15%' }}>Periodo</th>
              <th style={{ textAlign: 'right', width: '8%' }}>%</th>
              <th style={{ textAlign: 'right', width: '15%' }}>Acumulado</th>
              <th style={{ textAlign: 'right', width: '8%' }}>%</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} style={{ padding: '15px 0 5px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '13px' }}>Ingresos</td></tr>
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444' }}>INGRESOS</td></tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>Ventas Nacionales</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>Total INGRESOS</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
            </tr>
            <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
              <td style={{ fontStyle: 'italic', padding: '5px 0' }}>Total Ingresos</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>100.00</td>
            </tr>

            <tr><td colSpan={5} style={{ padding: '20px 0 5px 0', fontWeight: 'bold', fontStyle: 'italic', fontSize: '13px' }}>Egresos</td></tr>
            
            {/* Costo de Ventas */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444' }}>COSTO DE VENTAS</td></tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>Servicios y Materiales Indirectos</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>
            <tr style={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
              <td style={{ paddingLeft: '10px' }}>Total COSTO DE VENTAS</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            {/* Gastos de Administración Section */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444', paddingTop: '10px' }}>GASTOS DE VENTA Y ADMINISTRACION</td></tr>
            {expenseCategories.map(cat => {
              const perTotal = getCategoryTotal(periodoExpenses, cat);
              const acuTotal = getCategoryTotal(acumuladoExpenses, cat);
              return (
                <tr key={cat}>
                  <td style={{ paddingLeft: '20px' }}>{cat}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(perTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(perTotal, totalPeriodoIngresos)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(acuTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{pct(acuTotal, totalAcumuladoIngresos)}</td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
              <td style={{ paddingLeft: '10px', padding: '5px 10px' }}>Total GASTOS DE VENTA Y ADMINISTRACION</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>

            {/* Otros Section Placeholders */}
            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444', paddingTop: '10px' }}>COSTO INTEGRAL DE FINANCIAMIENTO</td></tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>Total COSTO INTEGRAL DE FINANCIAMIENTO</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444', paddingTop: '10px' }}>OTROS INGRESOS Y GASTOS</td></tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>Total OTROS INGRESOS Y GASTOS</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            <tr><td colSpan={5} style={{ paddingLeft: '10px', fontWeight: 'bold', color: '#444', paddingTop: '10px' }}>ISR Y PTU</td></tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '10px' }}>Total ISR Y PTU</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
              <td style={{ textAlign: 'right' }}>-</td>
              <td style={{ textAlign: 'right' }}>0.00</td>
            </tr>

            <tr style={{ fontWeight: 'bold', borderTop: '2px solid black', backgroundColor: '#f9f9f9' }}>
              <td style={{ fontStyle: 'italic', padding: '10px 0' }}>Total Egresos</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>

            <tr style={{ height: '40px' }}></tr>

            <tr style={{ fontWeight: 'bold', borderTop: '3px double black', fontSize: '15px' }}>
              <td style={{ fontStyle: 'italic', padding: '15px 0' }}>Utilidad (o Pérdida)</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos - totalPeriodoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalPeriodoIngresos - totalPeriodoEgresos, totalPeriodoIngresos)}</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos - totalAcumuladoEgresos)}</td>
              <td style={{ textAlign: 'right' }}>{pct(totalAcumuladoIngresos - totalAcumuladoEgresos, totalAcumuladoIngresos)}</td>
            </tr>

            <tr style={{ height: '50px' }}></tr>
            
            {/* Sección Solicitada: (BANCOS) + (VENTAS) - (COMPRAS) */}
            <tr><td colSpan={5} style={{ padding: '10px 0', fontWeight: 'bold', borderTop: '1px solid black', fontSize: '13px' }}>CONCILIACIÓN DE LIQUIDEZ (BANCOS)</td></tr>
            <tr>
              <td style={{ paddingLeft: '10px' }}>Saldo Inicial en Bancos (Ajustado)</td>
              <td style={{ textAlign: 'right' }}>{fmt(data.bankBalance - (totalPeriodoIngresos - totalPeriodoEgresos))}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{fmt(data.bankBalance - (totalAcumuladoIngresos - totalAcumuladoEgresos))}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '10px' }}>(+) Ventas del Periodo</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoIngresos)}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoIngresos)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '10px' }}>(-) Compras y Gastos</td>
              <td style={{ textAlign: 'right' }}>{fmt(totalPeriodoEgresos)}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{fmt(totalAcumuladoEgresos)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold', borderTop: '1px solid black', backgroundColor: '#f0f4f8' }}>
              <td style={{ paddingLeft: '10px', padding: '10px 0' }}>Saldo Final Actual (Bancos)</td>
              <td style={{ textAlign: 'right' }}>{fmt(data.bankBalance)}</td>
              <td></td>
              <td style={{ textAlign: 'right' }}>{fmt(data.bankBalance)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', textAlign: 'right' }}>
           <button className="button button--secondary" onClick={() => window.print()} style={{ marginRight: '10px' }}>🖨️ Imprimir Reporte</button>
           <button className="button button--primary">Descargar PDF</button>
        </div>
      </div>
    </WorkspaceShell>
  );
}
