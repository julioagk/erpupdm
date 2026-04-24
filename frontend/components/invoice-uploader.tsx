'use client';

import { useState, type DragEvent } from 'react';
import { parseInvoiceText, type ParsedInvoice } from '@/lib/parse-invoice';
import { money } from '@/lib/data';

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
  parseButtonLabel = 'Autollenar compra',
  clearButtonLabel = 'Limpiar',
  parsedLabel = 'Compra procesada correctamente. Revisa el resumen extraido.',
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
  onParsed?: (invoice: ParsedInvoice & { expenseType: string }) => void;
}>) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<(ParsedInvoice & { expenseType: string }) | null>(null);
  const [message, setMessage] = useState(uploadHint);
  const [expenseType, setExpenseType] = useState(expenseTypeOptions[0] ?? 'Otros Impuestos y Derechos');
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    const isReadableText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.xml') || file.type.includes('xml');

    if (isReadableText) {
      const content = await file.text();
      setText(content);
      setMessage(`${file.name} cargado. ${fileNote}`);
      return;
    }

    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      setMessage(`${file.name} recibido. ${unsupportedFileNote}`);
      return;
    }

    setMessage(`${file.name} recibido. ${unsupportedFileNote}`);
  }

  function handleParse() {
    const nextParsed = parseInvoiceText(text);
    const normalizedParsed = { ...nextParsed, expenseType };
    setParsed(normalizedParsed);
    onParsed?.(normalizedParsed);
    setMessage(parsedLabel);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
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

        {showCategorySelector && (
          <div style={{ background: 'rgba(191,255,117,0.12)', borderRadius: '14px', padding: '12px 16px', border: '1px solid rgba(139,195,74,0.35)' }}>
            <label className="form__row" style={{ margin: 0 }}>
              <span className="form__label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                📂 {expenseTypeLabel} <span style={{ color: '#c0392b', marginLeft: 2 }}>*</span>
              </span>
              <select className="form__select" value={expenseType} onChange={(event) => setExpenseType(event.target.value)}>
                {expenseTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px' }}>
                Selecciona la categoría contable antes de registrar el gasto.
              </span>
            </label>
          </div>
        )}

        <div
          className={`invoice-dropzone ${isDragging ? 'invoice-dropzone--active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
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

        {parsed ? (
          <div className="list__item" style={{ background: 'rgba(191, 255, 117, 0.12)' }}>
            <div className="list__title">
              <span>{parsed.issuer} &rarr; {parsed.receiver}</span>
              <span>{money(parsed.total)}</span>
            </div>
            <div className="list__meta">
              Folio: {parsed.folio} · Fecha: {parsed.date}
              <br />
              Método: {parsed.paymentMethod}
              <br />
              Subtotal: {money(parsed.subtotal)} · IVA: {money(parsed.iva)} · Total: {money(parsed.total)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
