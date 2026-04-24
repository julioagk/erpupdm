export type ParsedInvoice = {
  provider: string;
  invoiceNumber: string;
  amount: number;
  date: string;
  kind: string;
  description: string;
};

const amountPattern = /(?:\$|MXN\s?)\s?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)/gi;

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

function extractAmount(text: string) {
  const matches = [...text.matchAll(amountPattern)];
  const values = matches
    .map((match) => normalizeNumber(match[1] ?? '0'))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
}

function extractInvoiceNumber(text: string) {
  const numberPattern = /(factura|invoice|folio|no\.?|numero|n[úu]m(?:ero)?)[\s:#-]*([A-Z0-9-]+)/i;
  const match = text.match(numberPattern);

  return match?.[2] ?? 'SIN-REFERENCIA';
}

function extractProvider(text: string) {
  const providerPattern = /(proveedor|emisor|razon social|razon social:)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const match = text.match(providerPattern);

  if (match?.[2]) {
    return match[2].trim();
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 4) ?? 'Proveedor no identificado';
}

function extractDate(text: string) {
  const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/;
  const match = text.match(datePattern);

  return match?.[1] ?? new Date('2026-04-23T12:00:00Z').toISOString().slice(0, 10);
}

function detectKind(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes('venta') || lower.includes('income') || lower.includes('ingreso')) {
    return 'Venta';
  }

  if (lower.includes('gasto') || lower.includes('compra') || lower.includes('egreso') || lower.includes('servicio')) {
    return 'Gasto';
  }

  return 'Documento';
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const normalizedText = text.replace(/\r/g, '\n');
  const provider = extractProvider(normalizedText);
  const invoiceNumber = extractInvoiceNumber(normalizedText);
  const amount = extractAmount(normalizedText);
  const date = extractDate(normalizedText);
  const kind = detectKind(normalizedText);
  const description = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 12) ?? 'Factura procesada automaticamente';

  return {
    provider,
    invoiceNumber,
    amount,
    date,
    kind,
    description
  };
}
