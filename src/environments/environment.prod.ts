// Producción: la URL real de la API se lee en tiempo de ejecución desde public/config.json.
export const environment = {
  production: true,
  useMockApi: false,
  apiBaseUrl: 'http://localhost:5000',
  currencyCode: 'USD',
  locale: 'en-US',
};
