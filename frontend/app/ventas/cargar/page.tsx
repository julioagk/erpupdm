'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { useRouter } from 'next/navigation';
import { fetchFromApi } from '@/lib/api';
import { useBalance } from '@/context/balance-context';

export default function CargarVentasPage() {
  const router = useRouter();
  const [affectBank, setAffectBank] = useState(true);
  const [bankAccount, setBankAccount] = useState<'banorte' | 'bbva'>('banorte');
  const { banorteAlias, bbvaAlias } = useBalance();

  async function handleParsed(parsed: any) {
    try {
      await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...parsed,
          type: 'SALE',
          customer: parsed.receiver,
          invoiceNumber: parsed.folio,
          amount: parsed.total,
          category: 'Ventas',
          source: 'Carga Directa',
          affectBank,
          bankAccount
        })
      });
      router.push('/ventas/listado');
    } catch (error) {
      alert('Error al guardar la venta');
    }
  }

  return (
    <WorkspaceShell
      active="/ventas/cargar"
      eyebrow="Cargar facturas de venta"
      title="Registro de nuevas facturas de venta"
      subtitle="Carga facturas ya emitidas para registrar clientes, folios y totales automáticamente."
    >
      <section className="split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector de banco */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={affectBank}
                onChange={(e) => setAffectBank(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}>
                🏦 Afectar cuenta de Banco (Registrar movimiento)
              </span>
            </label>
            {affectBank && (
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>💳 ¿A qué cuenta entra el dinero?</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '8px 14px', borderRadius: '8px', border: `2px solid ${bankAccount === 'banorte' ? '#0d9488' : '#e2e8f0'}`, background: bankAccount === 'banorte' ? 'rgba(13,148,136,0.06)' : '#f8fafc', transition: 'all 0.2s' }}>
                    <input type="radio" name="bankAccount-cargar" value="banorte" checked={bankAccount === 'banorte'} onChange={() => setBankAccount('banorte')} style={{ accentColor: '#0d9488' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bankAccount === 'banorte' ? '#0d9488' : '#334155' }}>🏦 {banorteAlias}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, padding: '8px 14px', borderRadius: '8px', border: `2px solid ${bankAccount === 'bbva' ? '#1d4ed8' : '#e2e8f0'}`, background: bankAccount === 'bbva' ? 'rgba(29,78,216,0.06)' : '#f8fafc', transition: 'all 0.2s' }}>
                    <input type="radio" name="bankAccount-cargar" value="bbva" checked={bankAccount === 'bbva'} onChange={() => setBankAccount('bbva')} style={{ accentColor: '#1d4ed8' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: bankAccount === 'bbva' ? '#1d4ed8' : '#334155' }}>🏛️ {bbvaAlias}</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <InvoiceUploader
            title="Cargar factura de venta"
            description="Sube una factura de venta ya emitida o pega el contenido para registrar cliente, folio y total."
            actionLabel="Venta"
            accent="rgba(31, 122, 79, 0.16)"
            showCategorySelector={false}
            isSale={true}
            onParsed={handleParsed}
          />
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Instrucciones</h3>
              <p className="card__label">Elige cómo deseas procesar la factura.</p>
            </div>
          </div>
          <div className="card__body stack">
            <p>El sistema ahora es automático:</p>
            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#666' }}>
              <li>Selecciona la cuenta destino arriba (Banorte o BBVA).</li>
              <li>Arrastra el XML directamente al recuadro.</li>
              <li>O pega el texto y el sistema detectará el folio.</li>
              <li>Al confirmar, la venta se guardará en Railway.</li>
            </ul>
            <p className="footer-note">Soporte para CFDI 4.0 habilitado.</p>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
