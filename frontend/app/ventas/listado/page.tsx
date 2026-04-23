'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { ListTable } from '@/components/list-table';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { Modal } from '@/components/modal';
import { money, salesInvoices } from '@/lib/data';

export default function ListadoVentasPage() {
  const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);

  return (
    <WorkspaceShell
      active="/ventas/listado"
      eyebrow="Ventas"
      title="Registro de ventas"
      subtitle="Aquí registramos lo que vendemos. Sube XML o PDF para autollenar receptor, folio, fecha, método de pago, subtotal, IVA y total."
    >
      <section className="stack">
        <ListTable
          title="Facturas de venta"
          description="Listado detallado de ingresos con desglose de impuestos."
          columns={[
            { key: 'customer', label: 'Receptor', width: '20%' },
            { key: 'invoiceNumber', label: 'Factura', width: '12%' },
            { key: 'date', label: 'Fecha', width: '12%' },
            { key: 'paymentMethod', label: 'Método de pago', width: '20%' },
            { key: 'subtotal', label: 'Subtotal', render: (v: number) => money(v), width: '12%' },
            { key: 'iva', label: 'IVA', render: (v: number) => money(v), width: '10%' },
            { key: 'amount', label: 'Total', render: (v: number) => money(v), width: '14%' }
          ]}
          data={salesInvoices}
          searchPlaceholder="Buscar por cliente, folio o descripcion..."
          addButtonLabel="+ Agregar factura"
          onAddNew={() => setInvoiceModalOpen(true)}
          onEdit={(row) => alert(`Editar: ${row.invoiceNumber}`)}
          onDelete={(row) => alert(`Eliminar: ${row.invoiceNumber}`)}
          onExport={() => alert('Exportar facturas de ventas a CSV')}
        />
      </section>

      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Nueva factura de venta"
        description="Completa el registro sin salir del listado de ventas."
        size="lg"
      >
        <InvoiceUploader
          title="Agregar factura de venta"
          description="Sube una factura de venta ya emitida para registrar receptor, factura, fecha, método de pago, subtotal, IVA y total."
          actionLabel="Venta"
          accent="rgba(31, 122, 79, 0.16)"
          fieldLabel="Contenido de la factura"
          fieldPlaceholder="Pega el contenido de la factura o el texto extraído del documento"
          uploadHint="Sube la factura emitida o pega su contenido para autollenar todos los campos."
          fileNote="Factura cargada correctamente."
          unsupportedFileNote="Si es imagen o PDF escaneado, conecta lectura automática en backend."
          parseButtonLabel="Registrar factura"
          clearButtonLabel="Limpiar contenido"
          parsedLabel="Factura de venta procesada correctamente."
        />
      </Modal>
    </WorkspaceShell>
  );
}
