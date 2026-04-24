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
  console.log('[PARSE] Texto recibido (primeros 500 chars):', normalizedText.slice(0, 500));
  
  const folioPattern = /\b(?:factura|invoice|folio|serie\s*y\s*folio|ref(?:erencia)?|ticket|comprobante)[\s:=#-]*([A-Za-z0-9][A-Za-z0-9-]{2,20})\b/i;
  const issuerPattern = /\b(?:emisor|raz[oó]n\s*social(?:\s*(?:del\s*)?emisor)?|nombre\s*(?:del\s*)?emisor|expedido\s*por|vendedor)[\s:=#-]*([^\r\n]{3,100})/i;
  const receiverPattern = /\b(?:receptor|cliente|raz[oó]n\s*social(?:\s*(?:del\s*)?receptor)?|nombre\s*(?:del\s*)?receptor|nombre\s*(?:del\s*)?cliente|facturado\s*a|comprador)[\s:=#-]*([^\r\n]{3,100})/i;
  
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
  if (!issuer || issuer.toLowerCase().includes('certificaci') || issuer.toLowerCase().includes('sello')) {
    // Buscar: "ALGO RFC: XXXX" → capturar ALGO
    const rfcMatch = normalizedText.match(/([A-ZÀ-ÿ\s0-9.,\&-]{4,60})\s*RFC\s*[:\s]+[A-Z]{3,4}[0-9]{6}/i);
    if (rfcMatch && !rfcMatch[1].toLowerCase().includes('receptor') && !rfcMatch[1].toLowerCase().includes('cliente')) {
      issuer = rfcMatch[1].trim();
    } else {
      // Tomar la primera línea que parezca un nombre de empresa (evitando ruidos)
      const lines = normalizedText.split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 5 && !/^[0-9$]/.test(l) && !/sello|certificado|timbre|página|digital|fiscal|sucursal/i.test(l));
      
      if (lines.length > 0) {
        issuer = lines[0];
      }
    }
  }

  // Fallback para Folio: Buscar UUID, código alfanumérico tras FOLIO, o cualquier código largo
  if (!folio || folio === 'SIN-FOLIO' || /mbre|fiscal|digital/i.test(folio)) {
    // Paso 1: Buscar "FOLIO" seguido de un código
    const specificFolioMatch = normalizedText.match(/\bFOLIO[\s:=#-]*\n?\s*([A-Za-z0-9]{3,20})\b/i);
    if (specificFolioMatch) {
      folio = specificFolioMatch[1].trim();
    } else {
      // Paso 2: Buscar UUID
      const uuidMatch = normalizedText.match(/[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/i);
      if (uuidMatch) {
        folio = uuidMatch[0].slice(-12);
      } else {
        folio = 'SIN-FOLIO';
      }
    }
  }
  
  console.log('[PARSE] Resultado → Emisor:', issuer, '| Folio:', folio);

  // Limpieza final para quitar ruidos comunes
  const cleanup = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^(?:NOMBRE|EMISOR|RECEPTOR|CLIENTE|PROVEEDOR|RAZON\s*SOCIAL|DESTINATARIO)[\s:#-]*/i, '')
      .replace(/(?:RFC|TEL|DOMICILIO|PAGINA|WWW|EMAIL|FOLIO|EMISOR|RECEPTOR|SELLO|CERTIFICADO|TIMBRE).*/i, '')
      .trim();
  };

  issuer = cleanup(issuer);
  receiver = cleanup(receiver);

  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 16);
  let parsedDate = localISOTime; 

  if (dateMatch) {
    let d = dateMatch[1].trim();
    if (d.includes('T') && d.length > 16) d = d.substring(0, 16);
    else if (d.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/)) {
       const parts = d.split(' ')[0].split('/');
       d = `${parts[2]}-${parts[1]}-${parts[0]}T12:00`;
    }
    else if (d.length === 10) d = `${d}T12:00`;
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
