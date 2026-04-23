import { WorkspaceShell } from '@/components/workspace-shell';
import { InvoiceUploader } from '@/components/invoice-uploader';

export default function CargarVentasPage() {
  return (
    <WorkspaceShell
      active="/ventas/cargar"
      eyebrow="Cargar facturas de venta"
      title="Registro de nuevas facturas de venta"
      subtitle="Carga facturas ya emitidas para registrar clientes, folios y totales automaticamente."
    >
      <section className="split">
        <InvoiceUploader
          title="Cargar factura de venta"
          description="Sube una factura de venta ya emitida para registrar cliente, folio, fecha y total."
          actionLabel="Venta"
          accent="rgba(31, 122, 79, 0.16)"
          fieldLabel="Contenido de la factura"
          fieldPlaceholder="Pega el contenido de la factura emitida o el texto extraido del documento"
          uploadHint="Sube la factura emitida o pega su contenido para registrar cliente, folio, fecha y total."
          fileNote="Factura cargada correctamente."
          unsupportedFileNote="Si es imagen o PDF, conecta su lectura automatica en backend."
          parseButtonLabel="Registrar factura"
          clearButtonLabel="Limpiar contenido"
          parsedLabel="Factura de venta registrada correctamente."
        />

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Opciones de carga</h3>
              <p className="card__label">Elige como deseas procesar la factura.</p>
            </div>
          </div>
          <div className="card__body stack">
            <div style={{ display: 'grid', gap: '12px' }}>
              <label className="form__row">
                <input type="radio" name="loadType" value="manual" defaultChecked />
                <span className="form__label" style={{ marginLeft: '8px' }}>Pegar contenido manualmente</span>
              </label>
              <label className="form__row">
                <input type="radio" name="loadType" value="file" />
                <span className="form__label" style={{ marginLeft: '8px' }}>Subir archivo (TXT, PDF)</span>
              </label>
              <label className="form__row">
                <input type="radio" name="loadType" value="ocr" />
                <span className="form__label" style={{ marginLeft: '8px' }}>Escanear con camara (OCR)</span>
              </label>
            </div>
            <p className="footer-note">El motor OCR esta disponible en backend cuando conectes la integracion de lectura de imagenes.</p>
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
