'use client';

import { useState, useEffect } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { money, type SalesInvoice } from '@/lib/data';
import { fetchFromApi } from '@/lib/api';

export default function SalesListPage() {
  const [sales, setSales] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await fetchFromApi('/api/sales');
        setSales(data.items || []);
      } catch (error) {
        console.error('Error cargando ventas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  const salesColumns = [
    { key: 'customer', label: 'Cliente', width: '22%' },
    { key: 'invoiceNumber', label: 'Folio', width: '12%' },
    { key: 'date', label: 'Fecha', width: '12%' },
    { key: 'paymentMethod', label: 'Método Pago', width: '25%' },
    { key: 'amount', label: 'Monto', render: (v: number) => money(v), width: '12%' },
    { 
      key: 'status', 
      label: 'Estado', 
      render: (v: string) => <span className="badge badge--success">{v}</span>,
      width: '12%'
    }
  ];

  async function handleConfirmNew(parsed: any) {
    try {
      const newInvoice = await fetchFromApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...parsed,
          type: 'SALE',
          customer: parsed.receiver, // En ventas el receptor es el cliente
          invoiceNumber: parsed.folio,
          amount: parsed.total,
          category: 'Ventas',
          source: 'XML / PDF',
          status: 'confirmado'
        })
      });
      
      setSales(prev => [newInvoice, ...prev]);
      setAddModalOpen(false);
    } catch (error) {
      alert('Error al guardar la venta en el servidor');
    }
  }

  async function handleViewPdf(row: any) {
    try {
      const data = await fetchFromApi(`/api/invoices/${row.id}/pdf`);
      if (data && data.pdfData) {
        // Open PDF in new tab
        const win = window.open();
        if (win) {
          win.document.write(`<iframe src="${data.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        }
      } else {
        alert('Esta venta no tiene un PDF adjunto guardado.');
      }
    } catch (error) {
      alert('Error al obtener el PDF. Es posible que no se haya guardado.');
    }
  }

  if (loading) {
    return (
      <WorkspaceShell active="/ventas/listado" eyebrow="Ventas" title="Cargando ventas..." subtitle="Sincronizando con Railway...">
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos de la base de datos...</div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      active="/ventas/listado"
      eyebrow="Ingresos"
      title="Listado de ventas"
      subtitle="Control total de facturas emitidas. Los datos se guardan de forma persistente en PostgreSQL."
    >
      <section className="stack">
        <ListTable
          title="Ventas registradas"
          description={`${sales.length} facturas de venta en el sistema.`}
          columns={salesColumns}
          data={sales}
          searchPlaceholder="Buscar venta por cliente o folio..."
          addButtonLabel="+ Registrar Venta"
          onAddNew={() => setAddModalOpen(true)}
          onViewPdf={handleViewPdf}
        />
      </section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Registrar Nueva Venta"
        description="Sube el XML de la factura emitida para guardarla en la base de datos."
        size="lg"
      >
        <InvoiceUploader
          title="Registrar venta"
          description="Sube XML para autollenar cliente, folio y montos."
          actionLabel="Venta"
          accent="rgba(191, 255, 117, 0.3)"
          showCategorySelector={false}
          isSale={true}
          onParsed={handleConfirmNew}
        />
      </Modal>
    </WorkspaceShell>
  );
}
