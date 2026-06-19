const AUTH_STORAGE_KEY = "netpulse.auth";

export function getStoredAuth() {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(AUTH_STORAGE_KEY);
  return value ? JSON.parse(value) : null;
}

export function saveStoredAuth(auth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
