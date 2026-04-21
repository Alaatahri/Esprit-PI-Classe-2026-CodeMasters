import { getStoredUser } from './auth';

export async function fetchAPI(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('bmp_token');
  const user = getStoredUser();
  const headers: any = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (user) {
    headers['x-user-id'] = user._id || "";
    headers['x-user-role'] = user.role || "";
    headers['x-user-email'] = user.email || "";
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP Error ${res.status}: ${text}`);
  }
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text; // fallback to raw string if not JSON
  }
}

export async function fetchAPISafe(url: string, options: RequestInit = {}) {
  try {
    return await fetchAPI(url, options);
  } catch (error) {
    console.error(`fetchAPISafe failed for ${url}:`, error);
    return null;
  }
}
