'use client';

import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { useRouter } from 'next/navigation';
import { fetchFromApi } from '@/lib/api';

export default function CargarVentasPage() {
  const router = useRouter();

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
          source: 'Carga Directa'
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
        <InvoiceUploader
          title="Cargar factura de venta"
          description="Sube una factura de venta ya emitida o pega el contenido para registrar cliente, folio y total."
          actionLabel="Venta"
          accent="rgba(31, 122, 79, 0.16)"
          showCategorySelector={false}
          isSale={true}
          onParsed={handleParsed}
        />

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
