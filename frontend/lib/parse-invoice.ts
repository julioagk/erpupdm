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

function normalizeNumber(value: string | null) {
  if (!value) return 0;
  const cleaned = value.replace(/\s/g, '').replace(/[^0-9,.-]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  if (cleaned.includes(',')) {
    return Number(cleaned.replace(/,/g, '.'));
  }
  return Number(cleaned);
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const normalizedText = text.replace(/\r/g, '\n').trim();
  
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
  const folioPattern = /(?:factura|invoice|folio|no\.?|numero|n[úu]m(?:ero)?)[\s:#-]*([A-Z0-9\s-]+)/i;
  const issuerPattern = /(emisor|proveedor|razon social emisor|razon social:|nombre emisor|nombre del emisor)[\s:]*([A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ .,&-]+)/i;
  const totalPattern = /(total|importe total)[\s:#-]*\$?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)/i;

  const totalMatch = normalizedText.match(totalPattern);
  const total = totalMatch ? normalizeNumber(totalMatch[2]) : 0;
  const folioMatch = normalizedText.match(folioPattern);
  
  return {
    issuer: normalizedText.match(issuerPattern)?.[2]?.trim() || 'Emisor no identificado',
    receiver: 'Receptor no identificado',
    folio: folioMatch ? folioMatch[1].trim() : 'SIN-FOLIO',
    date: new Date().toISOString().slice(0, 10),
    total: total,
    subtotal: total / 1.16,
    iva: total - (total / 1.16),
    paymentMethod: 'PUE - Pago en una sola exhibición',
    expenseType: 'Gastos de Administración'
  };
}
