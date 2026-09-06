export const NAME_PARENT_ID = '00010003-0000-0000-0000-000000000000';

export type EntityValueLike = {
    value?: unknown;
    parents?: string[];
};

function normalizeParentIdList(parents: string[] | undefined): string[] {
    return (parents ?? []).map((p) => String(p).toLowerCase());
}

export function pickLocalizedName(
    values: EntityValueLike[] | undefined,
    lang: string | undefined,
    fallback: string,
    getLanguageParentId?: (langCode: string) => string | undefined
): string {
    const list = values ?? [];
    const requestedLang = (lang || '').trim();
    const langParent = requestedLang ? getLanguageParentId?.(requestedLang) : undefined;
    const englishParent = getLanguageParentId?.('en-US');
    const normalizedFallback = (fallback || '').trim();

    const byParents = (requiredParents: string[]) =>
        list.find((v) => {
            const vp = normalizeParentIdList(v.parents);
            return requiredParents.every((parentId) =>
                vp.includes(String(parentId).toLowerCase())
            );
        });

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

    // When a language was requested, do not fall through to untagged/foreign name-only
    // values (e.g. ru-RU-tagged names matching [name] alone) — use the explicit fallback.
    if (requestedLang) {
        return normalizedFallback || '...';
    }

    const nameOnly = byParents([NAME_PARENT_ID]);
    if (typeof nameOnly?.value === 'string' && nameOnly.value.trim()) {
        return nameOnly.value.trim();
    }

    return normalizedFallback || '...';
}
