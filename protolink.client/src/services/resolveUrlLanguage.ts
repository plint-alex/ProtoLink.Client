/** Canonical site language codes (BCP-47). */
export const DEFAULT_SITE_LANGUAGE_CODES = ['ru-RU', 'en-US'] as const

export const DEFAULT_LANGUAGE_CODE = 'en-US'

export const PREFERRED_LANGUAGE_KEY = 'preferred-language'

/** Short aliases accepted in `?lang=` (any case). */
const LANG_ALIASES: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
}

export type ResolveUrlLanguageSource = 'url' | 'preference' | 'browser' | 'default'

export type ResolveUrlLanguageResult = {
  code: string
  source: ResolveUrlLanguageSource
}

function normalizeSiteCodes(siteLanguageCodes: readonly string[]): string[] {
  const codes = siteLanguageCodes.length
    ? [...siteLanguageCodes]
    : [...DEFAULT_SITE_LANGUAGE_CODES]
  return codes.filter((c) => typeof c === 'string' && c.trim().length > 0)
}

/**
 * Normalize a raw `?lang=` value to a site language code, or null if unknown.
 * Accepts full codes (any case) and aliases `ru` / `en`.
 */
export function normalizeLangParam(
  raw: string | null | undefined,
  siteLanguageCodes: readonly string[] = DEFAULT_SITE_LANGUAGE_CODES
): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null

  const codes = normalizeSiteCodes(siteLanguageCodes)
  const lower = trimmed.toLowerCase()

  const exact = codes.find((c) => c.toLowerCase() === lower)
  if (exact) return exact

  const aliased = LANG_ALIASES[lower]
  if (aliased) {
    const match = codes.find((c) => c.toLowerCase() === aliased.toLowerCase())
    return match ?? null
  }

  return null
}

/**
 * First navigator language whose primary subtag matches a site language
 * (`ru-*` → `ru-RU`, `en-*` → `en-US`).
 */
export function matchBrowserLanguage(
  navigatorLanguages: readonly string[],
  siteLanguageCodes: readonly string[] = DEFAULT_SITE_LANGUAGE_CODES
): string | null {
  const codes = normalizeSiteCodes(siteLanguageCodes)
  for (const entry of navigatorLanguages) {
    const primary = String(entry || '')
      .trim()
      .split(/[-_]/)[0]
      ?.toLowerCase()
    if (!primary) continue
    const match = codes.find((c) => c.split(/[-_]/)[0]?.toLowerCase() === primary)
    if (match) return match
  }
  return null
}

/**
 * L3 resolution: URL → preferred-language → browser → en-US.
 */
export function resolveUrlLanguage(input: {
  urlLang?: string | null
  preferredLanguage?: string | null
  navigatorLanguages?: readonly string[]
  siteLanguageCodes?: readonly string[]
  defaultCode?: string
}): ResolveUrlLanguageResult {
  const siteCodes = normalizeSiteCodes(input.siteLanguageCodes ?? DEFAULT_SITE_LANGUAGE_CODES)
  const fallback =
    siteCodes.find((c) => c === (input.defaultCode ?? DEFAULT_LANGUAGE_CODE)) ??
    siteCodes[0] ??
    DEFAULT_LANGUAGE_CODE

  const fromUrl = normalizeLangParam(input.urlLang, siteCodes)
  if (fromUrl) return { code: fromUrl, source: 'url' }

  const fromPref = normalizeLangParam(input.preferredLanguage, siteCodes)
  if (fromPref) return { code: fromPref, source: 'preference' }

  const fromBrowser = matchBrowserLanguage(input.navigatorLanguages ?? [], siteCodes)
  if (fromBrowser) return { code: fromBrowser, source: 'browser' }

  return { code: fallback, source: 'default' }
}

/** Primary subtag for `<html lang>` / hreflang (`ru-RU` → `ru`). */
export function languagePrimaryTag(code: string): string {
  const primary = String(code || '')
    .trim()
    .split(/[-_]/)[0]
  return primary ? primary.toLowerCase() : 'en'
}

/** Telegram-style short label (`ru-RU` → `RU`). */
export function languageShortLabel(code: string): string {
  return languagePrimaryTag(code).toUpperCase() || 'EN'
}
