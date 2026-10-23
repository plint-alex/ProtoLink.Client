import { describe, it, expect } from 'vitest'
import { formatEmailBodyPlaceholder } from './formatEmailBody'

describe('formatEmailBodyPlaceholder', () => {
  it('replaces {email}', () => {
    expect(formatEmailBodyPlaceholder('Link to {email}.', 'a@b.co')).toBe('Link to a@b.co.')
  })

  it('leaves placeholder when email blank', () => {
    expect(formatEmailBodyPlaceholder('Link to {email}.', '  ')).toBe('Link to {email}.')
  })
})
