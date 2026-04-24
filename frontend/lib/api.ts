const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.statusText}`);
  }

  return response.json();
}

export async function getDashboardData() {
  return fetchFromApi('/api/dashboard');
}

export async function getAccountingData(range: string = 'month') {
  return fetchFromApi(`/api/accounting?range=${range}`);
}

export async function getAiInsight(range: string = 'month') {
  return fetchFromApi(`/api/ai/insight?range=${range}`);
}

export async function parseInvoice(text: string) {
  return fetchFromApi('/api/invoices/parse', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
