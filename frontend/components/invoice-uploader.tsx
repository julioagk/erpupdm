'use client';

import { useState, type DragEvent } from 'react';
import { parseInvoice, API_URL } from '@/lib/api';
import type { ParsedInvoice } from '@/lib/parse-invoice';

// Usamos el tipo ParsedInvoice definido en lib/parse-invoice o similar
type EditableInvoice = {
  issuer: string;
  receiver: string;
  folio: string;
  date: string;
  subtotal: number;
  iva: number;
  total: number;
  paymentMethod: string;
  expenseType: string;
  pdfData?: string;
};

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
  isSale = false,
  onParsed
}: Readonly<{
  title: string;
  description: string;
  actionLabel: string;
  accent: string;
  expenseTypeOptions?: string[];
  showCategorySelector?: boolean;
  isSale?: boolean;
  onParsed?: (invoice: EditableInvoice) => void;
}>) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('Arrastra un XML o PDF aquí.');
  const [isDragging, setIsDragging] = useState(false);
  const [fields, setFields] = useState<EditableInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function setField<K extends keyof EditableInvoice>(key: K, value: EditableInvoice[K]) {
    setFields(prev => prev ? { ...prev, [key]: value } : prev);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    
    setIsProcessing(true);
    setMessage(`Analizando ${file.name}...`);
    
    try {
      let content = '';
      
      let pdfBase64 = '';
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        pdfBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // Enviar PDF al backend para extracción de texto
        const formData = new FormData();
        formData.append('file', file);
        
        const apiUrl = API_URL;
        const response = await fetch(`${apiUrl}/api/extract-pdf`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Error en servidor al leer PDF');
        }
        
        const data = await response.json();
        content = data.text;
      } else {
        // Es XML o TXT, leer directamente
        content = await file.text();
      }

      setText(content);
      
      // Importación dinámica de la lógica de parseo para evitar problemas de DOM en SSR
      const { parseInvoiceText } = await import('@/lib/parse-invoice');
      const parsed = parseInvoiceText(content);
      
      if (pdfBase64) {
        parsed.pdfData = pdfBase64;
      }
      
      if (isSale) {
        parsed.issuer = 'UPDM';
      } else {
        parsed.receiver = 'UPDM';
      }
      
      setFields(parsed);
      setMessage('✅ Lectura completada. Revisa los datos.');
    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`❌ ${errMsg}. Prueba pegando el texto manualmente.`);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleManualParse() {
    if (!text.trim()) return;
    const { parseInvoiceText } = await import('@/lib/parse-invoice');
    const parsed = parseInvoiceText(text);
    
    if (isSale) {
      parsed.issuer = 'UPDM';
    } else {
      parsed.receiver = 'UPDM';
    }
    
    setFields(parsed);
    setMessage('✅ Datos detectados del texto pegado.');
  }

  function handleConfirm() {
    if (fields) {
      onParsed?.(fields);
      setFields(null);
      setText('');
      setMessage('✅ Registro exitoso.');
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
        <span className="badge" style={{ background: accent }}>{actionLabel}</span>
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
                borderRadius: '20px',
                padding: '50px 20px',
                textAlign: 'center',
                backgroundColor: isDragging ? '#f0f9ff' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: isProcessing ? 0.5 : 1
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{isProcessing ? '⏳' : '📁'}</div>
              <strong style={{ display: 'block', fontSize: '1.2rem' }}>
                {isProcessing ? 'Procesando archivo...' : 'Arrastra tu PDF o XML aquí'}
              </strong>
              <p style={{ color: '#666', marginTop: '8px' }}>El sistema leerá automáticamente el emisor, folio y montos.</p>
            </div>

            <div className="form__row" style={{ marginTop: '20px' }}>
              <span className="form__label">O pega el texto extraído aquí:</span>
              <textarea
                className="form__textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega aquí el contenido..."
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="form__actions">
              <button className="button button--primary" type="button" onClick={handleManualParse} disabled={isProcessing}>
                Autollenar desde texto
              </button>
              <label className="button button--secondary" style={{ cursor: 'pointer' }}>
                {isProcessing ? 'Espere...' : 'Seleccionar Archivo'}
                <input type="file" hidden onChange={(e) => handleFile(e.target.files?.[0] ?? null)} disabled={isProcessing} />
              </label>
            </div>

            <p className="footer-note" style={{ textAlign: 'center', fontWeight: 600, color: message.startsWith('❌') ? '#c0392b' : '#27ae60' }}>
              {message}
            </p>
          </>
        )}

        {fields && (
          <div className="uploader-review">
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

              <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <label className="form__row">
                  <span className="form__label">Subtotal</span>
                  <input className="form__input" type="number" step="0.01" value={fields.subtotal} onChange={e => setField('subtotal', parseFloat(e.target.value) || 0)} />
                </label>
                <label className="form__row">
                  <span className="form__label">IVA</span>
                  <input className="form__input" type="number" step="0.01" value={fields.iva} onChange={e => setField('iva', parseFloat(e.target.value) || 0)} />
                </label>
                <label className="form__row">
                  <span className="form__label">Total</span>
                  <input className="form__input" type="number" step="0.01" value={fields.total} onChange={e => setField('total', parseFloat(e.target.value) || 0)} />
                </label>
              </div>
            </div>

            <div className="form__actions" style={{ marginTop: '20px' }}>
              <button className="button button--primary" style={{ width: '100%' }} type="button" onClick={handleConfirm}>
                ✅ Todo correcto, registrar
              </button>
              <button className="button button--secondary" style={{ width: '100%' }} type="button" onClick={() => setFields(null)}>
                Volver a intentar
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
