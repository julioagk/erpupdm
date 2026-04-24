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
  const folioPattern = /(?:factura|invoice|folio|no\.?|numero|n[úu]m(?:ero)?|serie\s*y\s*folio|ref)[\s:#-]*([A-Z0-9-]{3,25})/i;
  const issuerPattern = /(?:emisor|proveedor|razon\s*social(?:\s*emisor)?|razon\s*social:|nombre\s*emisor|nombre\s*del\s*emisor|expedido\s*por)[\s:#-]*([^\r\n]+)/i;
  const receiverPattern = /(?:receptor|cliente|razon\s*social(?:\s*receptor)?|nombre\s*receptor|nombre\s*del\s*receptor|facturado\s*a)[\s:#-]*([^\r\n]+)/i;
  
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
  const folioMatch = normalizedText.match(folioPattern);
  const issuerMatch = normalizedText.match(issuerPattern);
  const receiverMatch = normalizedText.match(receiverPattern);
  
  const total = totalMatch ? normalizeNumber(totalMatch[1]) : 0;
  const subtotal = subtotalMatch ? normalizeNumber(subtotalMatch[1]) : 0;
  const iva = ivaMatch ? normalizeNumber(ivaMatch[1]) : 0;

  let issuer = issuerMatch ? issuerMatch[1].trim() : '';
  let receiver = receiverMatch ? receiverMatch[1].trim() : '';
  let folio = folioMatch ? folioMatch[1].trim() : '';

  // Fallback para Emisor: Buscar antes de un RFC o la primera línea significativa
  if (!issuer) {
    const rfcMatch = normalizedText.match(/([A-Z\s0-9.,&-]+)\s+RFC\s*[:\s]+[A-Z]{3,4}[0-9]{6}/i);
    if (rfcMatch) {
      issuer = rfcMatch[1].trim();
    } else {
      // Tomar la primera línea que no sea un número o fecha corta
      const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
      issuer = lines[0] || 'Emisor no identificado';
    }
  }

  // Fallback para Folio: Buscar UUID o buscar cerca de la palabra FOLIO si falló el patrón
  if (!folio || folio === 'SIN-FOLIO') {
    const specificFolioMatch = normalizedText.match(/FOLIO[\s:#-]*([A-Z0-9]{5,25})/i);
    if (specificFolioMatch) {
      folio = specificFolioMatch[1].trim();
    } else {
      const uuidMatch = normalizedText.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);
      if (uuidMatch) folio = uuidMatch[0].slice(-12); // Tomar los últimos 12 del UUID
      else folio = 'SIN-FOLIO';
    }
  }

  // Limpieza final para quitar ruidos comunes
  const cleanup = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^(?:NOMBRE|EMISOR|RECEPTOR|CLIENTE|PROVEEDOR|RAZON\s*SOCIAL)[\s:#-]*/i, '') // Quitar prefijos al inicio
      .replace(/(?:RFC|TEL|DOMICILIO|PAGINA|WWW|EMAIL|FOLIO|EMISOR|RECEPTOR).*/i, '') // Quitar ruidos que vienen después
      .trim();
  };

  issuer = cleanup(issuer);
  receiver = cleanup(receiver);

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
    issuer: issuer,
    receiver: receiver || 'Receptor no identificado',
    folio: folio,
    date: parsedDate,
    total: total,
    subtotal: subtotal,
    iva: iva,
    paymentMethod: parsedPayment,
    expenseType: 'Gastos de Administración'
  };
}
