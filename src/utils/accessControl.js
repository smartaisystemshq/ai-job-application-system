const TOKEN_KEY = 'jas.access.token';
const TOKEN_VALUE = 'unlocked-v1';

export function isUnlocked() {
  return localStorage.getItem('sas_unlocked') === 'true';
}

export async function unlockApp(code) {
  try {
    const response = await fetch('/api/validate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (data.valid) {
      localStorage.setItem(TOKEN_KEY, TOKEN_VALUE);
      return { valid: true };
    }
    return { valid: false, blocked: data.blocked, attemptsRemaining: data.attemptsRemaining };
  } catch {
    return { valid: false };
  }
}

export function lockApp() {
  localStorage.removeItem(TOKEN_KEY);
}
