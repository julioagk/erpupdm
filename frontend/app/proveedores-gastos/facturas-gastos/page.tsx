'use client';

import { useState } from 'react';
import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { ListTable } from '@/components/list-table';
import { Modal } from '@/components/modal';
import { expenseInvoices, money } from '@/lib/data';

export default function ExpenseInvoicesPage() {
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);

  const expenseColumns = [
    {
      key: 'provider',
      label: 'Emisor',
      width: '22%'
    },
    {
      key: 'invoiceNumber',
      label: 'Folio',
      width: '12%'
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '12%'
    },
    {
      key: 'kind',
      label: 'Tipo',
      width: '12%'
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (value: number) => money(value),
      width: '12%'
    },
    {
      key: 'description',
      label: 'Descripcion',
      width: '30%'
    }
  ];

  return (
    <WorkspaceShell
      active="/proveedores-gastos/facturas-gastos"
      eyebrow="Compras"
      title="Registro de compras"
      subtitle="Aquí registramos todo lo que sale. Sube XML o PDF para autollenar emisor, folio, subtotal, IVA y total."
    >
      <section className="stack">
        <ListTable
          title="Compras registradas"
          description="Listado de facturas de compra con busqueda rapida."
          columns={expenseColumns}
          data={expenseInvoices}
          searchPlaceholder="Buscar compra por emisor, folio o descripcion..."
          addButtonLabel="+ Agregar compra"
          onAddNew={() => setExpenseModalOpen(true)}
          onEdit={(row) => alert(`Editar compra: ${row.invoiceNumber}`)}
          onDelete={(row) => alert(`Eliminar compra: ${row.invoiceNumber}`)}
          onExport={() => alert('Exportar compras a CSV')}
        />
      </section>

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Nueva compra"
        description="Registra una compra sin salir del listado. El sistema llena los datos al arrastrar XML o PDF."
        size="lg"
      >
        <InvoiceUploader
          title="Agregar compra"
          description="Sube XML o PDF para registrar emisor, folio, subtotal, IVA, total y tipo de gasto."
          actionLabel="Compra"
          accent="rgba(139, 195, 74, 0.18)"
          fieldLabel="Contenido XML / texto extraido"
          fieldPlaceholder="Pega aqui el XML o el texto del PDF de la compra"
          uploadHint="Sube o arrastra XML o PDF para registrar la compra."
          fileNote="Compra cargada correctamente."
          unsupportedFileNote="Si el PDF no trae texto seleccionable, conecta OCR en backend."
          parseButtonLabel="Registrar compra"
          clearButtonLabel="Limpiar contenido"
          parsedLabel="Compra procesada correctamente."
        />
      </Modal>
    </WorkspaceShell>
  );
}
