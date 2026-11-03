const baseUrl = process.env.EXPO_PUBLIC_API_URL;

async function request(path, options = {}) {
  if (!baseUrl) throw new Error('Configure EXPO_PUBLIC_API_URL no arquivo .env.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Não foi possível carregar os avisos (HTTP ${response.status}).`);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('A conexão demorou demais. Tente novamente.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get: path => request(path),
};
