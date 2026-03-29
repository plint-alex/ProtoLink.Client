export const DEFAULT_HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';

export function getDynamicHomePath(userId?: string | null): string {
    const id = userId?.trim();
    return id ? `/${id}` : `/${DEFAULT_HOME_ENTITY_ID}`;
}
