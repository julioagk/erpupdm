export type ParsedInvoice = {
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

function normalizeNumber(value: string | null) {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  
  const lastDotIndex = cleaned.lastIndexOf('.');
  const lastCommaIndex = cleaned.lastIndexOf(',');
  
  if (lastDotIndex > -1 && lastCommaIndex > -1) {
    if (lastCommaIndex > lastDotIndex) {
      // European format: 18.842,30
      return Number(cleaned.replace(/\./g, '').replace(',', '.'));
    } else {
      // US/Mexico format: 18,842.30
      return Number(cleaned.replace(/,/g, ''));
    }
  }
  
  if (lastCommaIndex > -1) {
    // Si solo hay comas, podría ser un separador de miles (ej: 18,842) o un decimal (18,8)
    // Si tiene exactamente 2 digitos al final, asumimos decimal
    if (cleaned.length - lastCommaIndex === 3) {
      return Number(cleaned.replace(',', '.'));
    }
    // De lo contrario, lo tratamos como separador de miles
    return Number(cleaned.replace(/,/g, ''));
  }

  return Number(cleaned);
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const normalizedText = text.replace(/\r/g, '\n').replace(/\s*-\s*/g, '-').trim();
  
  // ── 1. INTENTAR PARSEO ESTRUCTURAL (DOMParser para XML) ──
  if (normalizedText.startsWith('<')) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(normalizedText, "text/xml");
      
      const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0] || xmlDoc.getElementsByTagName("Comprobante")[0];
      const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0] || xmlDoc.getElementsByTagName("Emisor")[0];
      const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0] || xmlDoc.getElementsByTagName("Receptor")[0];
      const timbre = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0];

      if (comprobante) {
        const total = normalizeNumber(comprobante.getAttribute("Total"));
        const subtotal = normalizeNumber(comprobante.getAttribute("SubTotal"));
        const serie = comprobante.getAttribute("Serie");
        const folio = comprobante.getAttribute("Folio");
        const uuid = timbre?.getAttribute("UUID");
        const fecha = comprobante.getAttribute("Fecha");
        const metodo = comprobante.getAttribute("MetodoPago");
        
        return {
          issuer: emisor?.getAttribute("Nombre") || emisor?.getAttribute("nombre") || "Emisor no identificado",
          receiver: receptor?.getAttribute("Nombre") || receptor?.getAttribute("nombre") || "Receptor no identificado",
          folio: serie ? `${serie}-${folio || ''}` : (folio || uuid || 'SIN-FOLIO'),
          date: fecha?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          total: total,
          subtotal: subtotal,
          iva: Math.max(0, total - subtotal),
          paymentMethod: metodo || "PUE",
          expenseType: 'Gastos de Administración'
        };
      }
    } catch (e) {
      console.error("Error en parseo estructural, usando fallback de texto", e);
    }
  }

  // ── 2. FALLBACK: BÚSQUEDA POR TEXTO (Para PDFs pegados o XMLs mal formados) ──
  const folioPattern = /(?:factura|invoice|folio|no\.?|numero|n[úu]m(?:ero)?)[\s:#-]*([A-Z0-9-]+)/i;
  const issuerPattern = /(emisor|proveedor|razon social emisor|razon social:|nombre emisor|nombre del emisor)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const receiverPattern = /(receptor|cliente|razon social receptor|nombre receptor|nombre del receptor|facturado a)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  
  const amountRegex = /(?:\$|MXN\s?)?\s?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2}|[0-9]+[.,][0-9]{2})/;
  
  const totalPattern = new RegExp(`\\b(?:total|importe total)\\b[\\s:#-]*${amountRegex.source}`, 'i');
  const subtotalPattern = new RegExp(`(?:subtotal|sub-total)[\\s:#-]*${amountRegex.source}`, 'i');
  const ivaPattern = new RegExp(`(?:iva|impuesto al valor agregado|traslados)[^\\r\\n]{0,40}?${amountRegex.source}`, 'i');

  const datePattern = /(?:fecha|emisi[oó]n|date)[\s:#-]*([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4}(?:\s*[0-9]{2}:[0-9]{2}:[0-9]{2})?|[0-9]{4}-[0-9]{2}-[0-9]{2}(?:\s*[0-9]{2}:[0-9]{2}:[0-9]{2})?)/i;
  const paymentMethodPattern = /(?:m[eé]todo\s*de\s*pago|metodo\s*pago|forma\s*de\s*pago)[\s:#-]*(PUE|PPD|Pago en una sola exhibición|Pago en parcialidades)/i;

  const totalMatch = normalizedText.match(totalPattern);
  const subtotalMatch = normalizedText.match(subtotalPattern);
  const ivaMatch = normalizedText.match(ivaPattern);
  const dateMatch = normalizedText.match(datePattern);
  const paymentMatch = normalizedText.match(paymentMethodPattern);
  
  const total = totalMatch ? normalizeNumber(totalMatch[1]) : 0;
  const subtotal = subtotalMatch ? normalizeNumber(subtotalMatch[1]) : 0;
  const iva = ivaMatch ? normalizeNumber(ivaMatch[1]) : 0;

  const folioMatch = normalizedText.match(folioPattern);
  const issuerMatch = normalizedText.match(issuerPattern);
  const receiverMatch = normalizedText.match(receiverPattern);
  
  let parsedDate = new Date().toISOString().slice(0, 16); // YYYY-MM-DDThh:mm
  if (dateMatch) {
    // Si viene como 2026-04-13T14:41:56, quitamos los segundos para datetime-local
    let d = dateMatch[1].trim();
    if (d.includes('T') && d.length > 16) d = d.substring(0, 16);
    else if (d.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/)) {
       // DD/MM/YYYY
       const parts = d.split(' ')[0].split('/');
       d = `${parts[2]}-${parts[1]}-${parts[0]}T12:00`;
    }
    else if (d.length === 10) d = `${d}T12:00`; // YYYY-MM-DD -> YYYY-MM-DDThh:mm
    parsedDate = d;
  }
  
  let parsedPayment = 'PUE - Pago en una sola exhibición';
  if (paymentMatch) {
    const p = paymentMatch[1].toUpperCase();
    if (p.includes('PPD') || p.includes('PARCIALIDADES')) parsedPayment = 'PPD - Pago en parcialidades o diferido';
    else if (p.includes('PUE') || p.includes('UNA SOLA')) parsedPayment = 'PUE - Pago en una sola exhibición';
    else parsedPayment = paymentMatch[1];
  }
  
  return {
    issuer: issuerMatch?.[2]?.trim() || 'Emisor no identificado',
    receiver: receiverMatch?.[2]?.trim() || 'Receptor no identificado',
    folio: folioMatch ? folioMatch[1].trim() : 'SIN-FOLIO',
    date: parsedDate,
    total: total,
    subtotal: subtotal,
    iva: iva,
    paymentMethod: parsedPayment,
    expenseType: 'Gastos de Administración'
  };
}
