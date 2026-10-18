import { describe, it, expect } from 'vitest'
import { formatRegisterCheckEmailBody } from './registerCheckEmail'

describe('formatRegisterCheckEmailBody', () => {
  it('substitutes {email}', () => {
    expect(formatRegisterCheckEmailBody('Link to {email}.', 'a@b.co')).toBe('Link to a@b.co.')
  })

  it('leaves template when email empty', () => {
    expect(formatRegisterCheckEmailBody('Link to {email}.', '  ')).toBe('Link to {email}.')
  })
})
