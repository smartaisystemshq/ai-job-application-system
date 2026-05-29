const TOKEN_KEY = 'jas.access.token';
const TOKEN_VALUE = 'unlocked-v1';

export function isUnlocked() {
  try {
    return localStorage.getItem(TOKEN_KEY) === TOKEN_VALUE;
  } catch {
    return false;
  }
}

export async function unlockApp(code) {
  const res = await fetch('/api/validate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (data.valid) {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALUE);
    return true;
  }
  return false;
}

export function lockApp() {
  localStorage.removeItem(TOKEN_KEY);
}
