/** Anonymous product home (`home_entity`). Public Drive CloudRoot remains `3e5a2d6e-27ca-4c8b-89e6-e3cb253c05d6`. */
export const DEFAULT_HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';

/** Used when redirecting `/` or adding a missing `lang` query param (URL still overrides). */
export const DEFAULT_HOME_LANG = 'en-US';

export function getDynamicHomePath(userId?: string | null): string {
    const id = userId?.trim();
    return id ? `/${id}` : `/${DEFAULT_HOME_ENTITY_ID}`;
}
