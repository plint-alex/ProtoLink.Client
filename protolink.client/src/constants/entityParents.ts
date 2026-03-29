export const NAME_PARENT_ID = '00010003-0000-0000-0000-000000000000';

export type EntityValueLike = {
    value?: unknown;
    parents?: string[];
};

export function pickLocalizedName(
    values: EntityValueLike[] | undefined,
    lang: string | undefined,
    fallback: string,
    getLanguageParentId?: (langCode: string) => string | undefined
): string {
    const list = values ?? [];
    const langParent = lang ? getLanguageParentId?.(lang) : undefined;
    const englishParent = getLanguageParentId?.('en-US');
    const normalizedFallback = (fallback || '').trim();

    const byParents = (requiredParents: string[]) =>
        list.find((v) =>
            requiredParents.every((parentId) => (v.parents ?? []).includes(parentId))
        );

    if (langParent) {
        const langSpecific = byParents([NAME_PARENT_ID, langParent]);
        if (typeof langSpecific?.value === 'string' && langSpecific.value.trim()) {
            return langSpecific.value.trim();
        }
    }

    if (englishParent) {
        const english = byParents([NAME_PARENT_ID, englishParent]);
        if (typeof english?.value === 'string' && english.value.trim()) {
            return english.value.trim();
        }
    }

    const nameOnly = byParents([NAME_PARENT_ID]);
    if (typeof nameOnly?.value === 'string' && nameOnly.value.trim()) {
        return nameOnly.value.trim();
    }

    return normalizedFallback || '...';
}
