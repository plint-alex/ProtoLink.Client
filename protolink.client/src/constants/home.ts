/** Product home (`home_entity`). Public Drive CloudRoot remains `3e5a2d6e-27ca-4c8b-89e6-e3cb253c05d6`. */
export const DEFAULT_HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';

/** Used when redirecting `/` or adding a missing `lang` query param (URL still overrides). */
export const DEFAULT_HOME_LANG = 'en-US';

/** Logo and bare `/` always land on product home — never `/{userId}` (AH2/AH3 revised 2026-10-23). */
export function getDynamicHomePath(): string {
    return `/${DEFAULT_HOME_ENTITY_ID}`;
}
