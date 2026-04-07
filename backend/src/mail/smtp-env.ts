/**
 * Gmail / Google : mot de passe d’application = 16 caractères ; les espaces
 * affichés par Google doivent être retirés pour l’auth SMTP.
 */
function normalizeAppPassword(pass: string): string {
  return pass.replace(/\s/g, '');
}

function isGmailHost(host: string): boolean {
  return /gmail\.com|googlemail\.com/i.test(host);
}

/**
 * Identifiants SMTP depuis l’environnement (normalisés pour Gmail).
 * Host par défaut : smtp.gmail.com si absent (MAIL_USER + MAIL_PASS suffisent souvent).
 */
export function getSmtpCredentials():
  | { host: string; user: string; pass: string }
  | null {
  const host =
    process.env.MAIL_HOST?.trim() || 'smtp.gmail.com';
  const rawUser = process.env.MAIL_USER?.trim() || '';
  const pass = normalizeAppPassword(process.env.MAIL_PASS ?? '');
  if (!rawUser || !pass) return null;
  const user = isGmailHost(host) ? rawUser.toLowerCase() : rawUser;
  return { host, user, pass };
}

export function isSmtpConfigured(): boolean {
  return getSmtpCredentials() !== null;
}

