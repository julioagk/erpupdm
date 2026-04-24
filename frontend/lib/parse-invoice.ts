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
};

function normalizeNumber(value: string) {
  const cleaned = value.replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  if (cleaned.includes(',')) {
    return Number(cleaned.replace(/,/g, '.'));
  }
  return Number(cleaned);
}

// Extraer atributos de XML (SAT)
function extractXmlAttribute(text: string, attribute: string) {
  const pattern = new RegExp(`${attribute}="([^"]+)"`, 'i');
  const match = text.match(pattern);
  return match?.[1] || null;
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const normalizedText = text.replace(/\r/g, '\n');
  
  // 1. Intentar detectar si es un XML del SAT
  const xmlTotal = extractXmlAttribute(normalizedText, 'Total');
  const xmlSubtotal = extractXmlAttribute(normalizedText, 'SubTotal');
  const xmlFolio = extractXmlAttribute(normalizedText, 'Folio') || extractXmlAttribute(normalizedText, 'UUID');
  const xmlDate = extractXmlAttribute(normalizedText, 'Fecha');
  const xmlIssuer = extractXmlAttribute(normalizedText, 'Nombre'); // El primero suele ser el emisor
  const xmlPaymentMethod = extractXmlAttribute(normalizedText, 'MetodoPago') || extractXmlAttribute(normalizedText, 'FormaPago');

  // Si detectamos que es un XML con datos claros
  if (xmlTotal || xmlFolio) {
    // Intentar buscar el receptor (segundo Nombre en el XML)
    const names = [...normalizedText.matchAll(/Nombre="([^"]+)"/gi)];
    const issuer = names[0]?.[1] || 'Emisor no identificado';
    const receiver = names[1]?.[1] || 'Receptor no identificado';

    return {
      issuer,
      receiver,
      folio: xmlFolio || 'SIN-FOLIO',
      date: xmlDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      total: normalizeNumber(xmlTotal || '0'),
      subtotal: normalizeNumber(xmlSubtotal || '0'),
      iva: normalizeNumber(xmlTotal || '0') - normalizeNumber(xmlSubtotal || '0'),
      paymentMethod: xmlPaymentMethod || 'PPD',
      expenseType: 'Gastos de Administración'
    };
  }

  // 2. Fallback a búsqueda por texto (para PDFs pegados o archivos planos)
  const folioPattern = /(folio|uuid|factura|invoice|no\.?|numero|n[úu]m(?:ero)?)[\s:#-]*([A-Z0-9-]+)/i;
  const issuerPattern = /(emisor|proveedor|razon social emisor|razon social:|nombre emisor|nombre del emisor)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const totalPattern = /(total|importe total)[\s:#-]*\$?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)/i;

  const totalMatch = normalizedText.match(totalPattern);
  const total = totalMatch ? normalizeNumber(totalMatch[2]) : 0;
  
  return {
    issuer: normalizedText.match(issuerPattern)?.[2]?.trim() || 'Emisor no identificado',
    receiver: 'Receptor no identificado',
    folio: normalizedText.match(folioPattern)?.[2] || 'SIN-FOLIO',
    date: new Date().toISOString().slice(0, 10),
    total: total,
    subtotal: total / 1.16,
    iva: total - (total / 1.16),
    paymentMethod: 'PUE - Pago en una sola exhibición',
    expenseType: 'Gastos de Administración'
  };
}
