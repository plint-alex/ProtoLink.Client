/** Primary product hosts keep home / `/{code|guid}` behavior (ADR foreign-domain-unique-code). */
const PRIMARY_PRODUCT_HOSTS = new Set(['protolink.ru', 'www.protolink.ru']);

/** Local / Vite / loopback — not treated as foreign unique-code hosts. */
const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Lowercase hostname; strip port (incl. default 80/443). IPv6 bracket form → bare address.
 */
export function normalizeHostname(host: string): string {
    const raw = (host || '').trim().toLowerCase();
    if (!raw) {
        return '';
    }

    if (raw.startsWith('[')) {
        const end = raw.indexOf(']');
        if (end !== -1) {
            return raw.slice(1, end);
        }
    }

    const colon = raw.lastIndexOf(':');
    if (colon > 0 && /^\d+$/.test(raw.slice(colon + 1))) {
        return raw.slice(0, colon);
    }

    return raw;
}

/** True for protolink.ru / www / local-dev hosts (after normalize). */
export function isPrimaryProtoLinkHost(host: string): boolean {
    const hostname = normalizeHostname(host);
    if (!hostname) {
        return true;
    }
    return PRIMARY_PRODUCT_HOSTS.has(hostname) || LOCAL_DEV_HOSTS.has(hostname);
}

/**
 * Canonical unique-code URL on the primary product host.
 * Example: plintec.ru + "?lang=ru" → https://protolink.ru/plintec.ru?lang=ru
 */
export function buildForeignHostCanonicalUrl(host: string, search: string = ''): string {
    const code = normalizeHostname(host);
    const qs = !search ? '' : search.startsWith('?') ? search : `?${search}`;
    return `https://protolink.ru/${code}${qs}`;
}

/**
 * MVP: foreign Host on `/` only → redirect to canonical unique-code path.
 * Pathname must be exactly `/` (or empty).
 */
export function shouldRedirectForeignHostRoot(host: string, pathname: string): boolean {
    if (isPrimaryProtoLinkHost(host)) {
        return false;
    }
    const path = pathname || '/';
    return path === '/' || path === '';
}
