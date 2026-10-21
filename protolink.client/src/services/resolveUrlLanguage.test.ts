import { describe, expect, it } from 'vitest'
import {
  languagePrimaryTag,
  languageShortLabel,
  matchBrowserLanguage,
  normalizeLangParam,
  resolveUrlLanguage,
} from './resolveUrlLanguage'

describe('normalizeLangParam', () => {
  it('accepts full codes case-insensitively', () => {
    expect(normalizeLangParam('ru-RU')).toBe('ru-RU')
    expect(normalizeLangParam('ru-ru')).toBe('ru-RU')
    expect(normalizeLangParam('EN-US')).toBe('en-US')
  })

  it('normalizes aliases ru/en', () => {
    expect(normalizeLangParam('ru')).toBe('ru-RU')
    expect(normalizeLangParam('EN')).toBe('en-US')
  })

  it('returns null for unknown values', () => {
    expect(normalizeLangParam('de')).toBeNull()
    expect(normalizeLangParam('')).toBeNull()
    expect(normalizeLangParam(null)).toBeNull()
  })
})

describe('matchBrowserLanguage', () => {
  it('maps ru-* and en-* primary subtags to site codes', () => {
    expect(matchBrowserLanguage(['ru-RU', 'en-US'])).toBe('ru-RU')
    expect(matchBrowserLanguage(['en-GB', 'ru'])).toBe('en-US')
    expect(matchBrowserLanguage(['de-DE', 'fr-FR'])).toBeNull()
  })
})

describe('resolveUrlLanguage', () => {
  it('prefers URL over preference and browser', () => {
    const result = resolveUrlLanguage({
      urlLang: 'ru',
      preferredLanguage: 'en-US',
      navigatorLanguages: ['en-US'],
    })
    expect(result).toEqual({ code: 'ru-RU', source: 'url' })
  })

  it('uses preferred-language when URL has no valid lang', () => {
    const result = resolveUrlLanguage({
      urlLang: 'de',
      preferredLanguage: 'en-US',
      navigatorLanguages: ['ru-RU'],
    })
    expect(result).toEqual({ code: 'en-US', source: 'preference' })
  })

  it('uses browser when no URL and no preference', () => {
    const result = resolveUrlLanguage({
      urlLang: undefined,
      preferredLanguage: null,
      navigatorLanguages: ['ru-RU', 'en-US'],
    })
    expect(result).toEqual({ code: 'ru-RU', source: 'browser' })
  })

  it('falls back to en-US', () => {
    const result = resolveUrlLanguage({
      urlLang: '',
      preferredLanguage: '',
      navigatorLanguages: ['de-DE'],
    })
    expect(result).toEqual({ code: 'en-US', source: 'default' })
  })
})

describe('languagePrimaryTag / languageShortLabel', () => {
  it('derives html lang and short labels', () => {
    expect(languagePrimaryTag('ru-RU')).toBe('ru')
    expect(languagePrimaryTag('en-US')).toBe('en')
    expect(languageShortLabel('ru-RU')).toBe('RU')
    expect(languageShortLabel('en-US')).toBe('EN')
  })
})
