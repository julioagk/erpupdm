'use client';

import { useState, type DragEvent } from 'react';
import { parseInvoiceText, type ParsedInvoice } from '@/lib/parse-invoice';

type EditableInvoice = ParsedInvoice & { expenseType: string };

export function InvoiceUploader({
  title,
  description,
  actionLabel,
  accent,
  fieldLabel = 'Contenido XML / PDF',
  fieldPlaceholder = 'Pega aqui el XML o el texto extraido del PDF para llenar emisor, folio, subtotal, IVA y total',
  uploadHint = 'Arrastra un XML o PDF, o pega el contenido para autollenar la compra.',
  fileNote = 'Archivo cargado correctamente.',
  unsupportedFileNote = 'Si es PDF escaneado, conecta OCR en backend. XML y texto se leen de inmediato.',
  parseButtonLabel = 'Autollenar',
  clearButtonLabel = 'Limpiar',
  parsedLabel = 'Datos detectados. Revisa y corrige si es necesario antes de confirmar.',
  expenseTypeLabel = 'Tipo de gasto',
  expenseTypeOptions = [
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
  ],
  showCategorySelector = true,
  onParsed
}: Readonly<{
  title: string;
  description: string;
  actionLabel: string;
  accent: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
  uploadHint?: string;
  fileNote?: string;
  unsupportedFileNote?: string;
  parseButtonLabel?: string;
  clearButtonLabel?: string;
  parsedLabel?: string;
  expenseTypeLabel?: string;
  expenseTypeOptions?: string[];
  showCategorySelector?: boolean;
  onParsed?: (invoice: EditableInvoice) => void;
}>) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState(uploadHint);
  const [isDragging, setIsDragging] = useState(false);

  // Editable fields state — null means form not yet shown
  const [fields, setFields] = useState<EditableInvoice | null>(null);

  function setField<K extends keyof EditableInvoice>(key: K, value: EditableInvoice[K]) {
    setFields(prev => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    const isReadableText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.xml') ||
      file.type.includes('xml');

    if (isReadableText) {
      const content = await file.text();
      setText(content);
      setMessage(`${file.name} cargado. ${fileNote}`);
      return;
    }
    setMessage(`${file.name} recibido. ${unsupportedFileNote}`);
  }

  function handleParse() {
    const parsed = parseInvoiceText(text);
    const initial: EditableInvoice = { ...parsed, expenseType: parsed.expenseType };
    setFields(initial);
    setMessage(parsedLabel);
  }

  function handleConfirm() {
    if (fields) {
      onParsed?.(fields);
      setMessage('✅ Factura confirmada y registrada.');
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  }

  function handleReset() {
    setText('');
    setFields(null);
    setMessage(uploadHint);
  }

  return (
    <section className="card card--glass">
      <div className="card__header">
        <div>
          <h3 className="card__title">{title}</h3>
          <p className="card__label">{description}</p>
        </div>
        <span className="badge" style={{ background: accent }}>
          {actionLabel}
        </span>
      </div>

      <div className="card__body stack">

        {/* ── Paso 1: XML / Archivo ── */}
        {!fields && (
          <>
            {showCategorySelector && (
              <label className="form__row">
                <span className="form__label">{expenseTypeLabel}</span>
                <select
                  className="form__select"
                  onChange={(e) => {/* will be set on parse */}}
                >
                  {expenseTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            )}

            <div
              className={`invoice-dropzone ${isDragging ? 'invoice-dropzone--active' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <span className="invoice-dropzone__title">Arrastra aquí XML o PDF</span>
              <span className="invoice-dropzone__hint">El sistema completará emisor, folio, subtotal, IVA y total.</span>
            </div>

            <label className="form__row">
              <span className="form__label">{fieldLabel}</span>
              <textarea
                className="form__textarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={fieldPlaceholder}
              />
            </label>

            <label className="form__row">
              <span className="form__label">Archivo</span>
              <input
                className="form__input"
                type="file"
                accept=".xml,.pdf,.txt"
                onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <div className="form__actions">
              <button className="button button--primary" type="button" onClick={handleParse}>
                {parseButtonLabel}
              </button>
              <button className="button button--secondary" type="button" onClick={() => setText('')}>
                {clearButtonLabel}
              </button>
            </div>

            <p className="footer-note">{message}</p>
          </>
        )}

        {/* ── Paso 2: Campos editables prellenados ── */}
        {fields && (
          <div className="uploader-review">
            <div className="uploader-review__banner">
              <span>✏️ Revisa los datos detectados. Corrige lo que sea necesario antes de confirmar.</span>
              <button className="button button--secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} type="button" onClick={handleReset}>
                ← Volver
              </button>
            </div>

            <div className="uploader-review__grid">
              <label className="form__row">
                <span className="form__label">Emisor / Proveedor</span>
                <input
                  className="form__input"
                  value={fields.issuer}
                  onChange={e => setField('issuer', e.target.value)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">Receptor / Cliente</span>
                <input
                  className="form__input"
                  value={fields.receiver}
                  onChange={e => setField('receiver', e.target.value)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">Folio / No. Factura</span>
                <input
                  className="form__input"
                  value={fields.folio}
                  onChange={e => setField('folio', e.target.value)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input
                  className="form__input"
                  type="date"
                  value={fields.date}
                  onChange={e => setField('date', e.target.value)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">Método de Pago</span>
                <input
                  className="form__input"
                  value={fields.paymentMethod}
                  onChange={e => setField('paymentMethod', e.target.value)}
                />
              </label>

              {showCategorySelector && (
                <label className="form__row">
                  <span className="form__label">{expenseTypeLabel}</span>
                  <select
                    className="form__select"
                    value={fields.expenseType}
                    onChange={e => setField('expenseType', e.target.value)}
                  >
                    {expenseTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              )}

              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input
                  className="form__input"
                  type="number"
                  step="0.01"
                  value={fields.subtotal}
                  onChange={e => setField('subtotal', parseFloat(e.target.value) || 0)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">IVA</span>
                <input
                  className="form__input"
                  type="number"
                  step="0.01"
                  value={fields.iva}
                  onChange={e => setField('iva', parseFloat(e.target.value) || 0)}
                />
              </label>

              <label className="form__row">
                <span className="form__label">Total</span>
                <input
                  className="form__input"
                  type="number"
                  step="0.01"
                  value={fields.total}
                  onChange={e => setField('total', parseFloat(e.target.value) || 0)}
                />
              </label>
            </div>

            <div className="form__actions" style={{ marginTop: '8px' }}>
              <button className="button button--primary" type="button" onClick={handleConfirm}>
                ✅ Confirmar y registrar
              </button>
              <button className="button button--secondary" type="button" onClick={handleReset}>
                Cancelar
              </button>
            </div>

            <p className="footer-note">{message}</p>
          </div>
        )}
      </div>
    </section>
  );
}
