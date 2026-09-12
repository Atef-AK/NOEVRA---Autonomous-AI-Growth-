import { URL } from 'node:url';
import { lookup } from 'node:dns/promises';

/**
 * Private/reserved IP ranges that must not be accessed via user-provided URLs.
 * Protecting against SSRF attacks.
 */
const PRIVATE_IP_RANGES = [
  // Loopback
  /^127\./,
  /^::1$/,
  // Private ranges
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // Link-local (includes AWS metadata 169.254.169.254)
  /^169\.254\./,
  /^fe80:/i,
  // Unique local
  /^fc00:/i,
  /^fd/i,
  // Other reserved
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  // IPv6 loopback
  /^0000:0000:0000:0000:0000:0000:0000:0001$/,
];

/** Cloud metadata endpoints */
const BLOCKED_HOSTNAMES = [
  '169.254.169.254', // AWS/GCP/Azure instance metadata
  'metadata.google.internal',
  'metadata.internal',
];

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

/**
 * Validate that a URL is safe to fetch (not pointing at internal infrastructure).
 * Throws SSRFError if the URL is unsafe.
 *
 * @param rawUrl - The URL to validate
 * @param options - Optional configuration
 */
export async function validateSafeUrl(
  rawUrl: string,
  options: {
    allowedProtocols?: string[];
    maxRedirects?: number;
  } = {},
): Promise<URL> {
  const allowedProtocols = options.allowedProtocols ?? ['http:', 'https:'];

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new SSRFError(`Invalid URL: ${rawUrl}`);
  }

  // Protocol check
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    throw new SSRFError(
      `Protocol "${parsedUrl.protocol}" is not allowed. Allowed: ${allowedProtocols.join(', ')}`,
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Blocked hostname check
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new SSRFError(`Hostname "${hostname}" is not allowed (blocked metadata endpoint)`);
  }

  // Localhost check
  if (hostname === 'localhost') {
    throw new SSRFError(`Hostname "localhost" is not allowed`);
  }

  // Resolve hostname to IP and check against private ranges
  let resolvedAddresses: string[];
  try {
    const result = await lookup(hostname, { all: true });
    resolvedAddresses = result.map((r) => r.address);
  } catch {
    throw new SSRFError(`Could not resolve hostname: ${hostname}`);
  }

  for (const ip of resolvedAddresses) {
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(ip)) {
        throw new SSRFError(
          `URL resolves to private/reserved IP address "${ip}" — SSRF protection`,
        );
      }
    }
  }

  return parsedUrl;
}

/**
 * Synchronous URL validation (no DNS resolution — use for format checks only).
 * Does NOT protect against DNS rebinding. Use validateSafeUrl for full protection.
 */
export function validateUrlFormat(rawUrl: string): URL {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new SSRFError(`Protocol "${parsed.protocol}" is not allowed`);
    }
    return parsed;
  } catch (err) {
    if (err instanceof SSRFError) throw err;
    throw new SSRFError(`Invalid URL: ${rawUrl}`);
  }
}
