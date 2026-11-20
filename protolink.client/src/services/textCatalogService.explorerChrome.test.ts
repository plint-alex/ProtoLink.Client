import { describe, expect, it } from 'vitest'
import {
    EXPLORER_CHROME_DEFAULTS_EN,
    resolveExplorerChromeLabel,
} from './textCatalogService'

describe('resolveExplorerChromeLabel', () => {
    it('uses EN defaults when catalog map is empty (prod kids=0)', () => {
        expect(resolveExplorerChromeLabel('explorer-parents', {})).toBe('Parents')
        expect(resolveExplorerChromeLabel('explorer-go-to-root', {})).toBe('Go to root')
        expect(resolveExplorerChromeLabel('explorer-children', {})).toBe('Children')
        expect(resolveExplorerChromeLabel('explorer-add-entity', {})).toBe('Add entity')
        expect(resolveExplorerChromeLabel('explorer-parent-id-to-add', {})).toBe(
            'Parent id to add'
        )
    })

    it('ignores catalog values that are still the raw code', () => {
        expect(
            resolveExplorerChromeLabel('explorer-go-to-root', {
                'explorer-go-to-root': 'explorer-go-to-root',
            })
        ).toBe('Go to root')
    })

    it('prefers a real catalog label over the EN default', () => {
        expect(
            resolveExplorerChromeLabel('explorer-parents', {
                'explorer-parents': 'Родители',
            })
        ).toBe('Родители')
    })

    it('covers every known explorer chrome code with an EN default', () => {
        for (const [code, label] of Object.entries(EXPLORER_CHROME_DEFAULTS_EN)) {
            expect(label).toBeTruthy()
            expect(label).not.toBe(code)
            expect(resolveExplorerChromeLabel(code, {})).toBe(label)
        }
    })
})
