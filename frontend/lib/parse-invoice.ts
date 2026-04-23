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

const amountPattern = /(?:\$|MXN\s?)\s?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)/gi;

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

function extractAmount(text: string) {
  const matches = [...text.matchAll(amountPattern)];
  const values = matches
    .map((match) => normalizeNumber(match[1] ?? '0'))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
}

function extractField(text: string, pattern: RegExp, fallback: string) {
  const match = text.match(pattern);
  return match?.[1]?.trim() || fallback;
}

function extractFolio(text: string) {
  const folioPattern = /(folio|uuid|factura|invoice|no\.?|numero|n[úu]m(?:ero)?)[\s:#-]*([A-Z0-9-]+)/i;
  const match = text.match(folioPattern);

  return match?.[2] ?? 'SIN-FOLIO';
}

function extractIssuer(text: string) {
  const issuerPattern = /(emisor|proveedor|razon social emisor|razon social:|nombre emisor|nombre del emisor)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const match = text.match(issuerPattern);

  return match?.[2]?.trim() || 'Emisor no identificado';
}

function extractReceiver(text: string) {
  const receiverPattern = /(receptor|cliente|razon social receptor|nombre receptor|nombre del receptor|facturado a|a nombre de)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const match = text.match(receiverPattern);

  return match?.[2]?.trim() || 'Receptor no identificado';
}

function extractPaymentMethod(text: string) {
  const methodPattern = /(metodo de pago|forma de pago|pago en)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const match = text.match(methodPattern);

  return match?.[2]?.trim() || 'PPD - Pago en parcialidades o diferido';
}

function extractExpenseType(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes('mensajer')) return 'Mensajería';
  if (lower.includes('administracion') || lower.includes('administración')) return 'Gastos de Administración';
  if (lower.includes('honorarios')) return 'Honorarios Administrativos';
  if (lower.includes('arrend')) return 'Arrendamiento de Inmuebles';
  if (lower.includes('viatico') || lower.includes('viático')) return 'Viáticos y Gastos de Viaje';
  if (lower.includes('oficina')) return 'Gastos de Oficina';
  if (lower.includes('combust')) return 'Combustibles y Lubricantes';
  if (lower.includes('impuesto') || lower.includes('derecho')) return 'Otros Impuestos y Derechos';
  if (lower.includes('suscrip')) return 'Suscripciones y Cuotas';
  if (lower.includes('comisi')) return 'Comisiones Bancarias';
  if (lower.includes('no deduc')) return 'Partidas No Deducibles';
  if (lower.includes('servicio') || lower.includes('material')) return 'Servicios y Materiales Indirectos';

  return 'Gastos de Administración';
}

function extractLineAmount(text: string, label: string) {
  const pattern = new RegExp(`${label}[\\s:#-]*\\$?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)`, 'i');
  const match = text.match(pattern);

  return match?.[1] ? normalizeNumber(match[1]) : 0;
}

function extractTotal(text: string) {
  const totalPattern = /(total|importe total)[\s:#-]*\$?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)/i;
  const match = text.match(totalPattern);

  if (match?.[2]) {
    return normalizeNumber(match[2]);
  }

  return extractAmount(text);
}

function extractSubtotal(text: string) {
  const subtotal = extractLineAmount(text, 'subtotal');
  if (subtotal > 0) {
    return subtotal;
  }

  const total = extractTotal(text);
  const iva = extractIva(text);

  return total > 0 && iva > 0 ? total - iva : 0;
}

function extractIva(text: string) {
  const iva = extractLineAmount(text, 'iva');
  if (iva > 0) {
    return iva;
  }

  const tax = extractLineAmount(text, 'impuesto al valor agregado');
  return tax > 0 ? tax : 0;
}

function extractDate(text: string) {
  const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/;
  const match = text.match(datePattern);

  return match?.[1] ?? new Date('2026-04-23T12:00:00Z').toISOString().slice(0, 10);
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const normalizedText = text.replace(/\r/g, '\n');
  const issuer = extractIssuer(normalizedText);
  const receiver = extractReceiver(normalizedText);
  const folio = extractFolio(normalizedText);
  const date = extractDate(normalizedText);
  const total = extractTotal(normalizedText);
  const subtotal = extractSubtotal(normalizedText);
  const iva = extractIva(normalizedText) || (total > 0 && subtotal > 0 ? total - subtotal : 0);
  const paymentMethod = extractPaymentMethod(normalizedText);
  const expenseType = extractExpenseType(normalizedText);

  return {
    issuer,
    receiver,
    folio,
    date,
    subtotal,
    iva,
    total,
    paymentMethod,
    expenseType
  };
}
