export const APP_BASE_URL = import.meta.env.BASE_URL || '/';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function assetUrl(path) {
  return `${APP_BASE_URL}${path.replace(/^\//, '')}`;
}

export function watchdogScriptUrl() {
  return API_BASE_URL ? `${API_BASE_URL}/shield/watchdog.js` : '';
}

export async function postLead(payload) {
  if (!API_BASE_URL) {
    console.info('Skipping lead submission because VITE_API_BASE_URL is not configured.');
    return { skipped: true };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`Lead submission failed with status ${response.status}.`);
      return null;
    }

    return response;
  } catch (error) {
    console.warn('Lead submission unavailable:', error);
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
