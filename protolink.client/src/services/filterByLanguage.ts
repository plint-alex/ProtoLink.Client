import { DEFAULT_SITE_LANGUAGE_CODES } from './resolveUrlLanguage'

export type EntityWithParents = {
  parents?: unknown
  parentIds?: unknown
  Parents?: unknown
  ParentIds?: unknown
}

function coerceId(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    const id = o.entityParentId ?? o.EntityParentId ?? o.id ?? o.Id
    return id != null ? String(id) : ''
  }
  return ''
}

/** Collect entity parent ids from common GetEntities / caller shapes. */
export function collectEntityParentIds(entity: EntityWithParents): string[] {
  const buckets = [entity.parents, entity.Parents, entity.parentIds, entity.ParentIds]
  const out: string[] = []
  for (const bucket of buckets) {
    if (bucket == null) continue
    if (Array.isArray(bucket)) {
      for (const item of bucket) {
        const id = coerceId(item).trim()
        if (id) out.push(id)
      }
      continue
    }
    if (typeof bucket === 'string') {
      const parts = bucket.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean)
      out.push(...parts)
    }
  }
  return out
}

/**
 * L4 entity filter: untagged entities appear in every language;
 * entities tagged with one or more language parents appear only for those langs.
 */
export function filterByLanguage<T extends EntityWithParents>(
  entities: T[] | null | undefined,
  lang: string,
  getLanguageId: (langCode: string) => string | undefined,
  siteLanguageCodes: readonly string[] = DEFAULT_SITE_LANGUAGE_CODES
): T[] {
  const list = entities ?? []
  const codes = siteLanguageCodes.length ? siteLanguageCodes : DEFAULT_SITE_LANGUAGE_CODES
  const languageIdSet = new Set(
    codes
      .map((code) => getLanguageId(code)?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id))
  )
  const wantId = getLanguageId(lang)?.trim().toLowerCase()

  if (languageIdSet.size === 0) {
    return [...list]
  }

  return list.filter((entity) => {
    const parentIds = collectEntityParentIds(entity).map((p) => p.toLowerCase())
    const tagged = parentIds.filter((p) => languageIdSet.has(p))
    if (tagged.length === 0) return true
    if (!wantId) return true
    return tagged.includes(wantId)
  })
}
