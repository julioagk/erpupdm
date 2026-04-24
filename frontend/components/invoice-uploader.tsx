'use client';

import { useState, type DragEvent, useEffect } from 'react';
import { parseInvoiceText, type ParsedInvoice } from '@/lib/parse-invoice';

type EditableInvoice = ParsedInvoice;

export function InvoiceUploader({
  title,
  description,
  actionLabel,
  accent,
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
    'Partidas No Deducibles',
    'Servicios y Materiales Indirectos'
  ],
  showCategorySelector = true,
  onParsed
}: Readonly<{
  title: string;
  description: string;
  actionLabel: string;
  accent: string;
  expenseTypeOptions?: string[];
  showCategorySelector?: boolean;
  onParsed?: (invoice: EditableInvoice) => void;
}>) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('Arrastra un XML aquí para autollenar.');
  const [isDragging, setIsDragging] = useState(false);
  const [fields, setFields] = useState<EditableInvoice | null>(null);

  function setField<K extends keyof EditableInvoice>(key: K, value: EditableInvoice[K]) {
    setFields(prev => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    
    setMessage(`Leyendo ${file.name}...`);
    
    try {
      const content = await file.text();
      setText(content);
      
      // Auto-procesar después de cargar el archivo
      const parsed = parseInvoiceText(content);
      setFields(parsed);
      setMessage('✅ Datos extraídos. Por favor revisa y confirma.');
    } catch (error) {
      setMessage('❌ Error al leer el archivo. Intenta pegar el texto manualmente.');
    }
  }

  function handleParse() {
    if (!text.trim()) {
      setMessage('⚠️ Pega contenido antes de autollenar.');
      return;
    }
    const parsed = parseInvoiceText(text);
    setFields(parsed);
    setMessage('✅ Datos extraídos del texto pegado.');
  }

  function handleConfirm() {
    if (fields) {
      onParsed?.(fields);
      setFields(null);
      setText('');
      setMessage('✅ Factura registrada con éxito.');
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
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
        {!fields && (
          <>
            <div
              className={`invoice-dropzone ${isDragging ? 'invoice-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #ccc',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: isDragging ? '#f0f9f0' : 'transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
              <strong style={{ display: 'block', fontSize: '1.1rem' }}>Suelta tu XML aquí</strong>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>El sistema extraerá los datos automáticamente</p>
            </div>

            <div className="form__row" style={{ marginTop: '20px' }}>
              <span className="form__label">O pega el texto del XML/PDF aquí:</span>
              <textarea
                className="form__textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega aquí el contenido..."
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="form__actions">
              <button className="button button--primary" type="button" onClick={handleParse}>
                Autollenar desde texto
              </button>
              <label className="button button--secondary" style={{ cursor: 'pointer' }}>
                Seleccionar archivo
                <input
                  type="file"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <p className="footer-note" style={{ textAlign: 'center', fontWeight: 'bold' }}>{message}</p>
          </>
        )}

        {fields && (
          <div className="uploader-review" style={{ animation: 'fadeIn 0.4s ease' }}>
            <div className="uploader-review__grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <label className="form__row">
                <span className="form__label">Emisor (Proveedor)</span>
                <input className="form__input" value={fields.issuer} onChange={e => setField('issuer', e.target.value)} />
              </label>
              <label className="form__row">
                <span className="form__label">Receptor (Cliente)</span>
                <input className="form__input" value={fields.receiver} onChange={e => setField('receiver', e.target.value)} />
              </label>
              <label className="form__row">
                <span className="form__label">Folio / UUID</span>
                <input className="form__input" value={fields.folio} onChange={e => setField('folio', e.target.value)} />
              </label>
              <label className="form__row">
                <span className="form__label">Fecha</span>
                <input className="form__input" type="date" value={fields.date} onChange={e => setField('date', e.target.value)} />
              </label>
              
              {showCategorySelector && (
                <label className="form__row" style={{ gridColumn: 'span 2' }}>
                  <span className="form__label">Categoría de Gasto</span>
                  <select className="form__select" value={fields.expenseType} onChange={e => setField('expenseType', e.target.value)}>
                    {expenseTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </label>
              )}

              <label className="form__row">
                <span className="form__label">Subtotal</span>
                <input className="form__input" type="number" value={fields.subtotal} onChange={e => setField('subtotal', parseFloat(e.target.value) || 0)} />
              </label>
              <label className="form__row">
                <span className="form__label">Total</span>
                <input className="form__input" type="number" value={fields.total} onChange={e => setField('total', parseFloat(e.target.value) || 0)} />
              </label>
            </div>

            <div className="form__actions" style={{ marginTop: '20px' }}>
              <button className="button button--primary" style={{ width: '100%' }} type="button" onClick={handleConfirm}>
                ✅ Todo correcto, registrar
              </button>
              <button className="button button--secondary" style={{ width: '100%' }} type="button" onClick={() => setFields(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
