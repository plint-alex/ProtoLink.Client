export const DEFAULT_HOME_ENTITY_ID = '3e5a2d6e-27ca-4c8b-89e6-e3cb253c05d6';

/** Used when redirecting `/` so the public home matches e.g. `?lang=ru-RU` on protolink.ru. */
export const DEFAULT_HOME_LANG = 'ru-RU';

export function getDynamicHomePath(userId?: string | null): string {
    const id = userId?.trim();
    return id ? `/${id}` : `/${DEFAULT_HOME_ENTITY_ID}`;
}
