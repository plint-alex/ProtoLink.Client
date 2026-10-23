import { describe, it, expect } from 'vitest'
import { formatRegisterCheckEmailBody } from './registerCheckEmail'

describe('formatRegisterCheckEmailBody', () => {
  it('replaces {email} (compat re-export)', () => {
    expect(formatRegisterCheckEmailBody('Link to {email}.', 'a@b.co')).toBe('Link to a@b.co.')
  })
})
