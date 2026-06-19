const AUTH_STORAGE_KEY = "netpulse.auth";

export function getStoredAuth() {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth(auth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
