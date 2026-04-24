'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { useBalance } from '@/context/balance-context';
import { money, type BankMovement } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function BancoPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchFromApi('/api/accounting?range=all');
        setData(result);
      } catch (error) {
        console.error('Error cargando datos de balance:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <WorkspaceShell active="/banco" eyebrow="Banco" title="Cargando Balance..." subtitle="Sincronizando activos y pasivos...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Calculando situación financiera...</div>
      </WorkspaceShell>
    );
  }

  const fmt = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Cálculos de Balance
  const bankBalance = data.bankBalance;
  const allInvoices = data.items || [];
  
  const accountsReceivable = allInvoices
    .filter((i: any) => i.type === 'SALE' && i.status === 'pendiente')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const accountsPayable = allInvoices
    .filter((i: any) => i.type === 'EXPENSE' && i.status === 'pendiente')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const totalSales = allInvoices
    .filter((i: any) => i.type === 'SALE')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const totalExpenses = allInvoices
    .filter((i: any) => i.type === 'EXPENSE')
    .reduce((acc: number, cur: any) => acc + cur.amount, 0);

  const currentUtility = totalSales - totalExpenses;
  
  // Capital Social (Ajustado para que el balance cuadre con el saldo inicial)
  // Formula: Activo = Pasivo + Capital
  // Capital = Activo - Pasivo
  // Capital = (Bank + AR) - AP
  const totalActivo = bankBalance + accountsReceivable;
  const totalPasivo = accountsPayable;
  const totalCapital = totalActivo - totalPasivo;

  return (
    <WorkspaceShell
      active="/banco"
      eyebrow="Estado Financiero"
      title="Estado de Situación Financiera"
      subtitle="Visualización del Activo, Pasivo y Capital de la empresa."
    >
      <div className="card" style={{ background: 'white', color: 'black', padding: '60px', fontFamily: 'serif', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', letterSpacing: '3px' }}>UPDM</h1>
          <h2 style={{ fontSize: '16px', fontWeight: 'normal', margin: '5px 0' }}>Balance General</h2>
          <p style={{ fontSize: '12px', color: '#666' }}>Al {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
          {/* Lado Izquierdo: ACTIVO */}
          <div>
            <h3 style={{ borderBottom: '1px solid black', paddingBottom: '5px', marginBottom: '15px', fontSize: '16px' }}>ACTIVO</h3>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline' }}>Activo Circulante</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Caja y Bancos</span>
                <span>{fmt(bankBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Cuentas por Cobrar</span>
                <span>{fmt(accountsReceivable)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Inventarios</span>
                <span>0.00</span>
              </div>
            </div>
            
            <div style={{ borderTop: '2px solid black', display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold' }}>
              <span>SUMA EL ACTIVO</span>
              <span>$ {fmt(totalActivo)}</span>
            </div>
          </div>

          {/* Lado Derecho: PASIVO Y CAPITAL */}
          <div>
            {/* PASIVO */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ borderBottom: '1px solid black', paddingBottom: '5px', marginBottom: '15px', fontSize: '16px' }}>PASIVO</h3>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', textDecoration: 'underline' }}>Pasivo a Corto Plazo</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Proveedores</span>
                <span>{fmt(accountsPayable)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Impuestos por Pagar</span>
                <span>0.00</span>
              </div>
              <div style={{ borderTop: '1px solid black', display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold' }}>
                <span>SUMA EL PASIVO</span>
                <span>{fmt(totalPasivo)}</span>
              </div>
            </div>

            {/* CAPITAL */}
            <div>
              <h3 style={{ borderBottom: '1px solid black', paddingBottom: '5px', marginBottom: '15px', fontSize: '16px' }}>CAPITAL</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Capital Social</span>
                <span>{fmt(totalCapital - currentUtility)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>Utilidad del Ejercicio</span>
                <span style={{ textDecoration: 'underline' }}>{fmt(currentUtility)}</span>
              </div>
              <div style={{ borderTop: '1px solid black', display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 'bold' }}>
                <span>SUMA EL CAPITAL</span>
                <span>{fmt(totalCapital)}</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid black', borderBottom: '4px double black', display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontWeight: 'bold', marginTop: '20px', backgroundColor: '#f9f9f9' }}>
              <span>PASIVO + CAPITAL</span>
              <span>$ {fmt(totalPasivo + totalCapital)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid black', paddingTop: '5px', fontSize: '10px' }}>ELABORÓ</div>
          <div style={{ textAlign: 'center', width: '200px', borderTop: '1px solid black', paddingTop: '5px', fontSize: '10px' }}>AUTORIZÓ</div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
